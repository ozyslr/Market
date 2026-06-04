export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'label_sent'
  | 'received'
  | 'refunded';

export type ReturnReason = 'wrong_item' | 'damaged' | 'not_as_described' | 'changed_mind' | 'other';

export interface ReturnRequest {
  id: string;
  orderSetId: string;
  subOrderId: string;
  buyerId: string;
  sellerId: string;
  reason: ReturnReason;
  notes?: string;
  status: ReturnStatus;
  returnTrackingNumber?: string;
  returnLabelUrl?: string;
  approvedBy?: string;
  rejectionReason?: string;
  refundId?: string;
  ledgerEntryIds?: string[];
  createdAt: string;
  updatedAt: string;
  /** deliveredAt + 14 days ISO — return window expiry */
  windowExpiresAt: string;
}
