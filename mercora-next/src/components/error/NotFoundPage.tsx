'use client';

/**
 * 404 Not Found Page Component
 */

import React from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { MapOff, Search } from 'lucide-react';

export default function NotFoundPage() {
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
            <MapOff size={48} color="#ff9800" />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                404
              </Typography>
              <Typography variant="h6" gutterBottom>
                Page Not Found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                The page you're looking for doesn't exist or has been moved.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
              <Button variant="contained" href="/" fullWidth startIcon={<Search size={16} />}>
                Back to Home
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
