'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface BrandAdForm {
  brandId: string;
  title: string;
  description: string;
  imageUrl: string;
  landingUrl: string;
  cpmBid: number;
  dailyBudget: number;
  monthlyBudget: number;
  placements: string[];
}

interface BrandAdManagerProps {
  brandId: string;
  onAdCreated?: (adId: string) => void;
}

export const BrandAdManager: React.FC<BrandAdManagerProps> = ({ brandId, onAdCreated }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BrandAdForm>({
    brandId,
    title: '',
    description: '',
    imageUrl: '',
    landingUrl: '',
    cpmBid: 2.5,
    dailyBudget: 50,
    monthlyBudget: 1000,
    placements: ['homepage'],
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setSuccess(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cpmBid' || name === 'dailyBudget' || name === 'monthlyBudget'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlacementChange = (placement: string) => {
    setFormData((prev) => ({
      ...prev,
      placements: prev.placements.includes(placement)
        ? prev.placements.filter((p) => p !== placement)
        : [...prev.placements, placement],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.title || !formData.imageUrl || !formData.landingUrl) {
        throw new Error('Missing required fields');
      }

      if (formData.cpmBid < 0.5 || formData.cpmBid > 100) {
        throw new Error('CPM bid must be between $0.50 and $100');
      }

      if (formData.placements.length === 0) {
        throw new Error('Select at least one placement');
      }

      const response = await fetch('/api/ads/brand/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create ad');
      }

      const data = await response.json();
      setSuccess(true);
      onAdCreated?.(data.adId);

      // Reset form
      setFormData({
        brandId,
        title: '',
        description: '',
        imageUrl: '',
        landingUrl: '',
        cpmBid: 2.5,
        dailyBudget: 50,
        monthlyBudget: 1000,
        placements: ['homepage'],
      });

      setTimeout(() => {
        handleCloseDialog();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
        Create Brand Ad
      </Button>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Brand Ad Campaign</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Ad created successfully!</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Ad Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
              required
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              fullWidth
              required
              type="url"
            />

            <TextField
              label="Landing URL"
              name="landingUrl"
              value={formData.landingUrl}
              onChange={handleInputChange}
              fullWidth
              required
              type="url"
            />

            <TextField
              label="CPM Bid ($)"
              name="cpmBid"
              value={formData.cpmBid}
              onChange={handleInputChange}
              type="number"
              inputProps={{ step: 0.1, min: 0.5, max: 100 }}
              fullWidth
            />

            <TextField
              label="Daily Budget ($)"
              name="dailyBudget"
              value={formData.dailyBudget}
              onChange={handleInputChange}
              type="number"
              inputProps={{ min: 10 }}
              fullWidth
            />

            <TextField
              label="Monthly Budget ($)"
              name="monthlyBudget"
              value={formData.monthlyBudget}
              onChange={handleInputChange}
              type="number"
              inputProps={{ min: 100 }}
              fullWidth
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Ad Placements</FormLabel>
              <FormGroup>
                {['homepage', 'category', 'search', 'product_page'].map((placement) => (
                  <FormControlLabel
                    key={placement}
                    control={
                      <Checkbox
                        checked={formData.placements.includes(placement)}
                        onChange={() => handlePlacementChange(placement)}
                      />
                    }
                    label={placement.replace('_', ' ')}
                  />
                ))}
              </FormGroup>
            </FormControl>

            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2">Estimated Monthly Cost</Typography>
              <Typography variant="h6">
                ${(formData.monthlyBudget).toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on {formData.placements.length} placement(s)
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading || !formData.title || !formData.landingUrl}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Create Ad'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BrandAdManager;
