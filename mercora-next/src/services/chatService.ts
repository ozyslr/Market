import {
  collection, addDoc, getDocs, getDoc, doc, query, where,
  orderBy, serverTimestamp, Timestamp, onSnapshot,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

// ─── Types ─────────────────────────────────────────────────────────────────

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
    await addDoc(collection(db, SESSIONS_COL, sessionId, MESSAGES_SUB), {
      role,
      text,
      ts: serverTimestamp(),
      read: false,
    });

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
