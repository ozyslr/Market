'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Typography,
  Stack,
} from '@mui/material';
import { emailAuthService } from '@/services/emailAuthService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) return;

    setLoading(true);
    try {
      const result = await emailAuthService.requestPasswordReset(email);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleIcon
          sx={{ fontSize: 48, color: 'success.main', mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          Check Your Email
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          We&apos;ve sent a password reset link to <strong>{email}</strong>.
          Click the link in the email to reset your password.
        </Typography>
        <Typography variant="caption" color="textSecondary">
          The link will expire in 1 hour.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
          >
            Send Another Email
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <Typography variant="body2" color="textSecondary">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
          required
          variant="outlined"
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => onBack?.()}
            sx={{ cursor: 'pointer' }}
          >
            Back to Login
          </Link>
        </Box>
      </Stack>
    </Box>
  );
};

export default ForgotPasswordForm;
