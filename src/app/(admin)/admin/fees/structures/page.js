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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function FeeStructuresPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [structures, setStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company_id: selectedCompanyId || '',
    course_id: '',
    academic_year: '2026-2027',
    total_fee: 45000,
    registration_fee: 5000,
    tuition_fee: 30000,
    exam_fee: 3000,
    material_fee: 4000,
    certification_fee: 3000,
  });

  useEffect(() => {
    loadStructures();
    loadCourses();
  }, [selectedCompanyId]);

  const loadStructures = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/fees/structures?companyId=${selectedCompanyId}` : '/api/fees/structures';
      const res = await api.get(url);
      if (res && res.data) setStructures(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get(selectedCompanyId ? `/api/courses?companyId=${selectedCompanyId}` : '/api/courses');
      if (res && res.data) setCourses(res.data);
    } catch (e) {
      // silent
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/fees/structures', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Fee structure established successfully!', 'success');
      setDialogOpen(false);
      loadStructures();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Structure Name',
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
            <AccountBalanceIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {row.course_name} &bull; {row.academic_year}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'company_name',
      headerName: 'Subsidiary',
      minWidth: 160,
      renderCell: ({ value }) => value,
    },
    {
      field: 'total_fee',
      headerName: 'Total Fee',
      minWidth: 130,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
          ₹{Number(value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'breakdown',
      headerName: 'Component Breakdown',
      minWidth: 260,
      renderCell: ({ row }) => (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Reg: ₹{Number(row.registration_fee || 0).toLocaleString()} &bull; Tuition: ₹{Number(row.tuition_fee || 0).toLocaleString()} &bull; Exam: ₹{Number(row.exam_fee || 0).toLocaleString()}
        </Typography>
      ),
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
          title="Fee Structures & Tuition Tariffs"
          subtitle="Configure baseline fee structures, component schedules (tuition, exam, registration, labs), and discount eligibility."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Structures' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Create Fee Structure
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={structures}
            loading={loading}
            searchPlaceholder="Search fee structures by title, course..."
          />
        </SectionCard>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreate}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>New Fee Structure</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Structure Title"
                placeholder="e.g. Standard Full Stack Engineering Package"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Course"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">-- Select Course --</MenuItem>
                    {courses.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                label="Total Fee (INR)"
                type="number"
                value={formData.total_fee}
                onChange={(e) => setFormData({ ...formData, total_fee: parseFloat(e.target.value) })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Registration Fee"
                    type="number"
                    value={formData.registration_fee}
                    onChange={(e) => setFormData({ ...formData, registration_fee: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Tuition Fee"
                    type="number"
                    value={formData.tuition_fee}
                    onChange={(e) => setFormData({ ...formData, tuition_fee: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Examination Fee"
                    type="number"
                    value={formData.exam_fee}
                    onChange={(e) => setFormData({ ...formData, exam_fee: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Materials & Lab Fee"
                    type="number"
                    value={formData.material_fee}
                    onChange={(e) => setFormData({ ...formData, material_fee: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Creating...' : 'Create Structure'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
