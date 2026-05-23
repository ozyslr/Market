'use client';

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Enter a new password to reset your account password.
        </Alert>

        <ResetPasswordForm />
      </Paper>
    </Container>
  );
}
