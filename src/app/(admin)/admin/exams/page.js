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
import QuizIcon from '@mui/icons-material/Quiz';
import Link from 'next/link';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function ExamManagementPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    company_id: selectedCompanyId || '',
    course_id: '',
    batch_id: '',
    exam_date: dayjs().format('YYYY-MM-DD'),
    start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    end_time: dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
    duration_minutes: 60,
    total_marks: 50,
    passing_marks: 20,
    negative_marking_per_question: 0,
    instructions: 'All questions are mandatory. Auto-submission will trigger when time expires.',
  });

  useEffect(() => {
    loadExams();
    loadCoursesAndBatches();
  }, [selectedCompanyId]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/exams?companyId=${selectedCompanyId}` : '/api/exams';
      const res = await api.get(url);
      if (res && res.data) setExams(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndBatches = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        api.get(selectedCompanyId ? `/api/courses?companyId=${selectedCompanyId}` : '/api/courses'),
        api.get(selectedCompanyId ? `/api/batches?companyId=${selectedCompanyId}` : '/api/batches'),
      ]);
      if (cRes && cRes.data) setCourses(cRes.data);
      if (bRes && bRes.data) setBatches(bRes.data);
    } catch (e) {
      // silent
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/exams', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Examination scheduled and students assigned successfully!', 'success');
      setDialogOpen(false);
      loadExams();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Exam Name & Code',
      minWidth: 260,
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
            <QuizIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.name}
            </Typography>
            <Chip label={row.code} size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#F1F5F9', fontWeight: 600 }} />
          </Box>
        </Box>
      ),
    },
    {
      field: 'course_name',
      headerName: 'Course / Cohort',
      minWidth: 190,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '13px' }}>{row.course_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.batch_name || 'All cohorts'}</Typography>
        </Box>
      ),
    },
    {
      field: 'duration_minutes',
      headerName: 'Duration & Marks',
      minWidth: 160,
      renderCell: ({ row }) => `${row.duration_minutes}m (Pass: ${row.passing_marks}/${row.total_marks})`,
    },
    {
      field: 'question_count',
      headerName: 'Questions',
      minWidth: 110,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip label={`${value || 0} Questions`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }} />
      ),
    },
    {
      field: 'submitted_attempts_count',
      headerName: 'Submissions',
      minWidth: 120,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip label={`${value || 0} Submissions`} size="small" sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 600 }} />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 110,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Online Examination Management"
          subtitle="Design scheduled evaluations with randomized question delivery, automated objective grading, and timed attempt windows."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Examinations' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Schedule New Exam
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={exams}
            loading={loading}
            searchPlaceholder="Search exams by name, code, course..."
          />
        </SectionCard>

        {/* Schedule Exam Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleCreateExam}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Schedule New Examination</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Examination Title"
                placeholder="e.g. End-Term Practical Architecture Assessment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Exam Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
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
                <Grid item xs={12} sm={4}>
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
                    {courses.map((cr) => (
                      <MenuItem key={cr.id} value={cr.id}>
                        {cr.name} ({cr.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Exam Date"
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    required
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Duration (Minutes)"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Passing Marks"
                    type="number"
                    value={formData.passing_marks}
                    onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value, 10) })}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Candidate Instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Scheduling...' : 'Schedule Exam'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
