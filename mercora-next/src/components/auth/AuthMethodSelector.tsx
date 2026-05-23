'use client';

/**
 * Auth Method Selector (STREAM E)
 * Unified login/signup with multiple auth methods:
 * - Phone (SMS OTP)
 * - Email (traditional)
 * - Google OAuth
 * - Facebook OAuth
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Avatar,
  Stack,
} from '@mui/material';
import { Mail, Phone, Globe } from 'lucide-react';
import PhoneLoginFlow from './PhoneLoginFlow';

type AuthMethod = 'select' | 'phone' | 'email' | 'google' | 'facebook';

interface AuthMethodSelectorProps {
  onSuccess?: (data: { method: string; userId?: string; phoneNumber?: string }) => void;
  onError?: (error: Error) => void;
  mode?: 'login' | 'signup';
  region?: string;
}

export default function AuthMethodSelector({
  onSuccess,
  onError,
  mode = 'signup',
  region = 'TR',
}: AuthMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('select');

  // Handle phone auth success
  const handlePhoneSuccess = (data: { phoneNumber: string; verified: boolean }) => {
    onSuccess?.({
      method: 'phone',
      phoneNumber: data.phoneNumber,
    });
  };

  // Handle Google OAuth
  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth flow
    // In production: initiate OAuth redirect or use popup
    window.location.href = `/api/auth/oauth/google?redirectUri=${encodeURIComponent(window.location.origin)}`;
  };

  // Handle Facebook OAuth
  const handleFacebookAuth = () => {
    // TODO: Implement Facebook OAuth flow
    window.location.href = `/api/auth/oauth/facebook?redirectUri=${encodeURIComponent(window.location.origin)}`;
  };

  if (selectedMethod === 'phone') {
    return (
      <PhoneLoginFlow
        onSuccess={handlePhoneSuccess}
        onError={onError}
        region={region}
      />
    );
  }

  // Method selection screen
  return (
    <Box sx={{ maxWidth: 450, mx: 'auto' }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            {mode === 'signup' ? 'Create Account' : 'Log In'}
          </Typography>

          <Stack spacing={2}>
            {/* Phone Login */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setSelectedMethod('phone')}
              sx={{
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 2,
              }}
            >
              <Phone size={20} />
              <Box sx={{ textAlign: 'left', flex: 1 }}>
                <Typography variant="subtitle1">Phone Number</Typography>
                <Typography variant="caption" color="textSecondary">
                  Via SMS OTP
                </Typography>
              </Box>
            </Button>

            {/* Email Login */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setSelectedMethod('email')}
              sx={{
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 2,
              }}
            >
              <Mail size={20} />
              <Box sx={{ textAlign: 'left', flex: 1 }}>
                <Typography variant="subtitle1">Email Address</Typography>
                <Typography variant="caption" color="textSecondary">
                  Traditional login
                </Typography>
              </Box>
            </Button>

            <Divider sx={{ my: 1 }}>or</Divider>

            {/* Google OAuth */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleAuth}
              sx={{
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
              }}
            >
              <Avatar
                src="https://www.gstatic.com/images/branding/product/1x/googleg_standard_color_128dp.png"
                sx={{ width: 20, height: 20 }}
              />
              Continue with Google
            </Button>

            {/* Facebook OAuth */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleFacebookAuth}
              sx={{
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                backgroundColor: 'rgb(59, 89, 152)',
                color: 'white',
                borderColor: 'rgb(59, 89, 152)',
                '&:hover': {
                  backgroundColor: 'rgb(40, 60, 120)',
                  borderColor: 'rgb(40, 60, 120)',
                },
              }}
            >
              <Avatar
                src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/></svg>"
                sx={{ width: 20, height: 20 }}
              />
              Continue with Facebook
            </Button>
          </Stack>

          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', textAlign: 'center', mt: 3 }}
          >
            {mode === 'signup'
              ? 'Already have an account? Log in'
              : "Don't have an account? Sign up"}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
