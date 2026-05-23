'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import { analyticsService } from '@/services/analyticsService';

interface CohortData {
  week: string;
  users: number;
  retention: number[];
}

export const CohortAnalysis: React.FC<{ weeks?: number }> = ({
  weeks = 12,
}) => {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCohortData();
  }, [weeks]);

  const loadCohortData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getCohortRetention(weeks);

      if (Array.isArray(data)) {
        setCohorts(data);
      }
    } catch (err) {
      setError('Failed to load cohort data');
      console.error('Cohort error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (retention: number): 'success' | 'warning' | 'error' => {
    if (retention >= 80) return 'success';
    if (retention >= 50) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Cohort Retention Analysis" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Cohort Retention Analysis" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Cohort Retention Analysis"
        subheader={`${cohorts.length} cohorts tracked`}
      />
      <CardContent sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Cohort</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Users
              </TableCell>
              {Array.from({ length: 12 }).map((_, i) => (
                <TableCell key={`week${i}`} align="center" sx={{ fontWeight: 600 }}>
                  W{i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cohorts.map((cohort) => (
              <TableRow key={cohort.week}>
                <TableCell sx={{ fontWeight: 500 }}>{cohort.week}</TableCell>
                <TableCell align="right">{cohort.users.toLocaleString()}</TableCell>
                {cohort.retention.map((ret, i) => (
                  <TableCell key={`${cohort.week}-${i}`} align="center">
                    {ret > 0 ? (
                      <Chip
                        label={`${ret.toFixed(0)}%`}
                        size="small"
                        color={getRetentionColor(ret)}
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="textDisabled">
                        -
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CohortAnalysis;
