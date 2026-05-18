import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc,
  query, where, orderBy, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export type TicketCategory = 'order' | 'payment' | 'return' | 'account' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  role: 'user' | 'admin';
  text: string;
  ts: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

const COL = 'support_tickets';

export async function createTicket(data: Omit<SupportTicket, 'id' | 'createdAt' | 'messages'> & { initialMessage: string }): Promise<string> {
  try {
    const { initialMessage, ...rest } = data;
    const ref = await addDoc(collection(db, COL), {
      ...rest,
      messages: [{ role: 'user', text: initialMessage, ts: new Date().toISOString() }],
      status: 'open' as TicketStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
  try {
    const q = query(collection(db, COL), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getAllTickets(): Promise<SupportTicket[]> {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function addTicketMessage(ticketId: string, message: TicketMessage): Promise<void> {
  try {
    await updateDoc(doc(db, COL, ticketId), {
      messages: arrayUnion(message),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${ticketId}`);
    throw error;
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  try {
    await updateDoc(doc(db, COL, ticketId), { status, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${ticketId}`);
    throw error;
  }
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority): Promise<void> {
  try {
    await updateDoc(doc(db, COL, ticketId), { priority, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${ticketId}`);
    throw error;
  }
}
