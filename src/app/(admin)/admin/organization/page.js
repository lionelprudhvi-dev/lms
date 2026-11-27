'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import { Box, Grid, TextField, Button, Typography, Switch, FormControlLabel, MenuItem, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function OrganizationPage() {
  const { showToast } = useToast();
  const [org, setOrg] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address: '',
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
      allow_temporary_admin_override: true,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrg();
  }, []);

  const fetchOrg = async () => {
    try {
      const res = await api.get('/api/organizations');
      if (res && res.data) {
        setOrg((prev) => ({
          ...prev,
          ...res.data,
          rules: res.data.rules || prev.rules,
        }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/organizations', org);
      showToast('Organization settings updated successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Organization Profile & Policies"
          subtitle="Manage multi-tenant global governance, global attendance geofencing, IP detection parameters, and fee restriction rules."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Organization' }]}
        />

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* General Info Card */}
            <Grid item xs={12} md={6}>
              <SectionCard title="General Organization Details">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Organization Legal Name"
                    value={org.name || ''}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Organization Code"
                    value={org.code || ''}
                    disabled
                    helperText="Fixed system identifier"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Official Email"
                    type="email"
                    value={org.email || ''}
                    onChange={(e) => setOrg({ ...org, email: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Support Contact Phone"
                    value={org.phone || ''}
                    onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Portal Website"
                    value={org.website || ''}
                    onChange={(e) => setOrg({ ...org, website: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Headquarters Address"
                    value={org.address || ''}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                  />
                </Box>
              </SectionCard>
            </Grid>

            {/* Academic & Security Configuration */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <SectionCard title="Localization & Security Defaults">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      select
                      label="Base Accounting Currency"
                      value={org.currency || 'INR'}
                      onChange={(e) => setOrg({ ...org, currency: e.target.value })}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="INR">INR (₹) - Indian Rupee</MenuItem>
                      <MenuItem value="USD">USD ($) - US Dollar</MenuItem>
                      <MenuItem value="EUR">EUR (€) - Euro</MenuItem>
                      <MenuItem value="GBP">GBP (£) - British Pound</MenuItem>
                    </TextField>

                    <TextField
                      select
                      label="Standard Operational Timezone"
                      value={org.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</MenuItem>
                      <MenuItem value="UTC">UTC (Universal Coordinated Time)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                    </TextField>

                    <TextField
                      label="Current Academic Session"
                      value={org.academic_year || '2026-2027'}
                      onChange={(e) => setOrg({ ...org, academic_year: e.target.value })}
                      fullWidth
                      size="small"
                    />

                    <TextField
                      label="Default Geofence Radius (meters)"
                      type="number"
                      value={org.attendance_geofence_default || 150}
                      onChange={(e) => setOrg({ ...org, attendance_geofence_default: parseInt(e.target.value, 10) })}
                      helperText="Default threshold in meters around campus lat/lng"
                      fullWidth
                      size="small"
                    />

                    <TextField
                      select
                      label="IP Match Detection Scope"
                      value={org.ip_matching_scope || 'company'}
                      onChange={(e) => setOrg({ ...org, ip_matching_scope: e.target.value })}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="company">Company Level (Same Subsidiary)</MenuItem>
                      <MenuItem value="batch">Batch Level (Same Class)</MenuItem>
                      <MenuItem value="organization">Entire Organization Group</MenuItem>
                    </TextField>
                  </Box>
                </SectionCard>

                {/* Automated Business Rules */}
                <SectionCard title="Configurable Business & Fee Rules">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(org.rules?.block_materials_on_unpaid)}
                          onChange={(e) =>
                            setOrg({
                              ...org,
                              rules: { ...org.rules, block_materials_on_unpaid: e.target.checked },
                            })
                          }
                          color="primary"
                        />
                      }
                      label="Block course materials for learners with overdue balance"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(org.rules?.block_exams_on_unpaid)}
                          onChange={(e) =>
                            setOrg({
                              ...org,
                              rules: { ...org.rules, block_exams_on_unpaid: e.target.checked },
                            })
                          }
                          color="primary"
                        />
                      }
                      label="Block examination access for students with outstanding dues"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(org.rules?.block_certificate_on_unpaid)}
                          onChange={(e) =>
                            setOrg({
                              ...org,
                              rules: { ...org.rules, block_certificate_on_unpaid: e.target.checked },
                            })
                          }
                          color="primary"
                        />
                      }
                      label="Require 100% fee clearance prior to issuing digital certificates"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(org.rules?.allow_temporary_admin_override)}
                          onChange={(e) =>
                            setOrg({
                              ...org,
                              rules: { ...org.rules, allow_temporary_admin_override: e.target.checked },
                            })
                          }
                          color="primary"
                        />
                      }
                      label="Allow authorized administrative overrides with mandatory audit reason"
                    />
                  </Box>
                </SectionCard>
              </Box>
            </Grid>

            {/* Submit Action */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  {loading ? 'Saving Changes...' : 'Save Organization Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </PageContainer>
    </AdminLayout>
  );
}
