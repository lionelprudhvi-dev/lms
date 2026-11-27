'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Chip,
  MenuItem,
  Grid,
} from '@mui/material';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import PlaceIcon from '@mui/icons-material/Place';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function LocationManagementPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    company_id: selectedCompanyId || '',
    name: '',
    latitude: '12.9715987',
    longitude: '77.5945627',
    radius_meters: 150,
    is_active: true,
  });

  useEffect(() => {
    loadLocations();
  }, [selectedCompanyId]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/attendance/locations?companyId=${selectedCompanyId}` : '/api/attendance/locations';
      const res = await api.get(url);
      if (res && res.data) setLocations(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/attendance/locations', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Geofenced approved campus location added successfully!', 'success');
      setDialogOpen(false);
      setFormData({
        company_id: selectedCompanyId || '',
        name: '',
        latitude: '12.9715987',
        longitude: '77.5945627',
        radius_meters: 150,
        is_active: true,
      });
      loadLocations();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Location / Campus Name',
      minWidth: 240,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: '#EAF2FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlaceIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {row.company_name} ({row.company_code})
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      minWidth: 140,
      renderCell: ({ value }) => Number(value).toFixed(6),
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      minWidth: 140,
      renderCell: ({ value }) => Number(value).toFixed(6),
    },
    {
      field: 'radius_meters',
      headerName: 'Geofence Radius',
      minWidth: 150,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip label={`${value} meters`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }} />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      minWidth: 120,
      renderCell: ({ value }) => <StatusChip status={value ? 'active' : 'inactive'} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Campus Geofence Locations"
          subtitle="Define official campus boundaries with GPS coordinates and radius thresholds for student mobile attendance."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Attendance' }, { label: 'Locations' }]}
          action={
            <Button variant="contained" startIcon={<AddLocationAltIcon />} onClick={() => setDialogOpen(true)}>
              Add Approved Location
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={locations}
            loading={loading}
            searchPlaceholder="Search locations by campus name..."
          />
        </SectionCard>

        {/* Add Location Modal */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleAddLocation}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>
              Add Approved Geofenced Campus Location
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Location / Campus Name"
                placeholder="e.g. Whitefield Innovation Center"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <TextField
                select
                label="Assign to Company Subsidiary"
                value={formData.company_id || (companies[0] && companies[0].id) || ''}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </MenuItem>
                ))}
              </TextField>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Latitude (Decimals)"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Longitude (Decimals)"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                label="Approved Radius (Meters)"
                type="number"
                value={formData.radius_meters}
                onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value, 10) })}
                helperText="Students checking in beyond this radius will be flagged"
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Adding...' : 'Save Approved Location'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
