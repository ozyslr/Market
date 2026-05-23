'use client';

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  FormControlLabel,
  Switch,
  Slider,
  Rating,
  Avatar,
  AvatarGroup,
} from '@mui/material';

interface RecommendationAlgorithm {
  id: string;
  name: string;
  type: 'collaborative' | 'content_based' | 'hybrid' | 'trending';
  status: 'active' | 'testing' | 'paused';
  engagementLift: number;
  conversionLift: number;
  aovLift: number;
  users: number;
  avgClickThroughRate: number;
  avgConversionRate: number;
  revenue: number;
  variance: number;
  lastUpdated: string;
}

interface ABTest {
  id: string;
  testName: string;
  controlAlgorithm: string;
  variantAlgorithm: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  splitPercentage: number;
  duration: number;
  startDate: string;
  endDate?: string;
  controlCTR: number;
  variantCTR: number;
  controlCVR: number;
  variantCVR: number;
  confidenceLevel: number;
  winner?: string;
}

interface RecommendationWidget {
  id: string;
  placement: string;
  algorithm: string;
  position: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  revenue: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  rating: number;
}

const mockAlgorithms: RecommendationAlgorithm[] = [
  {
    id: 'algo-001',
    name: 'Collaborative Filtering',
    type: 'collaborative',
    status: 'active',
    engagementLift: 24.5,
    conversionLift: 18.3,
    aovLift: 12.7,
    users: 125000,
    avgClickThroughRate: 4.2,
    avgConversionRate: 1.8,
    revenue: 450000,
    variance: 2.1,
    lastUpdated: '2026-05-23',
  },
  {
    id: 'algo-002',
    name: 'Content-Based Recommendations',
    type: 'content_based',
    status: 'active',
    engagementLift: 18.2,
    conversionLift: 12.5,
    aovLift: 8.4,
    users: 98000,
    avgClickThroughRate: 3.1,
    avgConversionRate: 1.2,
    revenue: 285000,
    variance: 1.8,
    lastUpdated: '2026-05-22',
  },
  {
    id: 'algo-003',
    name: 'Hybrid Recommendations',
    type: 'hybrid',
    status: 'testing',
    engagementLift: 28.9,
    conversionLift: 22.1,
    aovLift: 15.3,
    users: 45000,
    avgClickThroughRate: 5.1,
    avgConversionRate: 2.3,
    revenue: 189000,
    variance: 3.2,
    lastUpdated: '2026-05-23',
  },
  {
    id: 'algo-004',
    name: 'Trending Products',
    type: 'trending',
    status: 'active',
    engagementLift: 12.3,
    conversionLift: 8.9,
    aovLift: 5.2,
    users: 87000,
    avgClickThroughRate: 2.8,
    avgConversionRate: 0.9,
    revenue: 142000,
    variance: 1.4,
    lastUpdated: '2026-05-21',
  },
];

const mockABTests: ABTest[] = [
  {
    id: 'test-001',
    testName: 'Hybrid vs Collaborative Filtering',
    controlAlgorithm: 'Collaborative Filtering',
    variantAlgorithm: 'Hybrid Recommendations',
    status: 'running',
    splitPercentage: 50,
    duration: 14,
    startDate: '2026-05-16',
    controlCTR: 4.2,
    variantCTR: 5.1,
    controlCVR: 1.8,
    variantCVR: 2.3,
    confidenceLevel: 87,
    winner: 'Hybrid Recommendations',
  },
  {
    id: 'test-002',
    testName: 'Personalized Ranking vs Default',
    controlAlgorithm: 'Default Ranking',
    variantAlgorithm: 'ML-Based Personalization',
    status: 'completed',
    splitPercentage: 50,
    duration: 21,
    startDate: '2026-04-25',
    endDate: '2026-05-16',
    controlCTR: 3.5,
    variantCTR: 4.8,
    controlCVR: 1.4,
    variantCVR: 1.9,
    confidenceLevel: 95,
    winner: 'ML-Based Personalization',
  },
];

const mockWidgets: RecommendationWidget[] = [
  {
    id: 'widget-001',
    placement: 'Homepage Hero',
    algorithm: 'Collaborative Filtering',
    position: 1,
    impressions: 156000,
    clicks: 6840,
    conversions: 850,
    ctr: 4.4,
    cvr: 1.2,
    revenue: 125000,
  },
  {
    id: 'widget-002',
    placement: 'Product Detail - Also Viewed',
    algorithm: 'Content-Based Recommendations',
    position: 2,
    impressions: 134000,
    clicks: 4628,
    conversions: 612,
    ctr: 3.5,
    cvr: 1.3,
    revenue: 95000,
  },
  {
    id: 'widget-003',
    placement: 'Checkout - Frequently Bought Together',
    algorithm: 'Collaborative Filtering',
    position: 3,
    impressions: 89000,
    clicks: 3921,
    conversions: 745,
    ctr: 4.4,
    cvr: 1.9,
    revenue: 165000,
  },
  {
    id: 'widget-004',
    placement: 'Sidebar - Trending This Week',
    algorithm: 'Trending Products',
    position: 4,
    impressions: 201000,
    clicks: 5228,
    conversions: 412,
    ctr: 2.6,
    cvr: 0.8,
    revenue: 78000,
  },
];

