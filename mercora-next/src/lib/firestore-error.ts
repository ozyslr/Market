/**
 * Firestore error handling — copied from main project
 * Provides sanitized error messages for production
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export class FirestoreError extends Error {
  public readonly info: FirestoreErrorInfo;
  public readonly userId?: string | null;
  public readonly email?: string | null;

  constructor(info: FirestoreErrorInfo, userId?: string | null, email?: string | null) {
    const message = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : JSON.stringify(info);
    super(message);
    this.name = 'FirestoreError';
    this.info = info;
    this.userId = userId;
    this.email = email;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };

  console.error('Firestore Error:', { ...errInfo });

  throw new FirestoreError(errInfo);
}
