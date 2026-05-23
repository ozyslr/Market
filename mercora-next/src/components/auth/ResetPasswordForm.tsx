'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  LinearProgress,
} from '@mui/material';
import { emailAuthService } from '@/services/emailAuthService';
import { useRouter, useSearchParams } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PasswordStrengthIndicator {
  score: number;
  label: string;
  color: 'error' | 'warning' | 'success';
}

export const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrengthIndicator>({ score: 0, label: '', color: 'error' });

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (!token) {
      setError('Invalid reset link');
      setVerifying(false);
      return;
    }

    try {
      const result = await emailAuthService.verifyPasswordResetToken(token);
      if (result.valid) {
        setTokenValid(true);
      } else {
        setError('Reset link has expired. Please request a new one.');
      }
    } catch (err) {
      setError('Invalid or expired reset link');
      console.error('Token verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const calculatePasswordStrength = (pwd: string): PasswordStrengthIndicator => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    const strengths: PasswordStrengthIndicator[] = [
      { score: 0, label: '', color: 'error' },
      { score: 1, label: 'Very Weak', color: 'error' },
      { score: 2, label: 'Weak', color: 'error' },
      { score: 3, label: 'Fair', color: 'warning' },
      { score: 4, label: 'Good', color: 'warning' },
      { score: 5, label: 'Strong', color: 'success' },
      { score: 6, label: 'Very Strong', color: 'success' },
    ];

    return strengths[Math.min(score, 6)];
  };

  const validateForm = (): boolean => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    const strength = calculatePasswordStrength(password);
    if (strength.score < 3) {
      setError('Password is too weak');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm() || !token) return;

    setLoading(true);
    try {
      const result = await emailAuthService.resetPasswordWithToken(
        token,
        password
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tokenValid) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => router.push('/auth/forgot-password')}
        >
          Request New Reset Link
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleIcon
          sx={{ fontSize: 48, color: 'success.main', mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          Password Reset Successfully
        </Typography>
        <Typography variant="body2" color="textSecondary">
          You can now log in with your new password.
        </Typography>
      </Box>
    );
  }

  const strength = calculatePasswordStrength(password);

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          fullWidth
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordStrength(calculatePasswordStrength(e.target.value));
          }}
          disabled={loading}
          required
          variant="outlined"
          helperText="Minimum 8 characters, mix of uppercase, lowercase, numbers, and symbols"
        />

        {password && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="caption">Password Strength</Typography>
              <Typography
                variant="caption"
                sx={{ color: `${strength.color}.main` }}
              >
                {strength.label}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(strength.score / 6) * 100}
              sx={{ backgroundColor: `${strength.color}.light` }}
            />
          </Box>
        )}

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
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
          {loading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>
      </Stack>
    </Box>
  );
};

export default ResetPasswordForm;
