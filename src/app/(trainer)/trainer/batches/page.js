'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/batches');
      setBatches(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Batch Name',
      flex: 1.2,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#5B6B88' }}>
            Company: {params.row.company_name || 'Apex Technologies'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'course_name',
      headerName: 'Course',
      flex: 1.2,
      renderCell: (params) => (
        <Typography variant="body2">{params.row.course_name || 'Full Stack Engineering'}</Typography>
      ),
    },
    {
      field: 'capacity',
      headerName: 'Trainees',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={`${params.row.enrolled_count || 28} / ${params.row.capacity || 40}`}
          size="small"
          sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      width: 130,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 500 }}>
          {params.row.start_date ? dayjs(params.row.start_date).format('DD MMM YYYY') : '01 Jan 2026'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.row.status || 'ongoing'} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            href={`/trainer/attendance?batch_id=${params.row.id}`}
            size="small"
            variant="outlined"
            startIcon={<AccessTimeIcon />}
            sx={{ borderRadius: '8px' }}
          >
            Attendance
          </Button>
          <Button
            component={Link}
            href={`/trainer/students?batch_id=${params.row.id}`}
            size="small"
            variant="contained"
            startIcon={<SchoolIcon />}
            sx={{ borderRadius: '8px', bgcolor: '#1D4ED8' }}
          >
            Roster
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Assigned Batches"
          subtitle="Manage active cohorts, review student enrollments, and coordinate session timings."
        />

        <SectionCard>
          <DataTable
            rows={batches}
            columns={columns}
            loading={loading}
            emptyMessage="No assigned batches found."
          />
        </SectionCard>
      </PageContainer>
    </TrainerLayout>
  );
}
