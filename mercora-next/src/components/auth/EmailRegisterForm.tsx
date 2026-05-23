'use client';

/**
 * Email Registration Form (STREAM F)
 * Register with email and password
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Link,
} from '@mui/material';
import { Mail, Lock, User } from 'lucide-react';
import { registerWithEmail, validatePasswordStrength } from '@/services/emailAuthService';

interface EmailRegisterFormProps {
  onSuccess?: (data: { userId: string; email: string }) => void;
  onError?: (error: Error) => void;
}

export default function EmailRegisterForm({ onSuccess, onError }: EmailRegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      setSuccessMessage('');

      try {
        setLoading(true);

        // Validate fields
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        }

        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else {
          const validation = validatePasswordStrength(formData.password);
          if (!validation.valid) {
            newErrors.password = validation.errors[0];
          }
        }

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'You must accept the terms and conditions';
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }

        // Register
        const result = await registerWithEmail(formData.email, formData.password, formData.name);

        setSuccessMessage('Registration successful! Please check your email to verify your account.');

        setTimeout(() => {
          onSuccess?.({
            userId: result.userId,
            email: formData.email,
          });
        }, 2000);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        setErrors({ submit: err.message });
      } finally {
        setLoading(false);
      }
    },
    [formData, onSuccess, onError]
  );

  return (
    <Box sx={{ maxWidth: 450, mx: 'auto' }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Mail size={24} />
            <Typography variant="h5">Create Account</Typography>
          </Box>

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* Name */}
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                fullWidth
                required
                disabled={loading}
                error={!!errors.name}
                helperText={errors.name}
                startAdornment={<User size={16} style={{ marginRight: 8 }} />}
              />

              {/* Email */}
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                fullWidth
                required
                disabled={loading}
                error={!!errors.email}
                helperText={errors.email}
                startAdornment={<Mail size={16} style={{ marginRight: 8 }} />}
              />

              {/* Password */}
              <TextField
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                fullWidth
                required
                disabled={loading}
                error={!!errors.password}
                helperText={errors.password || 'Min 8 chars, uppercase, lowercase, number, special char'}
                startAdornment={<Lock size={16} style={{ marginRight: 8 }} />}
              />

              {/* Confirm Password */}
              <TextField
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                fullWidth
                required
                disabled={loading}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                startAdornment={<Lock size={16} style={{ marginRight: 8 }} />}
              />

              {/* Terms */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    disabled={loading}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link href="/terms" underline="hover">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" underline="hover">
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
              {errors.acceptTerms && (
                <Typography variant="caption" color="error">
                  {errors.acceptTerms}
                </Typography>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>

              {/* Login Link */}
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <Link href="/auth/email/login" underline="hover">
                  Log in here
                </Link>
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
