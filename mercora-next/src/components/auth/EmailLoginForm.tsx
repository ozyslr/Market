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
import { useRouter } from 'next/navigation';

interface EmailLoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export const EmailLoginForm: React.FC<EmailLoginFormProps> = ({
  onSuccess,
  onForgotPassword,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
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

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await emailAuthService.loginWithEmail(email, password);
      if (result.success) {
        if (onSuccess) onSuccess();
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
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

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="current-password"
          required
          variant="outlined"
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => onForgotPassword?.()}
            sx={{ cursor: 'pointer' }}
          >
            Forgot password?
          </Link>
        </Box>

        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Log In'}
        </Button>

        <Typography variant="body2" align="center" color="textSecondary">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};

export default EmailLoginForm;
