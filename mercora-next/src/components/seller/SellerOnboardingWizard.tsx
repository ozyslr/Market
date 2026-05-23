'use client';

/**
 * Seller Onboarding Wizard
 * Multi-step onboarding flow:
 * Step 1: Store Profile (name, slug, description)
 * Step 2: Business Details (tax ID, bank account, address)
 * Step 3: Subscription Tier Selection
 * Step 4: Payment Method
 * Step 5: Review & Confirm
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Paper,
} from '@mui/material';
import { SellerSubscriptionTier } from '@/types';
import {
  TIER_BENEFITS,
} from '@/services/sellerSubscriptionService';
import { createSubscriptionWithTrial } from '@/services/stripeSubscriptionService';

type OnboardingStep = 'profile' | 'business' | 'tier' | 'payment' | 'review';

interface OnboardingState {
  // Profile
  storeName: string;
  storeSlug: string;
  description: string;
  bannerUrl?: string;

  // Business
  taxId?: string;
  bankAccount?: {
    accountNumber: string;
    accountHolder: string;
    bankName: string;
  };
  businessAddress?: {
    line1: string;
    city: string;
    state: string;
    country: string;
  };

  // Tier
  selectedTier: SellerSubscriptionTier;
  billingCycle: 'monthly' | 'yearly';

  // Submission
  isSubmitting: boolean;
  error?: string;
}

const STEPS: OnboardingStep[] = ['profile', 'business', 'tier', 'payment', 'review'];

const STEP_LABELS = {
  profile: 'Store Profile',
  business: 'Business Details',
  tier: 'Select Tier',
  payment: 'Payment Method',
  review: 'Review & Confirm',
};

export interface SellerOnboardingWizardProps {
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: Error) => void;
}

export default function SellerOnboardingWizard({
  sellerId,
  sellerEmail,
  sellerName,
  onSuccess,
  onError,
}: SellerOnboardingWizardProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [state, setState] = useState<OnboardingState>({
    storeName: '',
    storeSlug: '',
    description: '',
    selectedTier: 'standard',
    billingCycle: 'monthly',
    isSubmitting: false,
  });

  const handleNext = useCallback(() => {
    // Validate current step before advancing
    if (activeStep === 0) {
      if (!state.storeName.trim()) {
        setState((s) => ({ ...s, error: 'Store name is required' }));
        return;
      }
      if (!state.storeSlug.trim()) {
        setState((s) => ({ ...s, error: 'Store slug is required' }));
        return;
      }
    }

    if (activeStep === 1) {
      // Business details validation
      if (!state.businessAddress?.line1) {
        setState((s) => ({ ...s, error: 'Address is required' }));
        return;
      }
    }

    setState((s) => ({ ...s, error: undefined }));
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [activeStep, state.storeName, state.storeSlug, state.businessAddress]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleInputChange = useCallback(
    (field: string, value: any) => {
      setState((s) => ({
        ...s,
        [field]: value,
        error: undefined,
      }));
    },
    []
  );

  const handleAddressChange = useCallback(
    (field: string, value: string) => {
      setState((s) => ({
        ...s,
        businessAddress: {
          ...s.businessAddress,
          [field]: value,
        },
      }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isSubmitting: true, error: undefined }));

      // Create subscription with Stripe
      const result = await createSubscriptionWithTrial(
        sellerId,
        sellerEmail,
        state.storeName,
        state.selectedTier,
        state.billingCycle
      );

      // Complete onboarding
      const response = await fetch('/api/seller/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          storeName: state.storeName,
          storeSlug: state.storeSlug,
          description: state.description,
          businessAddress: state.businessAddress,
          taxId: state.taxId,
          bankAccount: state.bankAccount,
          selectedTier: state.selectedTier,
          billingCycle: state.billingCycle,
          stripeSubscriptionId: result.stripeSubscriptionId,
          stripePriceId: result.stripePriceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      const data = await response.json();
      onSuccess?.(data.subscriptionId);

      // Redirect to seller dashboard
      router.push(`/seller/${sellerId}/dashboard`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((s) => ({ ...s, error: err.message }));
      onError?.(err);
    } finally {
      setState((s) => ({ ...s, isSubmitting: false }));
    }
  }, [sellerId, sellerEmail, state, router, onSuccess, onError]);

  const currentStep = STEPS[activeStep];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Complete Your Seller Setup
          </Typography>

          <Stepper activeStep={activeStep} sx={{ my: 4 }}>
            {STEPS.map((step) => (
              <Step key={step}>
                <StepLabel>{STEP_LABELS[step]}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {state.error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {state.error}
            </Alert>
          )}

          {/* Step 1: Profile */}
          {currentStep === 'profile' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Store Name"
                value={state.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Store Slug (URL-friendly)"
                value={state.storeSlug}
                onChange={(e) =>
                  handleInputChange(
                    'storeSlug',
                    e.target.value.toLowerCase().replace(/\s+/g, '-')
                  )
                }
                fullWidth
                required
                helperText="Example: my-awesome-store"
              />
              <TextField
                label="Store Description"
                value={state.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={3}
                helperText="Tell customers about your store"
              />
            </Box>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 'business' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1">Business Address</Typography>
              <TextField
                label="Address Line 1"
                value={state.businessAddress?.line1 || ''}
                onChange={(e) => handleAddressChange('line1', e.target.value)}
                fullWidth
                required
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="City"
                    value={state.businessAddress?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="State/Region"
                    value={state.businessAddress?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <TextField
                label="Tax ID (optional)"
                value={state.taxId || ''}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                fullWidth
              />
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Bank Account (for payouts)
              </Typography>
              <TextField
                label="Bank Account Number"
                value={state.bankAccount?.accountNumber || ''}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    bankAccount: { ...s.bankAccount, accountNumber: e.target.value },
                  }))
                }
                fullWidth
                type="password"
              />
            </Box>
          )}

          {/* Step 3: Tier Selection */}
          {currentStep === 'tier' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Choose Your Plan
              </Typography>

              <Grid container spacing={3} sx={{ my: 1 }}>
                {(['standard', 'pro', 'enterprise'] as const).map((tier) => {
                  const benefits = TIER_BENEFITS[tier];
                  const price =
                    state.billingCycle === 'monthly'
                      ? benefits.monthlyPrice
                      : benefits.yearlyPrice;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={tier}>
                      <Paper
                        sx={{
                          p: 2,
                          border:
                            state.selectedTier === tier ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: 3 },
                        }}
                        onClick={() => handleInputChange('selectedTier', tier)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Radio
                            checked={state.selectedTier === tier}
                            onChange={() => handleInputChange('selectedTier', tier)}
                          />
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {tier}
                          </Typography>
                        </Box>

                        <Typography variant="h5" color="primary" gutterBottom>
                          ${price.toFixed(2)}/
                          {state.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </Typography>

                        <Box component="ul" sx={{ pl: 2, my: 2 }}>
                          <li>
                            <Typography variant="body2">
                              Max {benefits.maxProducts === -1 ? 'Unlimited' : benefits.maxProducts}{' '}
                              products
                            </Typography>
                          </li>
                          {benefits.inventorySyncApi && (
                            <li>
                              <Typography variant="body2">Inventory Sync API</Typography>
                            </li>
                          )}
                          {benefits.advancedAnalytics && (
                            <li>
                              <Typography variant="body2">Advanced Analytics</Typography>
                            </li>
                          )}
                          {benefits.featuredBadge && (
                            <li>
                              <Typography variant="body2">Featured Badge</Typography>
                            </li>
                          )}
                          {benefits.dedicatedAccountManager && (
                            <li>
                              <Typography variant="body2">Dedicated Account Manager</Typography>
                            </li>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              <Box sx={{ my: 3 }}>
                <RadioGroup
                  row
                  value={state.billingCycle}
                  onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                >
                  <FormControlLabel value="monthly" control={<Radio />} label="Monthly Billing" />
                  <FormControlLabel value="yearly" control={<Radio />} label="Yearly Billing (Save 17%)" />
                </RadioGroup>
              </Box>

              <Alert severity="info">
                🎁 Get 30 days free trial on all paid plans!
              </Alert>
            </Box>
          )}

          {/* Step 4: Payment Method */}
          {currentStep === 'payment' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Payment Method
              </Typography>
              <Alert severity="info">
                You'll be redirected to Stripe to securely add your payment method. Your 30-day
                trial will start immediately.
              </Alert>
            </Box>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Review Your Setup
              </Typography>
              <Card variant="outlined" sx={{ p: 2, my: 2 }}>
                <Typography variant="body2">
                  <strong>Store Name:</strong> {state.storeName}
                </Typography>
                <Typography variant="body2">
                  <strong>Plan:</strong> {state.selectedTier} ({state.billingCycle})
                </Typography>
                <Typography variant="body2">
                  <strong>Trial:</strong> 30 days free, then{' '}
                  {TIER_BENEFITS[state.selectedTier][
                    state.billingCycle === 'monthly' ? 'monthlyPrice' : 'yearlyPrice'
                  ]}{' '}
                  / {state.billingCycle === 'monthly' ? 'month' : 'year'}
                </Typography>
              </Card>
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>

            <Box>
              {activeStep === STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={state.isSubmitting}
                  sx={{ minWidth: 120 }}
                >
                  {state.isSubmitting ? <CircularProgress size={24} /> : 'Complete Setup'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
