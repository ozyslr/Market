'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import SecurityIcon from '@mui/icons-material/Security';
import { twoFactorService } from '@/services/twoFactorService';

interface TwoFactorSetupProps {
  userId: string;
  email: string;
  onComplete?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  userId,
  email,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [method, setMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const generateSecret = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, method }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate 2FA secret');
      }

      const data = await response.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
          method,
          secret,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setActiveStep(2);
      // Generate backup codes locally (in production: from server)
      const codes = twoFactorService.generateBackupCodes();
      setBackupCodes(codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleComplete = () => {
    onComplete?.();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon /> Set Up Two-Factor Authentication
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
          <Step>
            <StepLabel>Choose Method</StepLabel>
          </Step>
          <Step>
            <StepLabel>Verify Code</StepLabel>
          </Step>
          <Step>
            <StepLabel>Save Backup Codes</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Select 2FA Method</FormLabel>
              <RadioGroup
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                sx={{ mt: 2 }}
              >
                <FormControlLabel
                  value="totp"
                  control={<Radio />}
                  label="Authenticator App (TOTP) - Most Secure"
                  disabled={isLoading}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Use Google Authenticator, Microsoft Authenticator, or Authy
                </Typography>

                <FormControlLabel
                  value="sms"
                  control={<Radio />}
                  label="SMS Text Message"
                  disabled={isLoading}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Receive codes via text to your phone
                </Typography>

                <FormControlLabel
                  value="email"
                  control={<Radio />}
                  label="Email Codes"
                  disabled={isLoading}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Receive codes via email
                </Typography>
              </RadioGroup>
            </FormControl>

            <Button
              variant="contained"
              fullWidth
              onClick={generateSecret}
              disabled={isLoading}
              sx={{ mt: 3 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Continue'}
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            {method === 'totp' && qrCode && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Scan this QR code with your authenticator app:
                </Typography>
                {/* In production: render actual QR code image */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    my: 2,
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    QR Code: {qrCode.substring(0, 50)}...
                  </Typography>
                </Paper>

                <Typography variant="body2" gutterBottom>
                  Or enter this code manually:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    p: 1,
                    borderRadius: 1,
                  }}
                  onClick={() => copyToClipboard(secret)}
                >
                  {secret}
                  <FileCopyIcon sx={{ fontSize: 16, ml: 1 }} />
                </Typography>
              </Box>
            )}

            <TextField
              label="Verification Code"
              placeholder="000000"
              fullWidth
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6, style: { letterSpacing: '0.5em', fontSize: '1.5em' } }}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Verify Code'}
            </Button>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Save your backup codes in a safe place. You can use them if you lose access to your authenticator.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
              <List dense>
                {backupCodes.map((code, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Chip label={idx + 1} size="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={<code style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>{code}</code>}
                      primaryTypographyProps={{ sx: { cursor: 'pointer' } }}
                      onClick={() => copyToClipboard(code)}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                const text = backupCodes.join('\n');
                navigator.clipboard.writeText(text);
              }}
              sx={{ mb: 2 }}
            >
              Copy All Codes
            </Button>

            <Button
              variant="contained"
              fullWidth
              onClick={handleComplete}
              startIcon={<CheckCircleIcon />}
            >
              Complete Setup
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
