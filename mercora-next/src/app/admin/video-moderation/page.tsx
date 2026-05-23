'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import { videoModerationService } from '@/services/videoModerationService';

interface PendingVideo {
  id: string;
  videoUrl: string;
  reviewId: string;
  flags: Array<{ type: string; confidence: number; description: string }>;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  createdAt: string;
}

export default function VideoModerationPage() {
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<PendingVideo | null>(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({
    totalReviewed: 0,
    approved: 0,
    rejected: 0,
    pendingCount: 0,
    approvalRate: 0,
    avgReviewTimeMinutes: 0,
  });

  useEffect(() => {
    loadPendingVideos();
    loadStats();
  }, []);

  const loadPendingVideos = async () => {
    setIsLoading(true);
    try {
      // Simulate loading pending videos
      const mockVideos: PendingVideo[] = [
        {
          id: 'vid_1',
          videoUrl: 'gs://bucket/review_1/video.mp4',
          reviewId: 'review_1',
          flags: [
            { type: 'other', confidence: 0.6, description: 'Video is very short (<5 seconds)' },
          ],
          riskLevel: 'low',
          summary: '1 flag detected: other',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'vid_2',
          videoUrl: 'gs://bucket/review_2/video.mp4',
          reviewId: 'review_2',
          flags: [
            { type: 'adult', confidence: 0.8, description: 'Contains potentially inappropriate keyword' },
          ],
          riskLevel: 'high',
          summary: '1 flag detected: adult',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setPendingVideos(mockVideos);
    } catch (error) {
      console.error('Load pending videos error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const mockStats = {
        totalReviewed: 156,
        approved: 142,
        rejected: 14,
        pendingCount: 2,
        approvalRate: 91,
        avgReviewTimeMinutes: 8,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedVideo) return;

    try {
      // In production: call videoModerationService.approveVideo()
      console.log(`Approving video: ${selectedVideo.id}`);
      setPendingVideos((prev) => prev.filter((v) => v.id !== selectedVideo.id));
      setSelectedVideo(null);
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedVideo || !rejectionReason) return;

    try {
      // In production: call videoModerationService.rejectVideo()
      console.log(`Rejecting video: ${selectedVideo.id}, Reason: ${rejectionReason}`);
      setPendingVideos((prev) => prev.filter((v) => v.id !== selectedVideo.id));
      setSelectedVideo(null);
      setRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Video Moderation Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and moderate uploaded product review videos
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h5">{stats.pendingCount}</Typography>
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
                Approved
              </Typography>
              <Typography variant="h5">{stats.approved}</Typography>
              <Typography variant="caption" color="text.secondary">
                This week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Approval Rate
              </Typography>
              <Typography variant="h5">{stats.approvalRate}%</Typography>
              <Typography variant="caption" color="text.secondary">
                Overall
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg Review Time
              </Typography>
              <Typography variant="h5">{stats.avgReviewTimeMinutes}m</Typography>
              <Typography variant="caption" color="text.secondary">
                Per video
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)}>
          <Tab label={`Pending (${stats.pendingCount})`} />
          <Tab label="Queue" />
          <Tab label="Guidelines" />
        </Tabs>
      </Paper>

      {/* Pending Videos */}
      {tab === 0 && (
        <Box>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : pendingVideos.length === 0 ? (
            <Alert severity="info">No pending videos to review</Alert>
          ) : (
            <Grid container spacing={2}>
              {pendingVideos.map((video) => (
                <Grid item xs={12} md={6} key={video.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: 3 },
                    }}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2">{video.reviewId}</Typography>
                        <Chip
                          label={video.riskLevel.toUpperCase()}
                          color={getRiskColor(video.riskLevel) as any}
                          size="small"
                        />
                      </Box>

                      <Alert severity={video.riskLevel === 'low' ? 'success' : 'warning'} sx={{ mb: 2 }}>
                        {video.summary}
                      </Alert>

                      <Box>
                        {video.flags.map((flag, idx) => (
                          <Chip
                            key={idx}
                            label={`${flag.type} (${(flag.confidence * 100).toFixed(0)}%)`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Submitted: {new Date(video.createdAt).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Video Details Dialog */}
      {selectedVideo && (
        <Dialog open={true} onClose={() => setSelectedVideo(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedVideo.reviewId}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Alert severity={selectedVideo.riskLevel === 'low' ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {selectedVideo.summary}
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Flags Detected:
            </Typography>
            <Box sx={{ mb: 2 }}>
              {selectedVideo.flags.map((flag, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {flag.type}
                    </Typography>
                    <Chip
                      label={`${(flag.confidence * 100).toFixed(0)}%`}
                      size="small"
                      color={flag.confidence > 0.7 ? 'error' : 'warning'}
                    />
                  </Box>
                  <Typography variant="caption">{flag.description}</Typography>
                </Paper>
              ))}
            </Box>

            <TextField
              label="Moderator Notes"
              multiline
              rows={3}
              fullWidth
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedVideo(null)}>Cancel</Button>
            <Button
              onClick={() => setRejectDialog(true)}
              color="error"
              variant="outlined"
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              color="success"
              variant="contained"
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Video</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            select
            label="Rejection Reason"
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="">Select a reason...</option>
            <option value="violence">Violence or Harmful Content</option>
            <option value="adult_content">Adult Content</option>
            <option value="hate_speech">Hate Speech</option>
            <option value="misinformation">Misinformation</option>
            <option value="copyright_issue">Copyright Issue</option>
            <option value="spam">Spam</option>
            <option value="irrelevant">Irrelevant to Product</option>
            <option value="other">Other</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectionReason}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
