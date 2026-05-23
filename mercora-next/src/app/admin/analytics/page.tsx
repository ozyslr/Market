'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Button,
  ButtonGroup,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FunnelChart from '@/components/analytics/FunnelChart';
import CohortAnalysis from '@/components/analytics/CohortAnalysis';
import UserSegmentDashboard from '@/components/analytics/UserSegmentDashboard';
import { analyticsService } from '@/services/analyticsService';

export default function AnalyticsDashboardPage() {
  const [timeframe, setTimeframe] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    totalEvents: number;
    totalUsers: number;
    conversionRate: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, [timeframe]);

  const loadStats = async () => {
    try {
      const days = parseInt(timeframe);
      const eventCount = await analyticsService.getEventCount(undefined, days);

      setStats({
        totalEvents: eventCount || 0,
        totalUsers: Math.floor((eventCount || 0) * 0.3),
        conversionRate: 0.032,
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Analytics Dashboard
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <ButtonGroup size="small">
            {[
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
              { label: '90 Days', value: '90d' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={timeframe === option.value ? 'contained' : 'outlined'}
                onClick={() => setTimeframe(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Events
              </Typography>
              <Typography variant="h5">
                {stats?.totalEvents.toLocaleString() || '—'}
              </Typography>
              <Chip label="Last 30 days" size="small" variant="outlined" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h5">
                {stats?.totalUsers.toLocaleString() || '—'}
              </Typography>
              <Chip label="+12% vs last" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h5">
                {stats?.conversionRate ? `${(stats.conversionRate * 100).toFixed(2)}%` : '—'}
              </Typography>
              <Chip label="+2.1% vs last" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Session
              </Typography>
              <Typography variant="h5">4m 23s</Typography>
              <Chip label="-5s vs last" size="small" color="error" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <FunnelChart days={parseInt(timeframe)} />
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Signup → Login', value: '78%' },
                  { label: 'Login → Browse', value: '65%' },
                  { label: 'Browse → Cart', value: '34%' },
                  { label: 'Cart → Checkout', value: '52%' },
                  { label: 'Checkout → Payment', value: '95%' },
                ].map((stat, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{stat.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <CohortAnalysis weeks={12} />
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 0 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Segments
              </Typography>
            </CardContent>
          </Card>
          <Box sx={{ mt: 2 }}>
            <UserSegmentDashboard />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
