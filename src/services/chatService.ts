import {
  collection, addDoc, getDocs, getDoc, doc, query, where,
  orderBy, serverTimestamp, onSnapshot, Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

// ─── Types (Admin-User Chat) ──────────────────────────────────────────────

export interface ChatMessage {
  id?: string;
  role: 'user' | 'admin';
  text: string;
  ts: Timestamp | string;
  read?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  subject?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTs?: Timestamp | string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

const SESSIONS_COL = 'chat_sessions';
const MESSAGES_SUB = 'messages';

// ─── Session CRUD ──────────────────────────────────────────────────────────

export async function createChatSession(data: {
  userId: string;
  userName?: string;
  userEmail?: string;
  subject?: string;
  initialMessage: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, SESSIONS_COL), {
      userId: data.userId,
      userName: data.userName ?? '',
      userEmail: data.userEmail ?? '',
      subject: data.subject ?? '',
      status: 'waiting',
      unreadCount: 0,
      lastMessage: data.initialMessage,
      lastMessageTs: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Add first message to subcollection
    await addDoc(collection(db, SESSIONS_COL, ref.id, MESSAGES_SUB), {
      role: 'user',
      text: data.initialMessage,
      ts: serverTimestamp(),
      read: false,
    });

    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SESSIONS_COL);
    throw error;
  }
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  try {
    const snap = await getDoc(doc(db, SESSIONS_COL, sessionId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ChatSession;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SESSIONS_COL}/${sessionId}`);
    return null;
  }
}

export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  try {
    const q = query(
      collection(db, SESSIONS_COL),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SESSIONS_COL);
    return [];
  }
}

export async function getActiveSession(userId: string): Promise<ChatSession | null> {
  try {
    const q = query(
      collection(db, SESSIONS_COL),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'waiting']),
      orderBy('createdAt', 'desc'),
      firestoreLimit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ChatSession;
  } catch {
    return null;
  }
}

export async function closeChatSession(sessionId: string): Promise<void> {
  try {
    const ref = doc(db, SESSIONS_COL, sessionId);
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(ref, {
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SESSIONS_COL}/${sessionId}`);
  }
}

// ─── Messages ──────────────────────────────────────────────────────────────

export async function sendMessage(
  sessionId: string,
  role: 'user' | 'admin',
  text: string,
): Promise<void> {
  try {
    // Add message to subcollection
    await addDoc(collection(db, SESSIONS_COL, sessionId, MESSAGES_SUB), {
      role,
      text,
      ts: serverTimestamp(),
      read: false,
    });

    // Update session metadata
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, SESSIONS_COL, sessionId), {
      lastMessage: text,
      lastMessageTs: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: role === 'admin' ? 'active' : 'waiting',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SESSIONS_COL}/${sessionId}`);
    throw error;
  }
}

/**
 * Real-time subscription to all messages in a session.
 * Returns unsubscribe function.
 */
export function subscribeToMessages(
  sessionId: string,
  onMessages: (messages: ChatMessage[]) => void,
): () => void {
  const q = query(
    collection(db, SESSIONS_COL, sessionId, MESSAGES_SUB),
    orderBy('ts', 'asc'),
  );

  const unsub = onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as ChatMessage));
    onMessages(msgs);
  }, (error) => {
    console.error('Chat snapshot error:', error);
  });

  return unsub;
}

/**
 * Subscribe to session changes (for unread count, status changes).
 */
export function subscribeToSession(
  sessionId: string,
  onSession: (session: ChatSession) => void,
): () => void {
  const unsub = onSnapshot(doc(db, SESSIONS_COL, sessionId), (snap) => {
    if (snap.exists()) {
      onSession({ id: snap.id, ...snap.data() } as ChatSession);
    }
  });

  return unsub;
}

/**
 * Mark all unread user messages as read (call when admin opens chat).
 */
export async function markMessagesAsRead(sessionId: string): Promise<void> {
  try {
    const q = query(
      collection(db, SESSIONS_COL, sessionId, MESSAGES_SUB),
      where('read', '==', false),
      where('role', '==', 'user'),
    );
    const snap = await getDocs(q);
    const { updateDoc } = await import('firebase/firestore');
    const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
    await Promise.all(updates);
  } catch {
    // silent
  }
}

// ─── Admin: Get all sessions ───────────────────────────────────────────────

export async function getAllChatSessions(): Promise<ChatSession[]> {
  try {
    const q = query(
      collection(db, SESSIONS_COL),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SESSIONS_COL);
    return [];
  }
}

// ─── Peer-to-Peer Conversation Types ───────────────────────────────────────

export interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  productId?: string;
  productTitle?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadBuyer: number;
  unreadSeller: number;
}

export interface ConversationMessage {
  id?: string;
  senderId: string;
  text: string;
  ts: Timestamp | string;
  read: boolean;
}

const CONVERSATIONS_COL = 'conversations';
const CONVERSATION_MESSAGES_SUB = 'messages';

// ─── Peer-to-Peer Conversation Functions ───────────────────────────────────

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const buyerQ = query(
      collection(db, CONVERSATIONS_COL),
      where('buyerId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
    );
    const sellerQ = query(
      collection(db, CONVERSATIONS_COL),
      where('sellerId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
    );

    const [buyerSnap, sellerSnap] = await Promise.all([getDocs(buyerQ), getDocs(sellerQ)]);
    const map = new Map<string, Conversation>();
    [...buyerSnap.docs, ...sellerSnap.docs].forEach(d => {
      if (!map.has(d.id)) {
        map.set(d.id, { id: d.id, ...d.data() } as Conversation);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CONVERSATIONS_COL);
    return [];
  }
}

export async function getOrCreateConversation(
  buyerId: string, sellerId: string, productId?: string, productTitle?: string,
): Promise<string> {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COL),
      where('buyerId', '==', buyerId),
      where('sellerId', '==', sellerId),
    );
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;

    const ref = await addDoc(collection(db, CONVERSATIONS_COL), {
      buyerId,
      sellerId,
      productId: productId ?? '',
      productTitle: productTitle ?? '',
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadBuyer: 0,
      unreadSeller: 0,
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CONVERSATIONS_COL);
    throw error;
  }
}

export async function sendConversationMessage(
  conversationId: string, senderId: string, text: string,
): Promise<void> {
  try {
    await addDoc(collection(db, CONVERSATIONS_COL, conversationId, CONVERSATION_MESSAGES_SUB), {
      senderId,
      text,
      ts: serverTimestamp(),
      read: false,
    });

    const convSnap = await getDoc(doc(db, CONVERSATIONS_COL, conversationId));
    if (!convSnap.exists()) return;
    const convData = convSnap.data();
    const { updateDoc } = await import('firebase/firestore');

    if (senderId === convData.buyerId) {
      await updateDoc(doc(db, CONVERSATIONS_COL, conversationId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadSeller: (convData.unreadSeller ?? 0) + 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, CONVERSATIONS_COL, conversationId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadBuyer: (convData.unreadBuyer ?? 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CONVERSATIONS_COL}/${conversationId}`);
    throw error;
  }
}

