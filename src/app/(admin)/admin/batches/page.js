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
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function BatchesPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    company_id: selectedCompanyId || '',
    course_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    schedule_time: '09:30 AM - 01:30 PM',
    days_of_week: 'Mon,Tue,Wed,Thu,Fri',
    capacity: 35,
    trainer_ids: [],
  });

  useEffect(() => {
    loadBatches();
    loadCoursesAndTrainers();
  }, [selectedCompanyId]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/batches?companyId=${selectedCompanyId}` : '/api/batches';
      const res = await api.get(url);
      if (res && res.data) setBatches(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndTrainers = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get(selectedCompanyId ? `/api/courses?companyId=${selectedCompanyId}` : '/api/courses'),
        api.get(selectedCompanyId ? `/api/trainers?companyId=${selectedCompanyId}` : '/api/trainers'),
      ]);
      if (cRes && cRes.data) setCourses(cRes.data);
      if (tRes && tRes.data) setTrainers(tRes.data);
    } catch (e) {
      // silent
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/batches', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Batch created successfully!', 'success');
      setDialogOpen(false);
      setFormData({
        name: '',
        code: '',
        company_id: selectedCompanyId || '',
        course_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        schedule_time: '09:30 AM - 01:30 PM',
        days_of_week: 'Mon,Tue,Wed,Thu,Fri',
        capacity: 35,
        trainer_ids: [],
      });
      loadBatches();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Batch Name & Code',
      minWidth: 230,
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
            <GroupsIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.name}
            </Typography>
            <Chip
              label={row.code}
              size="small"
              sx={{ height: 18, fontSize: '10px', bgcolor: '#F1F5F9', fontWeight: 600 }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'course_name',
      headerName: 'Associated Course',
      minWidth: 200,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'schedule_time',
      headerName: 'Schedule & Timings',
      minWidth: 190,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '13px' }}>
            {row.schedule_time}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.days_of_week}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'enrolled_count',
      headerName: 'Seat Occupancy',
      minWidth: 160,
      renderCell: ({ row }) => {
        const enrolled = Number(row.enrolled_count || 0);
        const capacity = Number(row.capacity || 30);
        const percent = Math.min(100, Math.round((enrolled / capacity) * 100));
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {enrolled} / {capacity}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {percent}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#E2E8F0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: percent >= 90 ? '#DC2626' : '#1D4ED8',
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'trainers',
      headerName: 'Assigned Faculty',
      minWidth: 180,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value && value.length > 0
            ? value.map((t) => (
                <Chip
                  key={t.id}
                  label={t.name}
                  size="small"
                  sx={{
                    bgcolor: t.is_primary ? '#EAF2FF' : '#F1F5F9',
                    color: t.is_primary ? '#1D4ED8' : '#0F1B33',
                    fontSize: '11px',
                    height: 22,
                  }}
                />
              ))
            : 'Unassigned'}
        </Box>
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
          title="Batches & Class Cohorts"
          subtitle="Manage learning cohorts, seat capacities, weekly schedules, and instructor assignments."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Batches' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Create New Batch
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={batches}
            loading={loading}
            searchPlaceholder="Search batches by title, code, course..."
          />
        </SectionCard>

        {/* Create Batch Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateBatch}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Create New Cohort Batch</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Batch Name"
                placeholder="e.g. FS-2026-Batch-Beta"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Batch Code"
                    placeholder="e.g. BAT-AIT-02"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
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
              </Grid>

              <TextField
                select
                label="Course Program"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Select Course --</MenuItem>
                {courses.map((cr) => (
                  <MenuItem key={cr.id} value={cr.id}>
                    {cr.name} ({cr.code})
                  </MenuItem>
                ))}
              </TextField>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date (Optional)"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Daily Schedule Time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Classroom Capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                label="Days of Week"
                value={formData.days_of_week}
                onChange={(e) => setFormData({ ...formData, days_of_week: e.target.value })}
                fullWidth
                size="small"
              />

              <TextField
                select
                label="Assign Primary Trainer"
                value={formData.trainer_ids[0] || ''}
                onChange={(e) => setFormData({ ...formData, trainer_ids: [e.target.value] })}
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Unassigned --</MenuItem>
                {trainers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.full_name} ({t.trainer_id_code})
                  </MenuItem>
                ))}
              </TextField>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Creating...' : 'Create Batch'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
