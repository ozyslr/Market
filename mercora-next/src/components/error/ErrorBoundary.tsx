'use client';

/**
 * Error Boundary (STREAM C)
 * Catches React errors and displays fallback UI
 * Logs errors to monitoring service
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack, Alert } from '@mui/material';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logError } from '@/services/errorHandlingService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    logError({
      message: error.message,
      stack: error.stack,
      context: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      severity: 'error',
    });

    // Call onError callback
    this.props.onError?.(error);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return <ErrorFallback error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500 }}>
        <CardContent sx={{ py: 4 }}>
          <Stack spacing={3} alignItems="center">
            <AlertTriangle size={48} color="#d32f2f" />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="textSecondary">
                We've logged this error and will investigate.
              </Typography>
            </Box>

            {process.env.NODE_ENV === 'development' && (
              <Alert severity="error" sx={{ width: '100%' }}>
                <Typography variant="caption" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {error.message}
                </Typography>
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={reset} startIcon={<RotateCcw size={16} />}>
                Try Again
              </Button>
              <Button variant="outlined" href="/">
                Home
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
