'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { analyticsService } from '@/services/analyticsService';

interface FunnelStep {
  name: string;
  users: number;
  percentage: number;
  dropoff: number;
}

export const FunnelChart: React.FC<{ userId?: string; days?: number }> = ({
  userId,
  days = 30,
}) => {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFunnelData();
  }, [userId, days]);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      let data;

      if (userId) {
        data = await analyticsService.getUserConversionFunnel(userId);
      } else {
        data = await analyticsService.getFunnelMetrics(days);
      }

      if (data) {
        const steps: FunnelStep[] = Object.entries(data).map(
          ([key, value]: [string, any], index) => {
            const users = value.count || 0;
            const percentage = value.conversion || 0;
            const dropoff = index > 0 ? (funnel[index - 1]?.users || users) - users : 0;

            return {
              name: formatStepName(key),
              users,
              percentage,
              dropoff,
            };
          }
        );

        setFunnel(steps);
      }
    } catch (err) {
      setError('Failed to load funnel data');
      console.error('Funnel error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatStepName = (key: string): string => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Conversion Funnel" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Conversion Funnel" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const maxUsers = Math.max(...funnel.map((s) => s.users), 1);

  return (
    <Card>
      <CardHeader
        title="Conversion Funnel"
        subheader={`${funnel.length} steps`}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {funnel.map((step, index) => (
            <Box key={step.name}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  {step.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {step.users.toLocaleString()} users (
                  {step.percentage.toFixed(1)}%)
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(step.users / maxUsers) * 100}
                  />
                </Box>
                {index > 0 && step.dropoff > 0 && (
                  <Typography variant="caption" color="error">
                    -{step.dropoff} ({((step.dropoff / funnel[index - 1].users) * 100).toFixed(1)}%)
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FunnelChart;
