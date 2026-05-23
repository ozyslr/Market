'use client';

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import EmailRegisterForm from '@/components/auth/EmailRegisterForm';

const steps = ['Account Details', 'Email Verification', 'Complete'];

export default function RegisterPage() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [email, setEmail] = React.useState('');

  const handleRegistrationComplete = (userEmail: string) => {
    setEmail(userEmail);
    setActiveStep(1);
  };

  const handleVerificationComplete = () => {
    setActiveStep(2);
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Your Mercora Account
        </Typography>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {activeStep === 0 && (
          <Box>
            <EmailRegisterForm
              onSuccess={handleRegistrationComplete}
              onLoginRedirect={() => {
                window.location.href = '/auth/login';
              }}
            />
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              We&apos;ve sent a verification link to <strong>{email}</strong>.
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Click the link in your email to complete registration.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                window.location.href = '/auth/login';
              }}
              sx={{ mt: 2 }}
            >
              Back to Login
            </Button>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Welcome to Mercora!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your account has been created successfully. Redirecting to login...
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Already have an account?{' '}
            <Button color="primary" href="/auth/login">
              Log In
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
