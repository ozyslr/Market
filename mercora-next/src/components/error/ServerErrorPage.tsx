'use client';

/**
 * 500 Server Error Page Component
 */

import React from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

export default function ServerErrorPage({ error, digest }: { error?: Error; digest?: string }) {
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
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                500
              </Typography>
              <Typography variant="h6" gutterBottom>
                Server Error
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Something went wrong on our end. Our team has been notified.
              </Typography>
              {digest && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                  Error ID: {digest}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
              <Button variant="contained" href="/" fullWidth>
                Back to Home
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()} fullWidth>
                Refresh
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
