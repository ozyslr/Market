'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Your Password
        </Typography>

        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ mb: 4 }}
        >
          Enter your email address and we&apos;ll send you instructions to reset
          your password.
        </Typography>

        <ForgotPasswordForm
          onBack={() => {
            window.location.href = '/auth/login';
          }}
        />
      </Paper>
    </Container>
  );
}
