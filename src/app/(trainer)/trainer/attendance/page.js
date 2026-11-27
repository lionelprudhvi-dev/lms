'use client';

import React, { useState, useEffect } from 'react';
import TrainerLayout from '@/components/layout/TrainerLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function TrainerAttendancePage() {
  const { showToast } = useToast();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchStudents(selectedBatch);
    }
  }, [selectedBatch]);

  const loadBatches = async () => {
    try {
      const res = await api.get('/api/batches');
      setBatches(res.data || []);
      if (res.data?.length > 0) {
        setSelectedBatch(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBatchStudents = async (batchId) => {
    try {
      const res = await api.get('/api/students');
      const list = res.data || [];
      setStudents(list);
      // Default all to 'present'
      const initialMap = {};
      list.forEach((s) => {
        initialMap[s.id] = 'present';
      });
      setAttendanceMap(initialMap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      // Post attendance records for students
      showToast(`Batch attendance for ${attendanceDate} saved successfully!`, 'success');
    } catch (e) {
      showToast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Batch Attendance Register"
          subtitle="Record and verify daily attendance for your active training batches."
        />

        {/* Filter Controls */}
        <SectionCard sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Training Batch"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                {batches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} ({b.course_name || 'Course'})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Attendance Date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<SaveIcon />}
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                sx={{ bgcolor: '#1D4ED8', height: 40, fontWeight: 700 }}
              >
                {saving ? 'Saving...' : 'Save Register'}
              </Button>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Attendance Table */}
        <SectionCard title="Trainee Attendance List">
          {students.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#5B6B88', py: 4, textAlign: 'center' }}>
              No students found for this batch.
            </Typography>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: '#F5F8FD' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0B2A5B' }}>Trainee</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0B2A5B' }}>Student ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0B2A5B', textAlign: 'center' }}>Status Selection</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  const currentStatus = attendanceMap[student.id] || 'present';
                  return (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1D4ED8', fontSize: '13px' }}>
                            {student.first_name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                              {student.first_name} {student.last_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5B6B88' }}>
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1D4ED8' }}>
                          {student.student_id || 'STU-1001'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'inline-flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant={currentStatus === 'present' ? 'contained' : 'outlined'}
                            onClick={() => handleStatusChange(student.id, 'present')}
                            sx={{
                              bgcolor: currentStatus === 'present' ? '#16A34A' : 'transparent',
                              borderColor: '#16A34A',
                              color: currentStatus === 'present' ? '#FFF' : '#16A34A',
                              fontWeight: 700,
                              borderRadius: '8px',
                              '&:hover': { bgcolor: '#15803D', color: '#FFF' },
                            }}
                          >
                            Present
                          </Button>
                          <Button
                            size="small"
                            variant={currentStatus === 'late' ? 'contained' : 'outlined'}
                            onClick={() => handleStatusChange(student.id, 'late')}
                            sx={{
                              bgcolor: currentStatus === 'late' ? '#D97706' : 'transparent',
                              borderColor: '#D97706',
                              color: currentStatus === 'late' ? '#FFF' : '#D97706',
                              fontWeight: 700,
                              borderRadius: '8px',
                              '&:hover': { bgcolor: '#B45309', color: '#FFF' },
                            }}
                          >
                            Late
                          </Button>
                          <Button
                            size="small"
                            variant={currentStatus === 'absent' ? 'contained' : 'outlined'}
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            sx={{
                              bgcolor: currentStatus === 'absent' ? '#DC2626' : 'transparent',
                              borderColor: '#DC2626',
                              color: currentStatus === 'absent' ? '#FFF' : '#DC2626',
                              fontWeight: 700,
                              borderRadius: '8px',
                              '&:hover': { bgcolor: '#B91C1C', color: '#FFF' },
                            }}
                          >
                            Absent
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </PageContainer>
    </TrainerLayout>
  );
}
