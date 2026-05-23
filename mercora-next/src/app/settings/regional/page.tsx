'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { useLocalization } from '@/contexts/LocalizationContext';
import { timezoneService } from '@/services/timezoneService';
import { regionalComplianceService } from '@/services/regionalComplianceService';
import { regionalPricingService } from '@/services/regionalPricingService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

export default function RegionalSettingsPage() {
  const { language, currency, setLanguage, setCurrency, currencies } = useLocalization();
  const [region, setRegion] = useState('US');
  const [timezone, setTimezone] = useState(timezoneService.getBrowserTimezone());
  const [saved, setSaved] = useState(false);

  const [compliance, setCompliance] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);

  useEffect(() => {
    const comp = regionalComplianceService.getRequirements(region);
    setCompliance(comp);

    const price = regionalPricingService.getRecommendedPrice(99.99, region);
    setPricing(price);
  }, [region]);

  const handleSave = () => {
    localStorage.setItem('region', region);
    localStorage.setItem('timezone', timezone);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const timezones = timezoneService.listSupportedTimezones();
  const regions = regionalComplianceService.listSupportedRegions();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Regional Settings
      </Typography>

      {saved && <Alert severity="success" sx={{ mb: 3 }}>Settings saved successfully!</Alert>}

      <Grid container spacing={3}>
        {/* Language & Currency */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Display Preferences" />
            <CardContent>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="tr">Türkçe</MenuItem>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={currency.code}
                    label="Currency"
                    onChange={(e) => {
                      const cur = currencies.find((c) => c.code === e.target.value);
                      if (cur) setCurrency(cur);
                    }}
                  >
                    {currencies.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Region & Timezone */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Location Settings" />
            <CardContent>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Region/Country</InputLabel>
                  <Select value={region} label="Region/Country" onChange={(e) => setRegion(e.target.value)}>
                    {regions.map((r) => (
                      <MenuItem key={r.code} value={r.code}>
                        {r.code} - {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select value={timezone} label="Timezone" onChange={(e) => setTimezone(e.target.value)}>
                    {timezones.map((tz) => (
                      <MenuItem key={tz.code} value={tz.code}>
                        {tz.code} ({tz.offset > 0 ? '+' : ''}{tz.offset}) - {tz.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button variant="contained" onClick={handleSave}>
                  Save Changes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Regional Pricing */}
        {pricing && (
          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader title="Regional Pricing" />
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Base Price (USD)</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      $99.99
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Local Price</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {pricing.currency} {pricing.price}
                    </Typography>
                  </Box>
                  <Divider />
                  <Typography variant="caption" color="textSecondary">
                    {pricing.rationale}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Compliance */}
        {compliance && (
          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader title="Regional Compliance" />
              <CardContent>
                <Stack spacing={1}>
                  {[
                    { label: 'GDPR', value: compliance.gdpr },
                    { label: 'CCPA', value: compliance.ccpa },
                    { label: 'LGPD', value: compliance.lgpd },
                    { label: 'Cookie Consent Required', value: compliance.cookieConsent },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.value ? (
                        <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                      ) : (
                        <Box sx={{ fontSize: 20, color: 'action.disabled' }}>○</Box>
                      )}
                      <Typography variant="body2">{item.label}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Privacy Policy */}
        {compliance && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Privacy & Data Protection" />
              <CardContent>
                <Alert icon={<InfoIcon />} severity="info">
                  {regionalComplianceService.getPrivacyPolicyText(region)}
                </Alert>
                <List dense sx={{ mt: 2 }}>
                  <ListItem>
                    <ListItemText
                      primary="Data Retention"
                      secondary={`${compliance.dataRetentionDays} days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Minimum Age"
                      secondary={`${compliance.minimumAge} years`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Invoice Required"
                      secondary={compliance.invoiceRequired ? 'Yes' : 'No'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Tax System"
                      secondary={`${compliance.taxSystem.toUpperCase()}${
                        compliance.taxRate ? ` (${compliance.taxRate}%)` : ''
                      }`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment Methods */}
        {compliance && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Available Payment Methods" />
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {compliance.paymentMethods.map((method: string) => (
                    <Chip
                      key={method}
                      label={method.replace(/_/g, ' ').toUpperCase()}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
