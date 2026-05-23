/**
 * POST /api/auth/send-otp
 * Send SMS OTP via Twilio
 *
 * Request body:
 * {
 *   phoneNumber: string (E.164 format)
 *   code: string (6-digit OTP)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   sid?: string (Twilio message SID),
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface SendOTPRequest {
  phoneNumber: string;
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate Twilio credentials
    if (!client || !fromNumber) {
      console.warn('[send-otp] Twilio not configured, using mock response');
      return NextResponse.json({
        success: true,
        isMock: true,
        message: 'OTP sent (mock mode - check logs for code)',
      });
    }

    const body: SendOTPRequest = await request.json();

    // Validate input
    if (!body.phoneNumber || !body.code) {
      return NextResponse.json(
        { error: 'Missing phoneNumber or code' },
        { status: 400 }
      );
    }

    // Validate phone number format (E.164)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(body.phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (+1234567890)' },
        { status: 400 }
      );
    }

    // Send SMS via Twilio
    const message = await client!.messages.create({
      body: `Your Mercora verification code is: ${body.code}. Valid for 10 minutes. Do not share this code.`,
      from: fromNumber,
      to: body.phoneNumber,
    });

    return NextResponse.json({
      success: true,
      sid: message.sid,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('[send-otp] Error sending OTP:', error);

    // Check if it's Twilio-specific error
    if (error instanceof twilio.rest.RestError) {
      return NextResponse.json(
        {
          error: `Twilio error: ${error.message}`,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      },
      { status: 500 }
    );
  }
}
