import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export type TicketStatus = 'open' | 'awaiting_reply' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'order' | 'payment' | 'account' | 'seller' | 'technical' | 'other';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  orderId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  message: string;
  isStaff: boolean;
  attachments?: string[];
  createdAt: string;
}

const TICKETS_COL = 'supportTickets';
const REPLIES_COL = 'supportReplies';

export async function createTicket(data: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, TICKETS_COL), { ...data, createdAt: now, updatedAt: now });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TICKETS_COL);
    throw error;
  }
}

export async function getTickets(status?: TicketStatus): Promise<SupportTicket[]> {
  try {
    const constraints: any[] = [];
    if (status) constraints.push(where('status', '==', status));
    constraints.push(orderBy('createdAt', 'desc'));
    const q = query(collection(db, TICKETS_COL), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TICKETS_COL);
    return [];
  }
}

export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TICKETS_COL);
    return [];
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  assignedTo?: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, TICKETS_COL, ticketId), {
      status,
      assignedTo: assignedTo ?? null,
      updatedAt: new Date().toISOString(),
      resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TICKETS_COL}/${ticketId}`);
    throw error;
  }
}

export async function addReply(data: Omit<TicketReply, 'id' | 'createdAt'>): Promise<string> {
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, REPLIES_COL), { ...data, createdAt: now });

    await updateDoc(doc(db, TICKETS_COL, data.ticketId), {
      status: 'awaiting_reply',
      updatedAt: now,
    });

    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REPLIES_COL);
    throw error;
  }
}

export async function getReplies(ticketId: string): Promise<TicketReply[]> {
  try {
    const q = query(
      collection(db, REPLIES_COL),
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TicketReply));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPLIES_COL);
    return [];
  }
}

export async function deleteTicket(ticketId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TICKETS_COL, ticketId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TICKETS_COL}/${ticketId}`);
  }
}
