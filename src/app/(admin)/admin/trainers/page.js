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
  MenuItem,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function TrainersPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_id: selectedCompanyId || '',
    qualification: 'M.Tech / Master Degree',
    skills: 'Cloud Architecture, JavaScript, DevOps, Python',
    experience_years: 5,
  });

  useEffect(() => {
    loadTrainers();
  }, [selectedCompanyId]);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/trainers?companyId=${selectedCompanyId}` : '/api/trainers';
      const res = await api.get(url);
      if (res && res.data) setTrainers(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/trainers', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Faculty trainer created successfully!', 'success');
      setDialogOpen(false);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company_id: selectedCompanyId || '',
        qualification: 'M.Tech / Master Degree',
        skills: 'Cloud Architecture, JavaScript, DevOps, Python',
        experience_years: 5,
      });
      loadTrainers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'full_name',
      headerName: 'Trainer Name & ID',
      minWidth: 230,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#0B2A5B', fontSize: '13px', fontWeight: 700 }}>
            {row.full_name ? row.full_name[0] : 'T'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.full_name}
            </Typography>
            <Chip
              label={row.trainer_id_code}
              size="small"
              sx={{ height: 18, fontSize: '10px', bgcolor: '#F1F5F9', fontWeight: 600 }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'company_name',
      headerName: 'Subsidiary',
      minWidth: 160,
      renderCell: ({ value, row }) => value || row.company_code,
    },
    {
      field: 'skills',
      headerName: 'Core Competencies & Skills',
      minWidth: 240,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontSize: '13px', color: '#5B6B88' }}>
          {value || '—'}
        </Typography>
      ),
    },
    {
      field: 'batch_count',
      headerName: 'Assigned Batches',
      minWidth: 140,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip label={`${value || 0} Batches`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }} />
      ),
    },
    {
      field: 'experience_years',
      headerName: 'Experience',
      minWidth: 120,
      align: 'center',
      renderCell: ({ value }) => `${value || 0} yrs`,
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Faculty & Trainers Directory"
          subtitle="Manage academic instructors, subject matter experts, batch faculty allocations, and instructional performance."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Trainers' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Faculty Trainer
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={trainers}
            loading={loading}
            searchPlaceholder="Search trainer by name, ID, skills..."
          />
        </SectionCard>

        {/* Add Trainer Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateTrainer}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Add Faculty Trainer</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                select
                label="Company Subsidiary"
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

              <TextField
                label="Qualification & Degree"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                fullWidth
                size="small"
              />

              <TextField
                label="Key Skills & Domain Expertise"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                multiline
                rows={2}
                fullWidth
                size="small"
              />

              <TextField
                label="Years of Experience"
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseFloat(e.target.value) })}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Add Trainer'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
