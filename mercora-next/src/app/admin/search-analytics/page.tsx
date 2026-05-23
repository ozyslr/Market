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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { LineChart as LineChartIcon, BarChart as BarChartIcon } from '@mui/icons-material';

interface SearchQuery {
  id: string;
  query: string;
  searchCount: number;
  clickThroughRate: number;
  conversionRate: number;
  averagePosition: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  topClickProduct: string;
  topConversionProduct: string;
  lastSearched: string;
}

interface TrendingSearch {
  rank: number;
  query: string;
  count: number;
  change: number;
  category: string;
}

interface SearchMetric {
  date: string;
  searches: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

const mockSearches: SearchQuery[] = [
  {
    id: 'sq-001',
    query: 'wireless headphones',
    searchCount: 1450,
    clickThroughRate: 42.3,
    conversionRate: 12.8,
    averagePosition: 2.1,
    impressions: 1450,
    clicks: 614,
    conversions: 79,
    revenue: 4895,
    trend: 'up',
    trendPercent: 8.5,
    topClickProduct: 'Sony WH-1000XM5',
    topConversionProduct: 'Bose QuietComfort 45',
    lastSearched: '2026-05-23',
  },
  {
    id: 'sq-002',
    query: 'laptop under 1000',
    searchCount: 987,
    clickThroughRate: 38.9,
    conversionRate: 9.4,
    averagePosition: 2.8,
    impressions: 987,
    clicks: 384,
    conversions: 36,
    revenue: 18540,
    trend: 'up',
    trendPercent: 5.2,
    topClickProduct: 'Dell Inspiron 15',
    topConversionProduct: 'ASUS VivoBook 15',
    lastSearched: '2026-05-23',
  },
  {
    id: 'sq-003',
    query: 'running shoes',
    searchCount: 892,
    clickThroughRate: 35.7,
    conversionRate: 11.2,
    averagePosition: 1.9,
    impressions: 892,
    clicks: 318,
    conversions: 36,
    revenue: 5220,
    trend: 'stable',
    trendPercent: 0.3,
    topClickProduct: 'Nike Air Max',
    topConversionProduct: 'Adidas Ultraboost',
    lastSearched: '2026-05-23',
  },
  {
    id: 'sq-004',
    query: 'smartphone accessories',
    searchCount: 756,
    clickThroughRate: 32.1,
    conversionRate: 8.6,
    averagePosition: 3.2,
    impressions: 756,
    clicks: 243,
    conversions: 21,
    revenue: 2840,
    trend: 'down',
    trendPercent: -3.1,
    topClickProduct: 'Apple AirPods Pro',
    topConversionProduct: 'Samsung Galaxy Buds',
    lastSearched: '2026-05-22',
  },
  {
    id: 'sq-005',
    query: 'coffee maker',
    searchCount: 634,
    clickThroughRate: 28.4,
    conversionRate: 10.1,
    averagePosition: 2.5,
    impressions: 634,
    clicks: 180,
    conversions: 18,
    revenue: 3060,
    trend: 'up',
    trendPercent: 2.8,
    topClickProduct: 'Nespresso Delonghi',
    topConversionProduct: 'Keurig K-Cup',
    lastSearched: '2026-05-23',
  },
];

const mockTrendingSearches: TrendingSearch[] = [
  { rank: 1, query: 'summer dresses', count: 2341, change: 145, category: 'Fashion' },
  { rank: 2, query: 'beach accessories', count: 2187, change: 98, category: 'Fashion' },
  { rank: 3, query: 'air purifier', count: 1923, change: 156, category: 'Electronics' },
  { rank: 4, query: 'plant pots', count: 1654, change: 87, category: 'Home & Garden' },
  { rank: 5, query: 'water bottle', count: 1542, change: 62, category: 'Sports' },
];

const mockMetrics: SearchMetric[] = [
  { date: '2026-05-19', searches: 4200, clicks: 1456, conversions: 142, ctr: 34.7, cvr: 9.8 },
  { date: '2026-05-20', searches: 4580, clicks: 1623, conversions: 158, ctr: 35.4, cvr: 9.7 },
  { date: '2026-05-21', searches: 4890, clicks: 1754, conversions: 175, ctr: 35.9, cvr: 10.0 },
  { date: '2026-05-22', searches: 5120, clicks: 1876, conversions: 189, ctr: 36.6, cvr: 10.1 },
  { date: '2026-05-23', searches: 5347, clicks: 1942, conversions: 201, ctr: 36.3, cvr: 10.3 },
];

export default function SearchAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<SearchQuery | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [sortBy, setSortBy] = useState('searchCount');