const mockTopProducts: TopProduct[] = [
  {
    productId: 'prod-001',
    productName: 'Sony WH-1000XM5 Headphones',
    clicks: 2340,
    conversions: 312,
    revenue: 89000,
    conversionRate: 13.3,
    rating: 4.8,
  },
  {
    productId: 'prod-002',
    productName: 'Apple AirPods Pro',
    clicks: 1854,
    conversions: 298,
    revenue: 76800,
    conversionRate: 16.1,
    rating: 4.7,
  },
  {
    productId: 'prod-003',
    productName: 'Samsung Galaxy Buds Pro',
    clicks: 1602,
    conversions: 184,
    revenue: 45600,
    conversionRate: 11.5,
    rating: 4.6,
  },
  {
    productId: 'prod-004',
    productName: 'Bose QuietComfort Earbuds',
    clicks: 1465,
    conversions: 215,
    revenue: 57950,
    conversionRate: 14.7,
    rating: 4.7,
  },
  {
    productId: 'prod-005',
    productName: 'Beats Fit Pro',
    clicks: 1289,
    conversions: 156,
    revenue: 39000,
    conversionRate: 12.1,
    rating: 4.5,
  },
];

function getStatusColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'active':
    case 'completed':
      return 'success';
    case 'testing':
    case 'running':
      return 'warning';
    case 'paused':
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

