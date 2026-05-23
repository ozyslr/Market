'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { brandAdService } from '@/services/brandAdService';

interface BrandAd {
  id: string;
  brandId: string;
  title: string;
  description?: string;
  imageUrl: string;
  landingUrl: string;
  cpmBid: number;
  dailyBudget: number;
  monthlyBudget: number;
  status: 'draft' | 'active' | 'paused' | 'rejected' | 'completed';
  placements: string[];
  targetSegments?: string[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  approvalStatus: 'pending_review' | 'approved' | 'rejected';
  approvalReason?: string;
}

interface AdStats {
  pendingApproval: number;
  activeCampaigns: number;
  totalDailyBudget: number;
  totalMonthlySpend: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
}

export default function BrandAdsPage() {
  const [ads, setAds] = useState<BrandAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<BrandAd | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editBidDialogOpen, setEditBidDialogOpen] = useState(false);
  const [newBid, setNewBid] = useState<number>(0);
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<AdStats>({
    pendingApproval: 0,
    activeCampaigns: 0,
    totalDailyBudget: 0,
    totalMonthlySpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCTR: 0,
  });

  // Form state for creating new ad
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    landingUrl: '',
    cpmBid: 5,
    dailyBudget: 50,
    monthlyBudget: 1000,
    placements: [] as string[],
  });

  useEffect(() => {
    loadAds();
    loadStats();
  }, []);

  const loadAds = async () => {
    setIsLoading(true);
    try {
      // Simulate loading brand ads
      const mockAds: BrandAd[] = [
        {
          id: 'ad_1',
          brandId: 'brand_1',
          title: 'Premium Leather Bags - 50% Off',
          description: 'High-quality leather bags at incredible prices',
          imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
          landingUrl: 'https://example.com/leather-bags',
          cpmBid: 8.5,
          dailyBudget: 100,
          monthlyBudget: 2000,
          status: 'active',
          placements: ['homepage', 'category'],
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          approvalStatus: 'approved',
        },
        {
          id: 'ad_2',
          brandId: 'brand_2',
          title: 'Electronics Clearance Sale',
          description: 'Latest gadgets at unbeatable prices',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          landingUrl: 'https://example.com/electronics',
          cpmBid: 6.2,
          dailyBudget: 75,
          monthlyBudget: 1500,
          status: 'active',
          placements: ['search', 'product_page'],
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          approvalStatus: 'approved',
        },
        {
          id: 'ad_3',
          brandId: 'brand_3',
          title: 'Fashion Week Collection',
          description: 'New season fashion collection launching soon',
          imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          landingUrl: 'https://example.com/fashion',
          cpmBid: 7.0,
          dailyBudget: 80,
          monthlyBudget: 1600,
          status: 'draft',
          placements: ['homepage', 'search'],
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          approvalStatus: 'pending_review',
        },
      ];
      setAds(mockAds);
    } catch (error) {
      console.error('Load ads error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const mockStats: AdStats = {
        pendingApproval: 3,
        activeCampaigns: 12,
        totalDailyBudget: 850,
        totalMonthlySpend: 18500,
        totalImpressions: 245000,
        totalClicks: 12400,
        avgCTR: 5.06,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleCreateAd = async () => {
    if (!formData.title || !formData.landingUrl || formData.placements.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // In production: call brandAdService.createAd()
      const newAd: BrandAd = {
        id: `ad_${Date.now()}`,
        brandId: 'brand_new',
        ...formData,
        status: 'draft',
        approvalStatus: 'pending_review',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setAds((prev) => [newAd, ...prev]);
      setCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        landingUrl: '',
        cpmBid: 5,
        dailyBudget: 50,
        monthlyBudget: 1000,
        placements: [],
      });
      alert('Ad created successfully and submitted for approval!');
    } catch (error) {
      console.error('Create ad error:', error);
      alert('Failed to create ad');
    }
  };

  const handleApproveAd = async () => {
    if (!selectedAd) return;

    try {
      // In production: call brandAdService.approveAd()
      console.log(`Approving ad: ${selectedAd.id}`);
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === selectedAd.id
            ? { ...ad, approvalStatus: 'approved', status: 'active' }
            : ad
        )
      );
      setSelectedAd(null);
      alert('Ad approved and activated!');
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleRejectAd = async () => {
    if (!selectedAd) return;

    try {
      // In production: call brandAdService.rejectAd()
      console.log(`Rejecting ad: ${selectedAd.id}`);
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === selectedAd.id
            ? { ...ad, approvalStatus: 'rejected', status: 'rejected' }
            : ad
        )
      );
      setSelectedAd(null);
      alert('Ad rejected');
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleUpdateBid = async () => {
    if (!selectedAd) return;

    try {
      // In production: call brandAdService.updateBid()
      console.log(`Updating bid for ${selectedAd.id} to $${newBid.toFixed(2)}`);
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === selectedAd.id
            ? { ...ad, cpmBid: newBid, updatedAt: new Date() }
            : ad
        )
      );
      setSelectedAd((prev) => (prev ? { ...prev, cpmBid: newBid } : null));
      setEditBidDialogOpen(false);
      alert('Bid updated successfully!');
    } catch (error) {
      console.error('Update bid error:', error);
    }
  };

  const handlePauseAd = async (adId: string) => {
    try {
      // In production: call brandAdService.pauseAd()
      setAds((prev) =>
        prev.map((ad) => (ad.id === adId ? { ...ad, status: 'paused' } : ad))
      );
      alert('Ad paused');
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const handleResumeAd = async (adId: string) => {
    try {
      // In production: call brandAdService.resumeAd()
      setAds((prev) =>
        prev.map((ad) => (ad.id === adId ? { ...ad, status: 'active' } : ad))
      );
      alert('Ad resumed');
    } catch (error) {
      console.error('Resume error:', error);
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const monthlyEstimate = formData.dailyBudget * 30;
  const pendingAds = ads.filter((a) => a.approvalStatus === 'pending_review');
  const activeAds = ads.filter((a) => a.status === 'active');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Brand Advertising Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage CPM campaigns and monitor ad performance
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
          Create New Ad
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h5">{stats.pendingApproval}</Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Campaigns
              </Typography>
              <Typography variant="h5">{stats.activeCampaigns}</Typography>
              <Typography variant="caption" color="text.secondary">
                Currently running
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Daily Budget
              </Typography>
              <Typography variant="h5">${stats.totalDailyBudget}</Typography>
              <Typography variant="caption" color="text.secondary">
                Total allocation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg CTR
              </Typography>
              <Typography variant="h5">{stats.avgCTR.toFixed(2)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                Click-through rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)}>
          <Tab label={`Pending Approval (${pendingAds.length})`} />
          <Tab label={`Active Campaigns (${activeAds.length})`} />
          <Tab label="Performance" />
        </Tabs>
      </Paper>

      {/* Pending Approval Ads */}
      {tab === 0 && (
        <Box>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : pendingAds.length === 0 ? (
            <Alert severity="info">No ads pending approval</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Title</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>CPM Bid</TableCell>
                    <TableCell>Daily Budget</TableCell>
                    <TableCell>Placements</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingAds.map((ad) => (
                    <TableRow key={ad.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell onClick={() => setSelectedAd(ad)}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {ad.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{ad.brandId}</TableCell>
                      <TableCell>${ad.cpmBid.toFixed(2)}</TableCell>
                      <TableCell>${ad.dailyBudget}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {ad.placements.map((placement) => (
                            <Chip
                              key={placement}
                              label={placement}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(ad.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => setSelectedAd(ad)}>
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

      {/* Active Campaigns */}
      {tab === 1 && (
        <Box>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : activeAds.length === 0 ? (
            <Alert severity="info">No active campaigns</Alert>
          ) : (
            <Grid container spacing={2}>
              {activeAds.map((ad) => (
                <Grid item xs={12} md={6} key={ad.id}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">{ad.title}</Typography>
                        <Chip
                          label={ad.status.toUpperCase()}
                          color={getStatusColor(ad.status) as any}
                          size="small"
                        />
                      </Box>

                      <Alert severity="success" sx={{ mb: 2 }}>
                        Running • ${ad.dailyBudget}/day • CPM ${ad.cpmBid.toFixed(2)}
                      </Alert>

                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Impressions
                          </Typography>
                          <Typography variant="body2">42,500</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Clicks
                          </Typography>
                          <Typography variant="body2">1,235</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            CTR
                          </Typography>
                          <Typography variant="body2">2.9%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Spend
                          </Typography>
                          <Typography variant="body2">${(ad.dailyBudget * 7).toFixed(2)}</Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedAd(ad);
                            setNewBid(ad.cpmBid);
                            setEditBidDialogOpen(true);
                          }}
                        >
                          Edit Bid
                        </Button>
                        <Button
                          size="small"
                          color="warning"
                          onClick={() => handlePauseAd(ad.id)}
                        >
                          Pause
                        </Button>
                        <Button size="small" onClick={() => setSelectedAd(ad)}>
                          Details
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

      {/* Performance Tab */}
      {tab === 2 && (
        <Alert severity="info">
          Performance analytics and comparison tools coming soon. Track individual campaign metrics, compare ad performance, and optimize bid strategies.
        </Alert>
      )}

      {/* Ad Details Dialog */}
      {selectedAd && (
        <Dialog
          open={true}
          onClose={() => setSelectedAd(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{selectedAd.title}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <img
                src={selectedAd.imageUrl}
                alt="Ad preview"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 4 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Approval Status:
              </Typography>
              <Chip
                label={selectedAd.approvalStatus.toUpperCase()}
                color={getApprovalColor(selectedAd.approvalStatus) as any}
              />
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Campaign Details:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    CPM Bid
                  </Typography>
                  <Typography variant="body2">${selectedAd.cpmBid.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Daily Budget
                  </Typography>
                  <Typography variant="body2">${selectedAd.dailyBudget}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Monthly Budget
                  </Typography>
                  <Typography variant="body2">${selectedAd.monthlyBudget}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedAd.status.toUpperCase()}
                    size="small"
                    color={getStatusColor(selectedAd.status) as any}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="subtitle2" gutterBottom>
              Placements:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {selectedAd.placements.map((placement) => (
                <Chip key={placement} label={placement} variant="outlined" size="small" />
              ))}
            </Box>

            {selectedAd.description && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Description:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {selectedAd.description}
                </Typography>
              </>
            )}

            <Typography variant="subtitle2" gutterBottom>
              Landing URL:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>
              {selectedAd.landingUrl}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedAd(null)}>Close</Button>
            {selectedAd.approvalStatus === 'pending_review' && (
              <>
                <Button onClick={handleRejectAd} color="error" variant="outlined">
                  Reject
                </Button>
                <Button onClick={handleApproveAd} color="success" variant="contained">
                  Approve
                </Button>
              </>
            )}
            {selectedAd.status === 'active' && (
              <Button
                onClick={() => handlePauseAd(selectedAd.id)}
                color="warning"
                variant="outlined"
              >
                Pause Campaign
              </Button>
            )}
            {selectedAd.status === 'paused' && (
              <Button
                onClick={() => handleResumeAd(selectedAd.id)}
                color="success"
                variant="contained"
              >
                Resume Campaign
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Bid Dialog */}
      <Dialog open={editBidDialogOpen} onClose={() => setEditBidDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update CPM Bid</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="New CPM Bid"
            type="number"
            fullWidth
            value={newBid}
            onChange={(e) => setNewBid(parseFloat(e.target.value))}
            inputProps={{ step: 0.1, min: 0.5, max: 100 }}
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <Alert severity="info">
            CPM bids must be between $0.50 and $100. Higher bids increase your chances of winning placements.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBidDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateBid} color="primary" variant="contained">
            Update Bid
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Ad Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Brand Ad Campaign</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Campaign Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Image URL"
            fullWidth
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Landing URL"
            fullWidth
            value={formData.landingUrl}
            onChange={(e) => setFormData({ ...formData, landingUrl: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            label="CPM Bid"
            type="number"
            fullWidth
            value={formData.cpmBid}
            onChange={(e) => setFormData({ ...formData, cpmBid: parseFloat(e.target.value) })}
            inputProps={{ step: 0.1, min: 0.5, max: 100 }}
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />

          <TextField
            label="Daily Budget"
            type="number"
            fullWidth
            value={formData.dailyBudget}
            onChange={(e) => {
              const daily = parseFloat(e.target.value);
              setFormData({
                ...formData,
                dailyBudget: daily,
                monthlyBudget: Math.max(daily * 7, formData.monthlyBudget),
              });
            }}
            inputProps={{ step: 10, min: 10, max: 10000 }}
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />

          <TextField
            label="Monthly Budget"
            type="number"
            fullWidth
            value={formData.monthlyBudget}
            onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) })}
            inputProps={{ step: 100, min: formData.dailyBudget * 7 }}
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Estimated monthly spend: ${monthlyEstimate.toFixed(2)} (based on {formData.placements.length} placement{formData.placements.length !== 1 ? 's' : ''})
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel>Ad Placements</FormLabel>
            <FormGroup>
              {['homepage', 'category', 'search', 'product_page'].map((placement) => (
                <FormControlLabel
                  key={placement}
                  control={
                    <Checkbox
                      checked={formData.placements.includes(placement)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            placements: [...formData.placements, placement],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            placements: formData.placements.filter((p) => p !== placement),
                          });
                        }
                      }}
                    />
                  }
                  label={placement.charAt(0).toUpperCase() + placement.slice(1).replace(/_/g, ' ')}
                />
              ))}
            </FormGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAd} color="primary" variant="contained">
            Create & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