export async function getConversationMessages(
  conversationId: string, msgLimit?: number,
): Promise<ConversationMessage[]> {
  try {
    const constraints = [orderBy('ts', 'asc')] as const;
    const q = msgLimit
      ? query(collection(db, CONVERSATIONS_COL, conversationId, CONVERSATION_MESSAGES_SUB),
          ...constraints, firestoreLimit(msgLimit))
      : query(collection(db, CONVERSATIONS_COL, conversationId, CONVERSATION_MESSAGES_SUB),
          ...constraints);

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConversationMessage));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST,
      `${CONVERSATIONS_COL}/${conversationId}/${CONVERSATION_MESSAGES_SUB}`);
    return [];
  }
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  try {
    const convSnap = await getDoc(doc(db, CONVERSATIONS_COL, conversationId));
    if (!convSnap.exists()) return;
    const convData = convSnap.data();
    const { updateDoc } = await import('firebase/firestore');

    if (userId === convData.buyerId) {
      await updateDoc(doc(db, CONVERSATIONS_COL, conversationId), { unreadBuyer: 0 });
    } else if (userId === convData.sellerId) {
      await updateDoc(doc(db, CONVERSATIONS_COL, conversationId), { unreadSeller: 0 });
    }
  } catch {
    // silent
  }
}

/**
 * Subscribe to messages in a conversation (realtime).
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessages: (messages: ConversationMessage[]) => void,
): () => void {
  const q = query(
    collection(db, CONVERSATIONS_COL, conversationId, CONVERSATION_MESSAGES_SUB),
    orderBy('ts', 'asc'),
  );

  const unsub = onSnapshot(q, (snap) => {
    onMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ConversationMessage)));
  }, (error) => {
    console.error('Conversation messages snapshot error:', error);
  });

  return unsub;
}
