'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { abTestingService, ABTest, Variant } from '@/services/abTestingService';

interface TestRow extends ABTest {
  users: number;
  conversions: number;
  conversionRate: number;
}

export default function ABTestingPage() {
  const [tests, setTests] = useState<TestRow[]>([
    {
      id: 'test-001',
      name: 'Checkout Button Color',
      description: 'Testing green vs blue button',
      status: 'active',
      variants: [
        { id: 'variant-green', name: 'Green Button', percentage: 50 },
        { id: 'variant-blue', name: 'Blue Button', percentage: 50 },
      ],
      startDate: new Date(),
      metrics: { primary: 'conversion_rate' },
      users: 2500,
      conversions: 315,
      conversionRate: 12.6,
    },
    {
      id: 'test-002',
      name: 'Product Page Layout',
      description: 'Grid vs List layout comparison',
      status: 'active',
      variants: [
        { id: 'variant-grid', name: 'Grid View', percentage: 50 },
        { id: 'variant-list', name: 'List View', percentage: 50 },
      ],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      metrics: { primary: 'click_rate' },
      users: 3200,
      conversions: 512,
      conversionRate: 16.0,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    variant1Name: '',
    variant1Percent: 50,
    variant2Name: '',
    variant2Percent: 50,
  });

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.variant1Name || !newTest.variant2Name) {
      alert('Please fill in all fields');
      return;
    }

    const test: ABTest = {
      id: `test-${Date.now()}`,
      name: newTest.name,
      description: newTest.description,
      status: 'draft',
      variants: [
        {
          id: `variant-${Date.now()}-1`,
          name: newTest.variant1Name,
          percentage: newTest.variant1Percent,
        },
        {
          id: `variant-${Date.now()}-2`,
          name: newTest.variant2Name,
          percentage: newTest.variant2Percent,
        },
      ],
      startDate: new Date(),
      metrics: { primary: 'conversion_rate' },
    };

    const result = await abTestingService.createTest(test);
    if (result.success) {
      setTests([
        ...tests,
        {
          ...test,
          users: 0,
          conversions: 0,
          conversionRate: 0,
        },
      ]);
      setOpenDialog(false);
      setNewTest({
        name: '',
        description: '',
        variant1Name: '',
        variant1Percent: 50,
        variant2Name: '',
        variant2Percent: 50,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
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
            A/B Testing
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Test
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Active Tests" />
            <CardContent>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Variants</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Users
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Conversions
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Conv. Rate
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {test.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {test.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {test.variants.map((v) => (
                              <Typography key={v.id} variant="caption">
                                {v.name} ({v.percentage}%)
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{test.users.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {test.conversions.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {test.conversionRate.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                            size="small"
                            color={getStatusColor(test.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small">View Results</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New A/B Test</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Test Name"
              value={newTest.name}
              onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={newTest.description}
              onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
              multiline
              rows={2}
            />

            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Variant A
              </Typography>
              <TextField
                fullWidth
                label="Variant Name"
                value={newTest.variant1Name}
                onChange={(e) => setNewTest({ ...newTest, variant1Name: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Traffic %"
                type="number"
                value={newTest.variant1Percent}
                onChange={(e) =>
                  setNewTest({
                    ...newTest,
                    variant1Percent: parseInt(e.target.value),
                    variant2Percent: 100 - parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Box>

            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Variant B
              </Typography>
              <TextField
                fullWidth
                label="Variant Name"
                value={newTest.variant2Name}
                onChange={(e) => setNewTest({ ...newTest, variant2Name: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Traffic %"
                type="number"
                value={newTest.variant2Percent}
                onChange={(e) =>
                  setNewTest({
                    ...newTest,
                    variant2Percent: parseInt(e.target.value),
                    variant1Percent: 100 - parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 0, max: 100 }}
                disabled
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTest}>
            Create Test
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
