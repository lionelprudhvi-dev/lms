'use client';

import React, { useState, useEffect } from 'react';
import TrainerLayout from '@/components/layout/TrainerLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import DataTable from '@/components/tables/DataTable';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function TrainerAssignmentsPage() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [examId, setExamId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [startWindow, setStartWindow] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [endWindow, setEndWindow] = useState(dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm'));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, bRes, eRes] = await Promise.all([
        api.get('/api/assignments').catch(() => ({ data: [] })),
        api.get('/api/batches').catch(() => ({ data: [] })),
        api.get('/api/exams').catch(() => ({ data: [] })),
      ]);
      setAssignments(aRes.data || []);
      setBatches(bRes.data || []);
      setExams(eRes.data || []);
      if (bRes.data?.length > 0) setBatchId(bRes.data[0].id);
      if (eRes.data?.length > 0) setExamId(eRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/assignments', {
        exam_id: examId,
        batch_id: batchId,
        start_window: startWindow,
        end_window: endWindow,
      });
      showToast('Assignment scheduled successfully!', 'success');
      setOpenModal(false);
      loadData();
    } catch (err) {
      showToast('Failed to schedule assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      field: 'exam_title',
      headerName: 'Assignment / Assessment',
      flex: 1.3,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon sx={{ color: '#1D4ED8' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
              {params.row.exam_title || 'Midterm Assessment'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5B6B88' }}>
              Course: {params.row.course_name || 'Engineering'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'batch_name',
      headerName: 'Target Cohort',
      flex: 1,
      renderCell: (params) => (
        <Chip label={params.row.batch_name || 'Batch Alpha'} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8' }} />
      ),
    },
    {
      field: 'end_window',
      headerName: 'Submission Deadline',
      width: 170,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>
          {dayjs(params.row.end_window).format('DD MMM YYYY, hh:mm A')}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => <StatusChip status="active" label="Open for Trainees" />,
    },
  ];

  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Cohort Assignments"
          subtitle="Schedule graded assignments, set evaluation deadlines, and review student progress."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenModal(true)}
              sx={{ bgcolor: '#1D4ED8', fontWeight: 700 }}
            >
              Schedule Assignment
            </Button>
          }
        />

        <SectionCard>
          <DataTable
            rows={assignments}
            columns={columns}
            loading={loading}
            emptyMessage="No active assignments scheduled."
          />
        </SectionCard>

        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreate}>
            <DialogTitle sx={{ fontWeight: 700, color: '#0B2A5B' }}>Schedule Batch Assignment</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Select Assessment / Exam"
                    fullWidth
                    required
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                  >
                    {exams.map((ex) => (
                      <MenuItem key={ex.id} value={ex.id}>
                        {ex.title} ({ex.total_marks} Marks)
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Target Batch"
                    fullWidth
                    required
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    {batches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="datetime-local"
                    label="Start Window"
                    fullWidth
                    required
                    value={startWindow}
                    onChange={(e) => setStartWindow(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="datetime-local"
                    label="Deadline"
                    fullWidth
                    required
                    value={endWindow}
                    onChange={(e) => setEndWindow(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: '#1D4ED8' }}>
                {submitting ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </TrainerLayout>
  );
}
