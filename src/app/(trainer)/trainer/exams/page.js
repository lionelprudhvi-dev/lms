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
  Button,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/services/api';

export default function TrainerExamsPage() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamsAndResults();
  }, []);

  const loadExamsAndResults = async () => {
    setLoading(true);
    try {
      const [eRes, rRes] = await Promise.all([
        api.get('/api/exams').catch(() => ({ data: [] })),
        api.get('/api/exams/results').catch(() => ({ data: [] })),
      ]);
      setExams(eRes.data || []);
      setResults(rRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Exam Title',
      flex: 1.3,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <QuizIcon sx={{ color: '#1D4ED8' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
              {params.row.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5B6B88' }}>
              Code: {params.row.code || 'EX-101'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'duration_minutes',
      headerName: 'Duration',
      width: 120,
      renderCell: (params) => (
        <Chip label={`${params.row.duration_minutes || 60} mins`} size="small" />
      ),
    },
    {
      field: 'total_marks',
      headerName: 'Total / Passing',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.row.total_marks || 100} / {params.row.pass_marks || 40} M
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.row.status || 'published'} />,
    },
    {
      field: 'actions',
      headerName: 'Evaluation',
      width: 140,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          sx={{ borderRadius: '8px' }}
        >
          Submissions
        </Button>
      ),
    },
  ];

  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Exam Administration"
          subtitle="Oversee question banks, timed test attempts, automated grading, and cohort evaluations."
        />

        <SectionCard>
          <DataTable
            rows={exams}
            columns={columns}
            loading={loading}
            emptyMessage="No exams found."
          />
        </SectionCard>
      </PageContainer>
    </TrainerLayout>
  );
}
