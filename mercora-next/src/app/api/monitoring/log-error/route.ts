/**
 * POST /api/monitoring/log-error
 * Receives error logs from client for monitoring and analysis
 *
 * Request body:
 * {
 *   message: string
 *   stack?: string
 *   context: string
 *   severity: 'info' | 'warning' | 'error' | 'critical'
 *   type?: 'user' | 'system' | 'external' | 'validation'
 *   url?: string
 *   userAgent?: string
 *   timestamp?: string
 *   metadata?: object
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   id?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ErrorLogRequest {
  id?: string;
  message: string;
  stack?: string;
  context: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type?: 'user' | 'system' | 'external' | 'validation';
  url?: string;
  userAgent?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  componentStack?: string;
  batch?: ErrorLogRequest[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ErrorLogRequest = await request.json();

    // Handle batch errors
    if (body.batch && Array.isArray(body.batch)) {
      const errors = body.batch.map((error) => ({
        ...error,
        storedAt: Timestamp.now(),
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      }));

      const logsRef = collection(db, 'error_logs');
      for (const error of errors) {
        await addDoc(logsRef, error);
      }

      return NextResponse.json({
        success: true,
        count: errors.length,
      });
    }

    // Single error log
    const errorLog = {
      id: body.id || `err_${Date.now()}`,
      message: body.message,
      stack: body.stack,
      context: body.context,
      severity: body.severity || 'error',
      type: body.type || 'system',
      url: body.url,
      userAgent: body.userAgent,
      userId: body.userId,
      timestamp: body.timestamp || new Date().toISOString(),
      metadata: body.metadata || {},
      componentStack: body.componentStack,
      storedAt: Timestamp.now(),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    };

    // Store in Firestore
    const logsRef = collection(db, 'error_logs');
    const doc_ref = await addDoc(logsRef, errorLog);

    // Alert on critical errors
    if (body.severity === 'critical') {
      console.error('[monitoring] CRITICAL ERROR:', errorLog);
      // TODO: Send Slack/email alert
    }

    return NextResponse.json({
      success: true,
      id: doc_ref.id,
    });
  } catch (error) {
    console.error('[log-error] Error logging error:', error);

    // Still return success so client doesn't retry
    return NextResponse.json(
      { success: true, warning: 'Error log storage failed' },
      { status: 200 }
    );
  }
}
