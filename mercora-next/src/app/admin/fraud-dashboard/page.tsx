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
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { fraudDetectionService } from '@/services/fraudDetectionService';

interface FraudAlert {
  id: string;
  userId: string;
  type: 'payment_fraud' | 'fake_review' | 'account_abuse' | 'chargeback';
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  description: string;
  signals: string[];
  createdAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  actionTaken?: string;
}

interface DisputedReview {
  id: string;
  reviewId: string;
  userId: string;
  productId: string;
  reviewText: string;
  rating: number;
  flagReason: string;
  flagCount: number;
  isFake: boolean;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export default function FraudDashboardPage() {
  const [tab, setTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<DisputedReview | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagUserId, setFlagUserId] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [disputedReviews, setDisputedReviews] = useState<DisputedReview[]>([]);

  const [stats, setStats] = useState({
    totalAlerts24h: 0,
    criticalAlerts: 0,
    fraudulentPayments: 0,
    fakeReviewsDetected: 0,
    chargebackRate: 0,
    averageRiskScore: 0,
  });

  const [autoFlagEnabled, setAutoFlagEnabled] = useState(true);
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(75);

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    setIsLoading(true);
    try {
      // Mock fraud alerts
      const mockAlerts: FraudAlert[] = [
        {
          id: 'alert_1',
          userId: 'user_42',
          type: 'payment_fraud',
          severity: 'critical',
          riskScore: 92,
          description: 'Suspicious payment pattern detected',
          signals: ['High velocity (5 transactions in 2 hours)', 'New device', 'Unusual amount'],
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          status: 'investigating',
        },
        {
          id: 'alert_2',
          userId: 'user_85',
          type: 'fake_review',
          severity: 'high',
          riskScore: 88,
          description: 'Multiple fake reviews detected from same IP',
          signals: ['Text similarity match (92%)', 'Same IP (5 reviews)', 'Generic language'],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'open',
        },
        {
          id: 'alert_3',
          userId: 'user_103',
          type: 'account_abuse',
          severity: 'medium',
          riskScore: 65,
          description: 'Unusual account activity',
          signals: ['Multiple login attempts', 'Password change requested', 'Email updated'],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'resolved',
          actionTaken: 'Account locked for verification',
        },
      ];

      // Mock disputed reviews
      const mockReviews: DisputedReview[] = [
        {
          id: 'review_1',
          reviewId: 'rev_101',
          userId: 'user_85',
          productId: 'prod_5',
          reviewText: 'Great product! Best quality! Highly recommended! Amazing!',
          rating: 5,
          flagReason: 'Generic language and spam patterns',
          flagCount: 7,
          isFake: true,
          confidence: 0.89,
          status: 'pending',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          id: 'review_2',
          reviewId: 'rev_102',
          userId: 'user_120',
          productId: 'prod_12',
          reviewText: 'Text closely matches review from different user',
          rating: 4,
          flagReason: 'Coordinated review pattern',
          flagCount: 3,
          isFake: true,
          confidence: 0.76,
          status: 'pending',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        },
      ];

      setFraudAlerts(mockAlerts);
      setDisputedReviews(mockReviews);

      // Mock stats
      setStats({
        totalAlerts24h: 12,
        criticalAlerts: 2,
        fraudulentPayments: 3,
        fakeReviewsDetected: 8,
        chargebackRate: 0.32,
        averageRiskScore: 58,
      });
    } catch (error) {
      console.error('Load fraud data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string, resolution: string) => {
    try {
      setFraudAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: 'resolved', actionTaken: resolution }
            : alert
        )
      );
      alert('Alert resolved');
    } catch (error) {
      console.error('Resolve alert error:', error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      setDisputedReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, status: 'approved' } : review
        )
      );
      alert('Review approved');
    } catch (error) {
      console.error('Approve review error:', error);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      setDisputedReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, status: 'rejected' } : review
        )
      );
      alert('Review rejected');
    } catch (error) {
      console.error('Reject review error:', error);
    }
  };

  const handleFlagAccount = async () => {
    if (!flagUserId || !flagReason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await fraudDetectionService.flagAccountForReview(flagUserId, flagReason, flagSeverity);
      setFlagDialogOpen(false);
      setFlagUserId('');
      setFlagReason('');
      alert('Account flagged successfully');
    } catch (error) {
      console.error('Flag account error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const openAlerts = fraudAlerts.filter((a) => a.status === 'open').length;
  const investigatingAlerts = fraudAlerts.filter((a) => a.status === 'investigating').length;
  const pendingReviews = disputedReviews.filter((r) => r.status === 'pending').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon fontSize="large" />
          Fraud Detection Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage fraud alerts, chargebacks, and suspicious activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Alerts (24h)
              </Typography>
              <Typography variant="h5">{stats.totalAlerts24h}</Typography>
              <Chip
                label={`${stats.criticalAlerts} critical`}
                size="small"
                color="error"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Fraudulent Payments
              </Typography>
              <Typography variant="h5">{stats.fraudulentPayments}</Typography>
              <Typography variant="caption" color="text.secondary">
                Blocked in last 24h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Fake Reviews Detected
              </Typography>
              <Typography variant="h5">{stats.fakeReviewsDetected}</Typography>
              <Typography variant="caption" color="text.secondary">
                Pending review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Chargeback Rate
              </Typography>
              <Typography variant="h5">{stats.chargebackRate.toFixed(2)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                Below 0.5% goal
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Auto-Flagging Settings" />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoFlagEnabled}
                    onChange={(e) => setAutoFlagEnabled(e.target.checked)}
                  />
                }
                label="Auto-flag high-risk accounts"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Automatically flag accounts with risk score > threshold
              </Typography>
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>
                Risk Threshold: {autoFlagThreshold}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={autoFlagThreshold}
                sx={{ mb: 2 }}
              />
              <TextField
                type="number"
                size="small"
                inputProps={{ min: 0, max: 100 }}
                value={autoFlagThreshold}
                onChange={(e) => setAutoFlagThreshold(parseInt(e.target.value))}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)}>
          <Tab label={`Fraud Alerts (${openAlerts})`} />
          <Tab label={`Investigating (${investigatingAlerts})`} />
          <Tab label={`Disputed Reviews (${pendingReviews})`} />
        </Tabs>
      </Paper>

      {/* Fraud Alerts Tab */}
      {tab === 0 && (
        <Box>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : fraudAlerts.filter((a) => a.status === 'open').length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              No open fraud alerts
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Alert ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Risk Score</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fraudAlerts
                    .filter((a) => a.status === 'open')
                    .map((alert) => (
                      <TableRow key={alert.id} hover>
                        <TableCell>{alert.id}</TableCell>
                        <TableCell>{alert.userId}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.type.replace(/_/g, ' ')}
                            size="small"
                            color={getSeverityColor(alert.severity) as any}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={alert.riskScore}
                            size="small"
                            color={alert.riskScore >= 80 ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell>
                          <Chip label={alert.status} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Investigating Tab */}
      {tab === 1 && (
        <Box>
          {fraudAlerts.filter((a) => a.status === 'investigating').length === 0 ? (
            <Alert severity="info">No alerts under investigation</Alert>
          ) : (
            <Grid container spacing={2}>
              {fraudAlerts
                .filter((a) => a.status === 'investigating')
                .map((alert) => (
                  <Grid item xs={12} md={6} key={alert.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">{alert.id}</Typography>
                          <Chip
                            label={alert.severity.toUpperCase()}
                            color={getSeverityColor(alert.severity) as any}
                          />
                        </Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Risk Score: {alert.riskScore}%
                        </Alert>
                        <Typography variant="subtitle2" gutterBottom>
                          Signals:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {alert.signals.map((signal, idx) => (
                            <Chip
                              key={idx}
                              label={signal}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() =>
                              handleResolveAlert(alert.id, 'Account verified as legitimate')
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleResolveAlert(alert.id, 'Account suspended')}
                          >
                            Suspend
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Disputed Reviews Tab */}
      {tab === 2 && (
        <Box>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : disputedReviews.filter((r) => r.status === 'pending').length === 0 ? (
            <Alert severity="success">No pending review disputes</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Review ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Rating</TableCell>
                    <TableCell>Flag Reason</TableCell>
                    <TableCell align="right">Confidence</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disputedReviews
                    .filter((r) => r.status === 'pending')
                    .map((review) => (
                      <TableRow key={review.id} hover>
                        <TableCell>{review.reviewId}</TableCell>
                        <TableCell>{review.userId}</TableCell>
                        <TableCell>{review.productId}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${review.rating}★`}
                            size="small"
                            color={review.rating === 5 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{review.flagReason}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${(review.confidence * 100).toFixed(0)}%`}
                            size="small"
                            color={review.confidence > 0.8 ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedReview(review);
                              setReviewDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Alert Details Dialog */}
      <Dialog
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>{selectedAlert.id}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Alert severity={selectedAlert.severity === 'critical' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                Risk Score: {selectedAlert.riskScore}%
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                User: {selectedAlert.userId}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Type: {selectedAlert.type.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Detected: {new Date(selectedAlert.createdAt).toLocaleString()}
              </Typography>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Signals:
              </Typography>
              <Box sx={{ mb: 2 }}>
                {selectedAlert.signals.map((signal, idx) => (
                  <Chip
                    key={idx}
                    label={signal}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAlert(null)}>Close</Button>
              <Button
                onClick={() => setFlagDialogOpen(true)}
                color="error"
                variant="contained"
              >
                Flag Account
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Review Details Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedReview && (
          <>
            <DialogTitle>{selectedReview.reviewId}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {(selectedReview.confidence * 100).toFixed(0)}% confidence this is fake
              </Alert>

              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "{selectedReview.reviewText}"
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Rating: {selectedReview.rating}★
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Flag Reason: {selectedReview.flagReason}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Flagged by: {selectedReview.flagCount} users
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
              <Button
                onClick={() => {
                  handleRejectReview(selectedReview.id);
                  setReviewDialogOpen(false);
                }}
                color="error"
                variant="contained"
              >
                Reject Review
              </Button>
              <Button
                onClick={() => {
                  handleApproveReview(selectedReview.id);
                  setReviewDialogOpen(false);
                }}
                color="success"
                variant="contained"
              >
                Approve Review
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Flag Account Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Flag Account</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="User ID"
            fullWidth
            value={flagUserId}
            onChange={(e) => setFlagUserId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Reason"
            fullWidth
            multiline
            rows={3}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Severity"
            fullWidth
            value={flagSeverity}
            onChange={(e) => setFlagSeverity(e.target.value as any)}
            SelectProps={{ native: true }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFlagAccount} color="error" variant="contained">
            Flag Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
