'use client';

/**
 * Phone Login Flow (STREAM E)
 * SMS OTP verification for phone-first signup/login
 * 2-step flow:
 * Step 1: Enter phone number
 * Step 2: Verify OTP code
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { PhoneIcon, CheckCircle } from 'lucide-react';
import {
  sendPhoneOTP,
  verifyOTP,
  validatePhoneNumber,
} from '@/services/phoneAuthService';

type AuthStep = 'phone' | 'otp' | 'success';

interface PhoneLoginFlowProps {
  onSuccess?: (data: { phoneNumber: string; verified: boolean }) => void;
  onError?: (error: Error) => void;
  region?: string;
}

const STEPS: AuthStep[] = ['phone', 'otp', 'success'];
const STEP_LABELS = {
  phone: 'Enter Phone',
  otp: 'Verify Code',
  success: 'Success',
};

export default function PhoneLoginFlow({
  onSuccess,
  onError,
  region = 'TR',
}: PhoneLoginFlowProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpId, setOtpId] = useState<string>();
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const currentStep = STEPS[activeStep];

  // Send OTP to phone number
  const handleSendOTP = useCallback(async () => {
    setErrors({});

    try {
      setLoading(true);

      // Validate phone number
      const validated = validatePhoneNumber(phoneNumber);
      if (!validated) {
        setErrors({ phone: 'Invalid phone number. Use format: +1234567890 or 1234567890' });
        return;
      }

      // Send OTP
      const otp = await sendPhoneOTP(phoneNumber);
      setOtpId(otp.id);

      // Countdown for resend
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setActiveStep(1);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, onError]);

  // Verify OTP code
  const handleVerifyOTP = useCallback(async () => {
    setErrors({});

    try {
      setLoading(true);

      if (!otpId) {
        throw new Error('OTP session not found');
      }

      if (!otpCode || otpCode.length !== 6) {
        setErrors({ otp: 'Please enter 6-digit code' });
        return;
      }

      // Verify OTP
      const result = await verifyOTP(otpId, phoneNumber, otpCode);

      if (!result.verified) {
        setErrors({ otp: result.error || 'Invalid code' });
        return;
      }

      // Success
      setActiveStep(2);
      setTimeout(() => {
        onSuccess?.({
          phoneNumber,
          verified: true,
        });
      }, 1000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }, [otpId, phoneNumber, otpCode, onSuccess, onError]);

  // Handle resend OTP
  const handleResendOTP = useCallback(async () => {
    try {
      setLoading(true);

      if (!otpId) {
        throw new Error('OTP session not found');
      }

      const result = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpId,
          phoneNumber,
        }),
      });

      if (!result.ok) {
        const data = await result.json();
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setOtpCode('');
      setResendCountdown(60);

      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }, [otpId, phoneNumber]);

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setErrors({});
    }
  }, [activeStep]);

  return (
    <Box sx={{ maxWidth: 450, mx: 'auto' }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PhoneIcon size={24} />
            <Typography variant="h5">Phone Verification</Typography>
          </Box>

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          <Stepper activeStep={activeStep} orientation="vertical">
            {/* STEP 1: Phone Number */}
            <Step active={activeStep >= 0}>
              <StepLabel>{STEP_LABELS.phone}</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                  <TextField
                    label="Phone Number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setErrors({});
                    }}
                    fullWidth
                    required
                    disabled={loading}
                    placeholder="+90 555 123 4567"
                    error={!!errors.phone}
                    helperText={errors.phone || `Region: ${region}`}
                  />

                  <Alert severity="info">
                    ℹ️ We'll send a 6-digit verification code to this phone number via SMS.
                  </Alert>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSendOTP}
                    disabled={!phoneNumber || loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Send Code'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* STEP 2: OTP Verification */}
            <Step active={activeStep >= 1}>
              <StepLabel>{STEP_LABELS.otp}</StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    We sent a code to <strong>{phoneNumber}</strong>
                  </Typography>

                  <TextField
                    label="Verification Code"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      setErrors({});
                    }}
                    fullWidth
                    required
                    disabled={loading}
                    placeholder="000000"
                    error={!!errors.otp}
                    helperText={errors.otp}
                    maxLength={6}
                    inputProps={{ inputMode: 'numeric' }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      disabled={resendCountdown > 0 || loading}
                      onClick={handleResendOTP}
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </Button>
                    <Typography variant="caption" color="textSecondary">
                      Code expires in 10 minutes
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                  <Button onClick={handleBack} disabled={loading}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleVerifyOTP}
                    disabled={otpCode.length !== 6 || loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Verify'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* STEP 3: Success */}
            <Step active={activeStep >= 2}>
              <StepLabel>{STEP_LABELS.success}</StepLabel>
              <StepContent>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    py: 4,
                  }}
                >
                  <CheckCircle size={48} color="green" />
                  <Typography variant="h6">Verification Successful!</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Your phone number has been verified. You can now log in or create an account.
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );
}