  const totalSearches = mockSearches.reduce((sum, s) => sum + s.searchCount, 0);
  const totalClicks = mockSearches.reduce((sum, s) => sum + s.clicks, 0);
  const totalConversions = mockSearches.reduce((sum, s) => sum + s.conversions, 0);
  const totalRevenue = mockSearches.reduce((sum, s) => sum + s.revenue, 0);
  const avgCTR = (mockSearches.reduce((sum, s) => sum + s.clickThroughRate, 0) / mockSearches.length).toFixed(1);
  const avgCVR = (mockSearches.reduce((sum, s) => sum + s.conversionRate, 0) / mockSearches.length).toFixed(1);

  const sortedSearches = [...mockSearches].sort((a, b) => {
    switch (sortBy) {
      case 'searchCount':
        return b.searchCount - a.searchCount;
      case 'ctr':
        return b.clickThroughRate - a.clickThroughRate;
      case 'cvr':
        return b.conversionRate - a.conversionRate;
      case 'revenue':
        return b.revenue - a.revenue;
      default:
        return 0;
    }
  });

  const handleOpenDetails = (search: SearchQuery) => {
    setSelectedSearch(search);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedSearch(null);
  };

  const getTrendColor = (trend: string): 'success' | 'error' | 'default' => {
    return trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Search Analytics
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Monitor search performance, trending queries, and user engagement metrics
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Total Searches
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {totalSearches.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Last 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Avg. Click-Through Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {avgCTR}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {totalClicks.toLocaleString()} clicks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Avg. Conversion Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {avgCVR}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {totalConversions.toLocaleString()} conversions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Revenue from Search
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                ${totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Attributed conversion value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
          <Tab label="Search Performance" />
          <Tab label="Trending Searches" />
          <Tab label="Metrics Over Time" />
        </Tabs>
      </Box>

      {/* Search Performance Tab */}
      {tab === 0 && (
        <Box>
          {/* Sorting Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="searchCount">Search Volume</MenuItem>
                <MenuItem value="ctr">Click-Through Rate</MenuItem>
                <MenuItem value="cvr">Conversion Rate</MenuItem>
                <MenuItem value="revenue">Revenue</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Searches Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Query</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Searches</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>CTR</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>CVR</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avg Position</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Revenue</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trend</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedSearches.map((search) => (
                  <TableRow key={search.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{search.query}</TableCell>
                    <TableCell>{search.searchCount.toLocaleString()}</TableCell>
                    <TableCell>{search.clickThroughRate.toFixed(1)}%</TableCell>
                    <TableCell>{search.conversionRate.toFixed(1)}%</TableCell>
                    <TableCell>{search.averagePosition.toFixed(1)}</TableCell>
                    <TableCell>${search.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${search.trend === 'up' ? '↑' : search.trend === 'down' ? '↓' : '→'} ${Math.abs(search.trendPercent).toFixed(1)}%`}
                        color={getTrendColor(search.trend)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDetails(search)}
                      >
                        Analyze
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Trending Searches Tab */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {mockTrendingSearches.map((search, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#999', mb: 0.5 }}>
                        #{search.rank}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {search.query}
                      </Typography>
                    </Box>
                    <Chip label={search.category} size="small" variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      <strong>{search.count.toLocaleString()}</strong> searches
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#4caf50',
                        fontWeight: 600,
                      }}
                    >
                      +{search.change} today
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Metrics Over Time Tab */}
      {tab === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Search Metrics Trend (7 Days)" />
            <CardContent>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="searches"
                      stroke="#2196f3"
                      name="Searches"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="conversions"
                      stroke="#4caf50"
                      name="Conversions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ctr"
                      stroke="#ff9800"
                      name="CTR %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Conversion Rate Trend" />
                <CardContent>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cvr" fill="#4caf50" name="CVR %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Click-Through Rate Trend" />
                <CardContent>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ctr" fill="#2196f3" name="CTR %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Search Query Analysis</DialogTitle>
        <DialogContent>
          {selectedSearch && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {selectedSearch.query}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Key Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Searches
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedSearch.searchCount}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Clicks
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedSearch.clicks}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Click-Through Rate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedSearch.clickThroughRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Conversion Rate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedSearch.conversionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Conversions
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedSearch.conversions}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Revenue
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ${selectedSearch.revenue.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Top Converting Products
                </Typography>
                <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>By Clicks:</strong> {selectedSearch.topClickProduct}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>By Conversions:</strong> {selectedSearch.topConversionProduct}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" color="textSecondary">
                Last searched: {new Date(selectedSearch.lastSearched).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          <Button variant="contained">Optimize Rankings</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
