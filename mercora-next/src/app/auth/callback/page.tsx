'use client';

/**
 * /auth/callback
 * OAuth callback page
 * Handles redirect from OAuth providers and displays result
 */

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    if (success === 'true') {
      // Redirect to dashboard after 2 seconds
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!success && !error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Card sx={{ maxWidth: 400 }}>
          <CardContent sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Processing authentication...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Card sx={{ maxWidth: 400 }}>
          <CardContent sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <AlertCircle size={48} color="red" />
              <Typography variant="h6">Authentication Failed</Typography>
              <Alert severity="error">{decodeURIComponent(error)}</Alert>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer', mt: 2 }}
                onClick={() => router.push('/auth')}
              >
                ← Try again
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Card sx={{ maxWidth: 400 }}>
        <CardContent sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CheckCircle size={48} color="green" />
          <Typography variant="h6">Authentication Successful!</Typography>
          <Typography variant="body2" color="textSecondary">
            Redirecting to dashboard...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
