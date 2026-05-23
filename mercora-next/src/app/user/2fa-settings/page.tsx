'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import DevicesIcon from '@mui/icons-material/Devices';
import LockIcon from '@mui/icons-material/Lock';
import { twoFactorService } from '@/services/twoFactorService';

interface TrustedDevice {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastUsed: Date;
  trustedUntil: Date;
}

interface AuditLog {
  event: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export default function TwoFactorSettingsPage() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'sms' | 'email' | null>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [isLoading, setIsLoading] = useState(false);

  // TOTP setup
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQRCode, setTotpQRCode] = useState('');
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  // SMS setup
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationSmsCode, setVerificationSmsCode] = useState('');

  // Device management
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'audit'>(
    'overview'
  );

  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableConfirmation, setDisableConfirmation] = useState('');

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      // Mock loading user 2FA settings
      setTwoFAEnabled(true);
      setTwoFAMethod('totp');

      // Mock trusted devices
      const mockDevices: TrustedDevice[] = [
        {
          id: 'device_1',
          deviceName: 'Personal Laptop',
          ipAddress: '192.168.1.100',
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          trustedUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'device_2',
          deviceName: 'Mobile Phone',
          ipAddress: '203.45.67.89',
          lastUsed: new Date(Date.now() - 12 * 60 * 60 * 1000),
          trustedUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      ];

      // Mock audit logs
      const mockLogs: AuditLog[] = [
        {
          event: 'setup_2fa',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          metadata: { method: 'totp' },
        },
        {
          event: 'verify_2fa',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metadata: { deviceName: 'Personal Laptop' },
        },
        {
          event: 'failed_2fa',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          metadata: { attempts: 2 },
        },
        {
          event: 'device_trusted',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          metadata: { deviceName: 'Mobile Phone' },
        },
      ];

      setTrustedDevices(mockDevices);
      setAuditLogs(mockLogs);
    } catch (error) {
      console.error('Load 2FA settings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setSetupStep(0);
    setIsLoading(true);

    try {
      if (selectedMethod === 'totp') {
        // Generate TOTP secret
        const { secret, qrCode, manualEntry } = await twoFactorService.generateTOTPSecret(
          'user_123',
          'user@example.com'
        );
        setTotpSecret(manualEntry);
        setTotpQRCode(qrCode);

        // Generate backup codes
        const codes = twoFactorService.generateBackupCodes();
        setBackupCodes(codes);
      }

      setSetupDialogOpen(true);
    } catch (error) {
      console.error('Setup 2FA error:', error);
      alert('Failed to start 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!totpVerificationCode) {
      alert('Please enter verification code');
      return;
    }

    if (!backupCodesSaved) {
      alert('Please save backup codes before continuing');
      return;
    }

    try {
      // In production: call twoFactorService.enable2FA()
      const verified = twoFactorService.verifyTOTPCode(totpSecret, totpVerificationCode);

      if (!verified) {
        alert('Invalid verification code');
        return;
      }

      setTwoFAEnabled(true);
      setTwoFAMethod('totp');
      setSetupDialogOpen(false);
      setSetupStep(0);
      alert('2FA enabled successfully!');
    } catch (error) {
      console.error('Enable 2FA error:', error);
      alert('Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    if (disableConfirmation !== 'DISABLE') {
      alert('Please type DISABLE to confirm');
      return;
    }

    try {
      // In production: call twoFactorService.disable2FA()
      console.log('Disabling 2FA');
      setTwoFAEnabled(false);
      setTwoFAMethod(null);
      setDisableDialogOpen(false);
      setDisableConfirmation('');
      alert('2FA has been disabled');
    } catch (error) {
      console.error('Disable 2FA error:', error);
      alert('Failed to disable 2FA');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      // In production: call twoFactorService.removeTrustedDevice()
      setTrustedDevices((prev) => prev.filter((d) => d.id !== deviceId));
      alert('Device removed');
    } catch (error) {
      console.error('Remove device error:', error);
      alert('Failed to remove device');
    }
  };

  const handleCopyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Backup code copied to clipboard');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'totp':
        return <VpnKeyIcon />;
      case 'sms':
        return <PhoneIcon />;
      case 'email':
        return <EmailIcon />;
      default:
        return null;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'totp':
        return 'Authenticator App (TOTP)';
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      default:
        return 'Unknown';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LockIcon fontSize="large" />
          Two-Factor Authentication
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Secure your account with an additional layer of protection
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Status Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Two-Factor Authentication Status
                  </Typography>
                  {twoFAEnabled ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Enabled"
                        color="success"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Using {getMethodName(twoFAMethod || 'unknown')}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip
                      label="Disabled"
                      variant="outlined"
                      color="default"
                    />
                  )}
                </Box>
                {twoFAEnabled ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDisableDialogOpen(true)}
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleSetup2FA}
                  >
                    Enable 2FA
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {twoFAEnabled && (
            <>
              {/* Trusted Devices */}
              <Card sx={{ mb: 4 }}>
                <CardHeader
                  title="Trusted Devices"
                  avatar={<DevicesIcon />}
                  subheader={`${trustedDevices.length} device(s) trusted for 30 days`}
                />
                <CardContent>
                  {trustedDevices.length === 0 ? (
                    <Alert severity="info">
                      No trusted devices yet. Enable 2FA and select "Remember this device" to add
                      trusted devices.
                    </Alert>
                  ) : (
                    <List>
                      {trustedDevices.map((device) => (
                        <ListItem key={device.id}>
                          <ListItemText
                            primary={device.deviceName}
                            secondary={
                              <>
                                <Typography variant="caption" display="block">
                                  IP: {device.ipAddress}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Last used: {new Date(device.lastUsed).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Trusted until:{' '}
                                  {new Date(device.trustedUntil).toLocaleDateString()}
                                </Typography>
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleRemoveDevice(device.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              {/* Security Audit Log */}
              <Card>
                <CardHeader
                  title="Security Audit Log"
                  subheader="Recent authentication events"
                />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Event</TableCell>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditLogs.map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Chip
                                label={log.event.replace(/_/g, ' ').toUpperCase()}
                                size="small"
                                color={
                                  log.event === 'failed_2fa'
                                    ? 'error'
                                    : log.event === 'setup_2fa'
                                      ? 'success'
                                      : 'default'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {new Date(log.timestamp).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {log.metadata && (
                                <Typography variant="caption">
                                  {JSON.stringify(log.metadata).slice(1, -1)}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Setup 2FA Dialog */}
      <Dialog
        open={setupDialogOpen}
        onClose={() => setSetupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stepper activeStep={setupStep} sx={{ mb: 3 }}>
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

          {setupStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select your preferred 2FA method. TOTP apps like Google Authenticator are most
                secure.
              </Alert>
              <Grid container spacing={2}>
                {(['totp', 'sms', 'email'] as const).map((method) => (
                  <Grid item xs={12} key={method}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedMethod === method ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        backgroundColor: selectedMethod === method ? '#eff6ff' : 'transparent',
                      }}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getMethodIcon(method)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">{getMethodName(method)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {method === 'totp'
                              ? 'Use an authenticator app'
                              : method === 'sms'
                                ? 'Receive codes via text'
                                : 'Receive codes via email'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {setupStep === 1 && selectedMethod === 'totp' && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </Alert>
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {totpSecret}
                </Typography>
              </Box>
              <Typography variant="subtitle2" gutterBottom>
                Enter the 6-digit code from your app:
              </Typography>
              <TextField
                label="Verification Code"
                type="text"
                value={totpVerificationCode}
                onChange={(e) => setTotpVerificationCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                fullWidth
                inputProps={{ maxLength: 6, style: { letterSpacing: '0.5em', fontSize: '1.5em' } }}
              />
            </Box>
          )}

          {setupStep === 2 && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Save these backup codes in a safe place. You can use them to access your account
                if you lose access to your authenticator app.
              </Alert>
              <Typography variant="subtitle2" gutterBottom>
                Backup Codes:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableBody>
                    {backupCodes.map((code, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{code}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyBackupCode(code)}
                            title="Copy code"
                          >
                            <FileCopyIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="checkbox"
                  id="saved-codes"
                  checked={backupCodesSaved}
                  onChange={(e) => setBackupCodesSaved(e.target.checked)}
                />
                <label htmlFor="saved-codes">
                  <Typography variant="body2">
                    I have saved my backup codes in a safe place
                  </Typography>
                </label>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialogOpen(false)}>Cancel</Button>
          {setupStep < 2 && (
            <Button
              onClick={() => setSetupStep(setupStep + 1)}
              color="primary"
              variant="contained"
              disabled={setupStep === 1 && totpVerificationCode.length !== 6}
            >
              Next
            </Button>
          )}
          {setupStep === 2 && (
            <Button
              onClick={handleVerifyAndEnable}
              color="primary"
              variant="contained"
              disabled={!backupCodesSaved}
            >
              Enable 2FA
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Disabling 2FA will make your account less secure. You can re-enable it anytime.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            To confirm, type <strong>DISABLE</strong>:
          </Typography>
          <TextField
            label="Confirmation"
            fullWidth
            value={disableConfirmation}
            onChange={(e) => setDisableConfirmation(e.target.value)}
            placeholder="Type DISABLE"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDisable2FA}
            color="error"
            variant="contained"
            disabled={disableConfirmation !== 'DISABLE'}
          >
            Disable 2FA
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
