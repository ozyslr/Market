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
  Select,
  MenuItem,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';

interface ChargebackCase {
  id: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'new' | 'submitted' | 'under_review' | 'evidence_submitted' | 'won' | 'lost' | 'withdrawn';
  reason: string;
  issuerReason: string;
  caseNumber: string;
  createdAt: string;
  submissionDeadline: string;
  responseDeadline: string;
  evidenceCount: number;
  probabilityOfWinning: number;
}

interface ChargebackTimeline {
  date: string;
  event: string;
  type: 'filed' | 'received' | 'evidence_uploaded' | 'merchant_response' | 'decision' | 'appeal';
  details: string;
}

interface EvidenceItem {
  id: string;
  type: 'order_receipt' | 'delivery_proof' | 'communication' | 'product_quality' | 'refund_proof' | 'other';
  fileName: string;
  uploadedAt: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

const mockChargebacks: ChargebackCase[] = [
  {
    id: 'cb-001',
    transactionId: 'txn-7892015',
    customerId: 'cust-4521',
    customerName: 'Sarah Mitchell',
    amount: 349.99,
    currency: 'USD',
    status: 'evidence_submitted',
    reason: 'Unauthorized Transaction',
    issuerReason: '71 - Unauthorized Transaction',
    caseNumber: '2024-05-15-001',
    createdAt: '2026-05-15',
    submissionDeadline: '2026-05-29',
    responseDeadline: '2026-06-12',
    evidenceCount: 4,
    probabilityOfWinning: 85,
  },
  {
    id: 'cb-002',
    transactionId: 'txn-7891998',
    customerId: 'cust-3890',
    customerName: 'James Chen',
    amount: 124.50,
    currency: 'USD',
    status: 'under_review',
    reason: 'Product Not as Described',
    issuerReason: '53 - Not as Described',
    caseNumber: '2024-05-14-042',
    createdAt: '2026-05-14',
    submissionDeadline: '2026-05-28',
    responseDeadline: '2026-06-11',
    evidenceCount: 2,
    probabilityOfWinning: 65,
  },
  {
    id: 'cb-003',
    transactionId: 'txn-7891875',
    customerId: 'cust-5123',
    customerName: 'Maria Rodriguez',
    amount: 89.99,
    currency: 'USD',
    status: 'new',
    reason: 'Non-Delivery of Service',
    issuerReason: '30 - Services Not Provided',
    caseNumber: '2024-05-13-156',
    createdAt: '2026-05-13',
    submissionDeadline: '2026-05-27',
    responseDeadline: '2026-06-10',
    evidenceCount: 0,
    probabilityOfWinning: 72,
  },
  {
    id: 'cb-004',
    transactionId: 'txn-7891702',
    customerId: 'cust-2145',
    customerName: 'David Wong',
    amount: 256.00,
    currency: 'USD',
    status: 'won',
    reason: 'Duplicate Charge',
    issuerReason: '74 - Duplicate Processing',
    caseNumber: '2024-05-01-089',
    createdAt: '2026-05-01',
    submissionDeadline: '2026-05-15',
    responseDeadline: '2026-05-29',
    evidenceCount: 5,
    probabilityOfWinning: 100,
  },
];

const mockTimeline: ChargebackTimeline[] = [
  {
    date: '2026-05-15',
    event: 'Chargeback Filed',
    type: 'filed',
    details: 'Customer filed chargeback with issuing bank',
  },
  {
    date: '2026-05-16',
    event: 'Case Received',
    type: 'received',
    details: 'Chargeback case received and assigned case number',
  },
  {
    date: '2026-05-18',
    event: 'Evidence Uploaded',
    type: 'evidence_uploaded',
    details: 'Shipping proof and delivery confirmation submitted',
  },
  {
    date: '2026-05-20',
    event: 'Evidence Reviewed',
    type: 'merchant_response',
    details: 'Additional evidence uploaded: customer communication history',
  },
];

const mockEvidence: EvidenceItem[] = [
  {
    id: 'ev-001',
    type: 'delivery_proof',
    fileName: 'delivery_signature_txn7892015.pdf',
    uploadedAt: '2026-05-18',
    status: 'approved',
  },
  {
    id: 'ev-002',
    type: 'order_receipt',
    fileName: 'order_receipt_2024051235.pdf',
    uploadedAt: '2026-05-18',
    status: 'approved',
  },
  {
    id: 'ev-003',
    type: 'communication',
    fileName: 'customer_emails_proof.pdf',
    uploadedAt: '2026-05-20',
    status: 'pending_review',
  },
  {
    id: 'ev-004',
    type: 'product_quality',
    fileName: 'product_photos_evidence.zip',
    uploadedAt: '2026-05-20',
    status: 'pending_review',
  },
];

function getStatusColor(status: string): 'default' | 'error' | 'warning' | 'info' | 'success' {
  switch (status) {
    case 'new':
    case 'submitted':
      return 'info';
    case 'under_review':
      return 'warning';
    case 'evidence_submitted':
      return 'warning';
    case 'won':
      return 'success';
    case 'lost':
    case 'withdrawn':
      return 'error';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ChargebackManagementPage() {
  const [tab, setTab] = useState(0);
  const [selectedCase, setSelectedCase] = useState<ChargebackCase | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<string>('');
  const [evidenceType, setEvidenceType] = useState<string>('order_receipt');
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(true);
  const [responseDeadlineDays, setResponseDeadlineDays] = useState(7);

  const activeChargebacks = mockChargebacks.filter(
    (cb) => !['won', 'lost', 'withdrawn'].includes(cb.status)
  );
  const resolvedChargebacks = mockChargebacks.filter((cb) =>
    ['won', 'lost', 'withdrawn'].includes(cb.status)
  );

  const totalAmount = mockChargebacks.reduce((sum, cb) => sum + cb.amount, 0);
  const winRate = (
    (mockChargebacks.filter((cb) => cb.status === 'won').length / mockChargebacks.length) *
    100
  ).toFixed(0);

  const handleOpenDetails = (chargebackCase: ChargebackCase) => {
    setSelectedCase(chargebackCase);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedCase(null);
  };

  const handleOpenUpload = (chargebackCase: ChargebackCase) => {
    setSelectedCase(chargebackCase);
    setUploadDialogOpen(true);
  };

  const handleCloseUpload = () => {
    setUploadDialogOpen(false);
    setEvidenceFile('');
    setEvidenceType('order_receipt');
  };

  const handleSubmitEvidence = () => {
    if (!evidenceFile.trim()) {
      alert('Please select a file');
      return;
    }
    alert(`Evidence uploaded: ${evidenceFile}`);
    handleCloseUpload();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Chargeback Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Monitor and respond to chargeback disputes from cardholders and banks
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Active Cases
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {activeChargebacks.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(activeChargebacks.length / mockChargebacks.length) * 100}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Win Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                {winRate}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {mockChargebacks.filter((cb) => cb.status === 'won').length} of{' '}
                {mockChargebacks.length} resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Total At Risk
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f44336' }}>
                ${totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Across {mockChargebacks.length} cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Avg. Win Probability
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {(
                  mockChargebacks.reduce((sum, cb) => sum + cb.probabilityOfWinning, 0) /
                  mockChargebacks.length
                ).toFixed(0)}
                %
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Based on evidence quality
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Panel */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Auto-Response Settings"
          subheader="Configure automatic responses to chargeback disputes"
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoResponseEnabled}
                  onChange={(e) => setAutoResponseEnabled(e.target.checked)}
                />
              }
              label={`Auto-respond to new chargebacks (${autoResponseEnabled ? 'Enabled' : 'Disabled'})`}
            />
            <TextField
              label="Response deadline (days)"
              type="number"
              value={responseDeadlineDays}
              onChange={(e) => setResponseDeadlineDays(parseInt(e.target.value))}
              inputProps={{ min: 1, max: 30 }}
              sx={{ width: 180 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
          <Tab label={`Active Cases (${activeChargebacks.length})`} />
          <Tab label={`Resolved (${resolvedChargebacks.length})`} />
        </Tabs>
      </Box>

      {/* Active Cases Table */}
      {tab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Case Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Win Probability</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Deadline</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeChargebacks.map((chargebackCase) => (
                <TableRow key={chargebackCase.id} hover>
                  <TableCell>{chargebackCase.caseNumber}</TableCell>
                  <TableCell>{chargebackCase.customerName}</TableCell>
                  <TableCell>${chargebackCase.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(chargebackCase.status)}
                      color={getStatusColor(chargebackCase.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{chargebackCase.reason}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={chargebackCase.probabilityOfWinning}
                        sx={{ width: 60 }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 30 }}>
                        {chargebackCase.probabilityOfWinning}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(chargebackCase.responseDeadline).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDetails(chargebackCase)}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenUpload(chargebackCase)}
                      >
                        Upload Evidence
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Resolved Cases Table */}
      {tab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Case Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Resolved</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolvedChargebacks.map((chargebackCase) => (
                <TableRow key={chargebackCase.id} hover>
                  <TableCell>{chargebackCase.caseNumber}</TableCell>
                  <TableCell>{chargebackCase.customerName}</TableCell>
                  <TableCell>${chargebackCase.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(chargebackCase.status)}
                      color={getStatusColor(chargebackCase.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{chargebackCase.reason}</TableCell>
                  <TableCell>
                    <Typography variant="caption">2026-05-29</Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenDetails(chargebackCase)}
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

      {/* Case Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Chargeback Case Details</DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Box sx={{ mt: 2 }}>
              {/* Case Info */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Case Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedCase.caseNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={getStatusLabel(selectedCase.status)}
                      color={getStatusColor(selectedCase.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Customer
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedCase.customerName} (ID: {selectedCase.customerId})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Amount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${selectedCase.amount.toFixed(2)} {selectedCase.currency}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Reason
                    </Typography>
                    <Typography variant="body2">{selectedCase.reason}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Issuer Reason Code
                    </Typography>
                    <Typography variant="body2">{selectedCase.issuerReason}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Response Deadline
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedCase.responseDeadline).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Win Probability
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedCase.probabilityOfWinning}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 35 }}>
                        {selectedCase.probabilityOfWinning}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Timeline */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Case Timeline
                </Typography>
                <Timeline position="alternate">
                  {mockTimeline.map((event, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent color="textSecondary">
                        {new Date(event.date).toLocaleDateString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot
                          sx={{
                            backgroundColor:
                              event.type === 'filed'
                                ? '#2196f3'
                                : event.type === 'evidence_uploaded'
                                  ? '#4caf50'
                                  : '#ff9800',
                          }}
                        />
                        {index < mockTimeline.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {event.event}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {event.details}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Box>

              {/* Evidence */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Evidence Submitted ({mockEvidence.length})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Uploaded</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockEvidence.map((evidence) => (
                      <TableRow key={evidence.id}>
                        <TableCell>{evidence.type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{evidence.fileName}</TableCell>
                        <TableCell>{new Date(evidence.uploadedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={evidence.status.replace(/_/g, ' ')}
                            color={
                              evidence.status === 'approved'
                                ? 'success'
                                : evidence.status === 'pending_review'
                                  ? 'warning'
                                  : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseDetails();
              if (selectedCase) {
                handleOpenUpload(selectedCase);
              }
            }}
          >
            Upload Evidence
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Evidence Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Evidence</DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Deadline: {new Date(selectedCase.responseDeadline).toLocaleDateString()}
              </Alert>
              <TextField
                fullWidth
                label="Evidence Type"
                select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="order_receipt">Order Receipt</MenuItem>
                <MenuItem value="delivery_proof">Delivery Proof</MenuItem>
                <MenuItem value="communication">Customer Communication</MenuItem>
                <MenuItem value="product_quality">Product Quality Documentation</MenuItem>
                <MenuItem value="refund_proof">Refund Proof</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="File Name"
                value={evidenceFile}
                onChange={(e) => setEvidenceFile(e.target.value)}
                placeholder="evidence_file.pdf"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="textSecondary">
                Supported formats: PDF, JPEG, PNG, DOCX. Max size: 10MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitEvidence}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
