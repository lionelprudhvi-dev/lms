'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    academic_year: '2026-2027',
    attendance_geofence_default: 150,
    ip_matching_scope: 'company',
    ip_matching_window_minutes: 60,
    rules: {
      block_materials_on_unpaid: true,
      block_exams_on_unpaid: true,
      block_certificate_on_unpaid: true,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings');
      if (res.data) {
        setSettings({
          ...res.data,
          rules: res.data.rules || {
            block_materials_on_unpaid: true,
            block_exams_on_unpaid: true,
            block_certificate_on_unpaid: true,
          },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleKey) => {
    setSettings((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleKey]: !prev.rules[ruleKey],
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/settings', settings);
      showToast('Organization settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="System Settings & Governance"
          subtitle="Configure enterprise-wide parameters: attendance geofence radius, IP fraud detection, and fee clearance rules."
        />

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* General Localization */}
            <Grid item xs={12} md={6}>
              <SectionCard title="Localization & Academic Calendar">
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Academic Year"
                      fullWidth
                      value={settings.academic_year || '2026-2027'}
                      onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Currency"
                      fullWidth
                      value={settings.currency || 'INR'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    >
                      <MenuItem value="INR">INR (₹ - Indian Rupee)</MenuItem>
                      <MenuItem value="USD">USD ($ - US Dollar)</MenuItem>
                      <MenuItem value="EUR">EUR (€ - Euro)</MenuItem>
                      <MenuItem value="GBP">GBP (£ - British Pound)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="System Timezone"
                      fullWidth
                      value={settings.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</MenuItem>
                      <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST/EDT)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            {/* Attendance & IP Matching Governance */}
            <Grid item xs={12} md={6}>
              <SectionCard title="Attendance & Geofencing Parameters">
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      type="number"
                      label="Default Geofence Radius (Meters)"
                      helperText="Maximum allowed distance between student GPS and approved campus center"
                      fullWidth
                      value={settings.attendance_geofence_default || 150}
                      onChange={(e) => setSettings({ ...settings, attendance_geofence_default: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="IP Matching Scope"
                      helperText="Scope across which shared public IPs trigger review alerts"
                      fullWidth
                      value={settings.ip_matching_scope || 'company'}
                      onChange={(e) => setSettings({ ...settings, ip_matching_scope: e.target.value })}
                    >
                      <MenuItem value="company">Same Company</MenuItem>
                      <MenuItem value="batch">Same Batch</MenuItem>
                      <MenuItem value="organization">Entire Organization</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="number"
                      label="IP Match Window (Minutes)"
                      helperText="Time interval between simultaneous check-ins"
                      fullWidth
                      value={settings.ip_matching_window_minutes || 60}
                      onChange={(e) => setSettings({ ...settings, ip_matching_window_minutes: Number(e.target.value) })}
                    />
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            {/* Business Rules & Restrictions */}
            <Grid item xs={12}>
              <SectionCard title="Fee Compliance & Access Control Rules">
                <Typography variant="body2" sx={{ color: '#5B6B88', mb: 2 }}>
                  Configurable restrictions enforced across the student portal based on outstanding tuition installments.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.rules?.block_materials_on_unpaid)}
                            onChange={() => handleRuleToggle('block_materials_on_unpaid')}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Block Course Materials</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mt: 0.5 }}>
                        Restricts download of syllabus notes and video recordings when fee is overdue.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.rules?.block_exams_on_unpaid)}
                            onChange={() => handleRuleToggle('block_exams_on_unpaid')}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Block Exam Access</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mt: 0.5 }}>
                        Prevents starting timed examination windows if fee installments are unpaid.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.rules?.block_certificate_on_unpaid)}
                            onChange={() => handleRuleToggle('block_certificate_on_unpaid')}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Block Certificate Generation</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mt: 0.5 }}>
                        Requires 100% tuition clearance before certificate issuance and QR verification.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            {/* Save Action */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  sx={{ bgcolor: '#1D4ED8', height: 48, px: 4, fontWeight: 700, borderRadius: '10px' }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </PageContainer>
    </AdminLayout>
  );
}
