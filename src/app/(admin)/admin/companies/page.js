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
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function CompaniesPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_email: '',
    contact_phone: '',
    gstin: '',
    address: '',
    status: 'active',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/companies');
      if (res && res.data) {
        setCompanies(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/companies', formData);
      showToast('Company created successfully', 'success');
      setDialogOpen(false);
      setFormData({
        name: '',
        code: '',
        contact_email: '',
        contact_phone: '',
        gstin: '',
        address: '',
        status: 'active',
      });
      fetchCompanies();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Company / Subsidiary',
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
              fontWeight: 700,
            }}
          >
            <BusinessIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {row.contact_email || 'No email provided'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'code',
      headerName: 'Company Code',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 600, fontSize: '11px' }} />
      ),
    },
    {
      field: 'student_count',
      headerName: 'Students',
      minWidth: 100,
      align: 'center',
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
          {value || 0}
        </Typography>
      ),
    },
    {
      field: 'course_count',
      headerName: 'Courses',
      minWidth: 100,
      align: 'center',
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
          {value || 0}
        </Typography>
      ),
    },
    {
      field: 'batch_count',
      headerName: 'Batches',
      minWidth: 100,
      align: 'center',
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
          {value || 0}
        </Typography>
      ),
    },
    {
      field: 'gstin',
      headerName: 'GSTIN / Reg No.',
      minWidth: 160,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Multi-Company Subsidiaries"
          subtitle="Manage independent academic subsidiaries, training institutes, branch campuses, and business entities under the organization."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Companies' }]}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add New Company
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={companies}
            loading={loading}
            searchPlaceholder="Search company by name, code, GSTIN..."
          />
        </SectionCard>

        {/* Add Company Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateCompany}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700, fontSize: '18px' }}>
              Create New Company Subsidiary
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Company Name"
                placeholder="e.g. Apex Institute of Design"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <TextField
                label="Company Code (Short unique key)"
                placeholder="e.g. AID-DES"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Official Email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                label="GSTIN / Company Registration"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                fullWidth
                size="small"
              />

              <TextField
                label="Campus Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)} sx={{ color: '#5B6B88' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Creating...' : 'Create Company'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
