'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { analyticsService } from '@/services/analyticsService';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface UserSegment {
  id: string;
  name: string;
  users: number;
  avgLifetime: number;
  trend: number;
  lastActive: string;
}

export const UserSegmentDashboard: React.FC = () => {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const segmentNames = ['new', 'active', 'inactive', 'churned', 'vip'];
      const data: UserSegment[] = [];

      for (const segment of segmentNames) {
        const result = await analyticsService.getUserSegment(segment);
        if (result) {
          data.push({
            id: segment,
            name: segment.charAt(0).toUpperCase() + segment.slice(1),
            users: result.users || 0,
            avgLifetime: result.avgLifetime || 0,
            trend: result.trend || 0,
            lastActive: result.lastActive || 'N/A',
          });
        }
      }

      setSegments(data);
    } catch (err) {
      setError('Failed to load segment data');
      console.error('Segment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: number): 'success' | 'error' => {
    return trend >= 0 ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="User Segments" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="User Segments" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2}>
      {segments.map((segment) => (
        <Grid item xs={12} sm={6} md={4} key={segment.id}>
          <Card>
            <CardHeader
              title={segment.name}
              action={
                <Chip
                  label={segment.users.toLocaleString()}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              }
            />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Avg. Lifetime Value"
                    secondary={`$${segment.avgLifetime.toFixed(2)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Trend"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {segment.trend >= 0 ? (
                          <TrendingUpIcon
                            sx={{
                              color: 'success.main',
                              fontSize: 16,
                            }}
                          />
                        ) : (
                          <TrendingDownIcon
                            sx={{
                              color: 'error.main',
                              fontSize: 16,
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: getTrendColor(segment.trend) === 'success'
                              ? 'success.main'
                              : 'error.main',
                          }}
                        >
                          {segment.trend > 0 ? '+' : ''}
                          {segment.trend.toFixed(1)}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Active"
                    secondary={segment.lastActive}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default UserSegmentDashboard;
