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
  Chip,
  Avatar,
} from '@mui/material';
import api from '@/services/api';

export default function TrainerStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/students');
      setStudents(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'student_id',
      headerName: 'Student ID',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D4ED8' }}>
          {params.row.student_id || 'STU-1001'}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Student Name',
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1D4ED8', fontSize: '13px', fontWeight: 600 }}>
            {params.row.first_name?.[0] || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
              {params.row.first_name} {params.row.last_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5B6B88' }}>
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'batch_name',
      headerName: 'Batch',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2">{params.row.batch_name || 'Batch Alpha'}</Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Contact',
      width: 140,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 500 }}>
          {params.row.phone || '+91 98765 43210'}
        </Typography>
      ),
    },
    {
      field: 'attendance_rate',
      headerName: 'Attendance',
      width: 130,
      renderCell: (params) => (
        <Chip
          label="94.5%"
          size="small"
          sx={{ bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 700 }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.row.status || 'active'} />,
    },
  ];

  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Student Roster"
          subtitle="Directory of trainees currently enrolled across your assigned training cohorts."
        />

        <SectionCard>
          <DataTable
            rows={students}
            columns={columns}
            loading={loading}
            emptyMessage="No trainees enrolled under your batches."
          />
        </SectionCard>
      </PageContainer>
    </TrainerLayout>
  );
}
