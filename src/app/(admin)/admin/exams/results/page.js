'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import { Box, Typography, Chip, Grid } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function ExamResultsPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [selectedCompanyId]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/exams/results?companyId=${selectedCompanyId}` : '/api/exams/results';
      const res = await api.get(url);
      if (res && res.data) setResults(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const total = results.length;
  const passed = results.filter((r) => r.status === 'passed').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgPct = total > 0 ? Math.round(results.reduce((acc, r) => acc + Number(r.percentage || 0), 0) / total) : 0;

  const columns = [
    {
      field: 'student_name',
      headerName: 'Candidate Name & ID',
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.student_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.student_id_code}</Typography>
        </Box>
      ),
    },
    {
      field: 'exam_name',
      headerName: 'Examination Title',
      minWidth: 240,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>{row.exam_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.course_name} ({row.batch_name || 'Cohort'})</Typography>
        </Box>
      ),
    },
    {
      field: 'marks_obtained',
      headerName: 'Score Obtained',
      minWidth: 140,
      align: 'center',
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {row.marks_obtained} / {row.total_marks}
        </Typography>
      ),
    },
    {
      field: 'percentage',
      headerName: 'Percentage',
      minWidth: 120,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip
          label={`${value}%`}
          size="small"
          sx={{
            bgcolor: Number(value) >= 60 ? '#DCFCE7' : '#FEE2E2',
            color: Number(value) >= 60 ? '#15803D' : '#B91C1C',
            fontWeight: 700,
          }}
        />
      ),
    },
    {
      field: 'grade',
      headerName: 'Grade',
      minWidth: 100,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip label={value || 'P'} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 700 }} />
      ),
    },
    {
      field: 'status',
      headerName: 'Outcome',
      minWidth: 110,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Examination Results & Academic Performance"
          subtitle="Automated evaluation scorecards, grades, passing percentages, and candidate performance analytics."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Examinations' }, { label: 'Results' }]}
        />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Pass Rate"
              value={`${passRate}%`}
              subtitle={`${passed} of ${total} students passed`}
              icon={CheckCircleOutlineIcon}
              color="#16A34A"
              bgColor="#DCFCE7"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Average Score"
              value={`${avgPct}%`}
              subtitle="Mean percentage score"
              icon={AssessmentIcon}
              color="#1D4ED8"
              bgColor="#EAF2FF"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Distinctions (A+)"
              value={results.filter((r) => r.grade === 'A+' || r.grade === 'A').length}
              subtitle="Score >= 80%"
              icon={EmojiEventsIcon}
              color="#D97706"
              bgColor="#FEF3C7"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Total Evaluations"
              value={total}
              subtitle="Published results"
              icon={AssessmentIcon}
              color="#0B2A5B"
              bgColor="#F1F5F9"
            />
          </Grid>
        </Grid>

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={results}
            loading={loading}
            searchPlaceholder="Search result by student, exam title..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