export default function RecommendationsDashboardPage() {
  const [tab, setTab] = useState(0);
  const [algorithmDialogOpen, setAlgorithmDialogOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<RecommendationAlgorithm | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [engagementThreshold, setEngagementThreshold] = useState(15);
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(true);

  const totalEngagementLift = mockAlgorithms.reduce(
    (sum, algo) => sum + algo.engagementLift,
    0
  );
  const avgEngagementLift = (totalEngagementLift / mockAlgorithms.length).toFixed(1);
  const totalRevenue = mockAlgorithms.reduce((sum, algo) => sum + algo.revenue, 0);
  const totalUsers = mockAlgorithms.reduce((sum, algo) => sum + algo.users, 0);

  const handleOpenAlgorithm = (algorithm: RecommendationAlgorithm) => {
    setSelectedAlgorithm(algorithm);
    setAlgorithmDialogOpen(true);
  };

  const handleCloseAlgorithm = () => {
    setAlgorithmDialogOpen(false);
    setSelectedAlgorithm(null);
  };

  const handleOpenTest = (test: ABTest) => {
    setSelectedTest(test);
    setTestDialogOpen(true);
  };

  const handleCloseTest = () => {
    setTestDialogOpen(false);
    setSelectedTest(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Recommendations Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Monitor recommendation algorithms, A/B tests, and performance metrics
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Active Algorithms
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {mockAlgorithms.filter((a) => a.status === 'active').length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {mockAlgorithms.length} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Avg Engagement Lift
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#4caf50' }}>
                +{avgEngagementLift}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                vs baseline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Total Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                ${(totalRevenue / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Users Engaged
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {(totalUsers / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="caption" color="textSecondary">
                With recommendations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Panel */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Recommendation Settings" subheader="Configure algorithm behavior" />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoOptimizeEnabled}
                  onChange={(e) => setAutoOptimizeEnabled(e.target.checked)}
                />
              }
              label={`Auto-optimize algorithms (${autoOptimizeEnabled ? 'Enabled' : 'Disabled'})`}
            />
            <Box sx={{ minWidth: 250 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Engagement Lift Threshold: {engagementThreshold}%
              </Typography>
              <Slider
                value={engagementThreshold}
                onChange={(e, newValue) => setEngagementThreshold(newValue as number)}
                min={0}
                max={50}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 50, label: '50%' },
                ]}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
          <Tab label={`Algorithms (${mockAlgorithms.length})`} />
          <Tab label={`A/B Tests (${mockABTests.length})`} />
          <Tab label={`Widget Performance`} />
          <Tab label={`Top Products`} />
        </Tabs>
      </Box>

      {/* Algorithms Tab */}
      {tab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Algorithm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Engagement Lift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Conversion Lift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>AOV Lift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Revenue</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Variance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockAlgorithms.map((algo) => (
                <TableRow key={algo.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{algo.name}</TableCell>
                  <TableCell>
                    <Chip label={algo.status} color={getStatusColor(algo.status)} size="small" />
                  </TableCell>
                  <TableCell>{(algo.users / 1000).toFixed(0)}K</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(algo.engagementLift, 50)}
                        sx={{ width: 60 }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#4caf50' }}>
                        +{algo.engagementLift.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                      +{algo.conversionLift.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600 }}>
                      +{algo.aovLift.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>${(algo.revenue / 1000).toFixed(0)}K</TableCell>
                  <TableCell>
                    <Typography variant="caption">{algo.variance.toFixed(1)}%</Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenAlgorithm(algo)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* A/B Tests Tab */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {mockABTests.map((test) => (
            <Grid item xs={12} key={test.id}>
              <Card>
                <CardHeader
                  title={test.testName}
                  subheader={`${test.status} • Started ${new Date(test.startDate).toLocaleDateString()}`}
                  action={
                    <Chip
                      label={test.status}
                      color={getStatusColor(test.status)}
                      size="small"
                    />
                  }
                />
                <CardContent>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Control: {test.controlAlgorithm}
                      </Typography>
                      <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          CTR: {test.controlCTR.toFixed(2)}% • CVR: {test.controlCVR.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Variant: {test.variantAlgorithm}
                      </Typography>
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          borderLeft: '4px solid #4caf50',
                        }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          CTR: {test.variantCTR.toFixed(2)}% • CVR: {test.variantCVR.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Statistical Confidence
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {test.confidenceLevel}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={test.confidenceLevel}
                      sx={{ height: 8 }}
                    />
                  </Box>

                  {test.winner && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Winner: <strong>{test.winner}</strong> shows statistically significant
                      improvement
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenTest(test)}
                    >
                      Details
                    </Button>
                    {test.status === 'running' && (
                      <>
                        <Button size="small" variant="contained">
                          View Results
                        </Button>
                        <Button size="small">Pause</Button>
                      </>
                    )}
                    {test.status === 'completed' && (
                      <Button size="small" variant="contained">
                        Promote Winner
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Widget Performance Tab */}
      {tab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Placement</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Algorithm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Impressions</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Clicks</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>CTR</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>CVR</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockWidgets.map((widget) => (
                <TableRow key={widget.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{widget.placement}</TableCell>
                  <TableCell>{widget.algorithm}</TableCell>
                  <TableCell>{widget.impressions.toLocaleString()}</TableCell>
                  <TableCell>{widget.clicks.toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {widget.ctr.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {widget.cvr.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell>${widget.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Top Products Tab */}
      {tab === 3 && (
        <Grid container spacing={2}>
          {mockTopProducts.map((product, index) => (
            <Grid item xs={12} key={product.productId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        #{index + 1} {product.productName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Product ID: {product.productId}
                      </Typography>
                    </Box>
                    <Rating value={product.rating} readOnly size="small" />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Clicks
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {product.clicks}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Conversions
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {product.conversions}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Conv. Rate
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {product.conversionRate.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Revenue
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          ${product.revenue.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Algorithm Details Dialog */}
      <Dialog open={algorithmDialogOpen} onClose={handleCloseAlgorithm} maxWidth="sm" fullWidth>
        <DialogTitle>Algorithm Details</DialogTitle>
        <DialogContent>
          {selectedAlgorithm && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {selectedAlgorithm.name}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedAlgorithm.status}
                      color={getStatusColor(selectedAlgorithm.status)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Users
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(selectedAlgorithm.users / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Performance Metrics
                </Typography>
                <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>Engagement Lift:</strong> +{selectedAlgorithm.engagementLift.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>Conversion Lift:</strong> +{selectedAlgorithm.conversionLift.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>AOV Lift:</strong> +{selectedAlgorithm.aovLift.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Revenue:</strong> ${selectedAlgorithm.revenue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" color="textSecondary">
                Last updated: {new Date(selectedAlgorithm.lastUpdated).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAlgorithm}>Close</Button>
          <Button variant="contained">Configure</Button>
        </DialogActions>
      </Dialog>

      {/* A/B Test Details Dialog */}
      <Dialog open={testDialogOpen} onClose={handleCloseTest} maxWidth="sm" fullWidth>
        <DialogTitle>A/B Test Details</DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {selectedTest.testName}
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                {selectedTest.status === 'running'
                  ? `Test is running (${selectedTest.duration} days)`
                  : `Test completed on ${new Date(selectedTest.endDate || '').toLocaleDateString()}`}
              </Alert>

              <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  <strong>Duration:</strong> {selectedTest.duration} days
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  <strong>Split:</strong> {selectedTest.splitPercentage}% each
                </Typography>
                <Typography variant="caption">
                  <strong>Confidence Level:</strong> {selectedTest.confidenceLevel}%
                </Typography>
              </Box>

              {selectedTest.winner && (
                <Alert severity="success">
                  Statistical winner: <strong>{selectedTest.winner}</strong>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTest}>Close</Button>
          <Button variant="contained">View Full Results</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
