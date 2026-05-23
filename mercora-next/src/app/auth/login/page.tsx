'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import EmailLoginForm from '@/components/auth/EmailLoginForm';
import PhoneLoginFlow from '@/components/auth/PhoneLoginFlow';
import AuthMethodSelector from '@/components/auth/AuthMethodSelector';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState(0);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'social' | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setAuthMethod(null);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Log In to Mercora
        </Typography>

        {!authMethod && (
          <Box sx={{ mt: 4 }}>
            <AuthMethodSelector
              onSelectEmail={() => setAuthMethod('email')}
              onSelectPhone={() => setAuthMethod('phone')}
              onSelectGoogle={() => {
                window.location.href = '/api/auth/oauth/google';
              }}
              onSelectFacebook={() => {
                window.location.href = '/api/auth/oauth/facebook';
              }}
            />
          </Box>
        )}

        {authMethod === 'email' && (
          <Box>
            <Button
              variant="text"
              size="small"
              onClick={() => setAuthMethod(null)}
              sx={{ mb: 2 }}
            >
              ← Back to methods
            </Button>
            <EmailLoginForm
              onSuccess={() => {
                // Redirect to dashboard
                window.location.href = '/dashboard';
              }}
              onForgotPassword={() => {
                window.location.href = '/auth/forgot-password';
              }}
            />
          </Box>
        )}

        {authMethod === 'phone' && (
          <Box>
            <Button
              variant="text"
              size="small"
              onClick={() => setAuthMethod(null)}
              sx={{ mb: 2 }}
            >
              ← Back to methods
            </Button>
            <PhoneLoginFlow onSuccess={() => {
              window.location.href = '/dashboard';
            }} />
          </Box>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Don&apos;t have an account?{' '}
            <Button color="primary" href="/auth/register">
              Sign Up
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
