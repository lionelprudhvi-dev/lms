'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import { Box, Typography, Grid, Card, Chip, Button } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Link from 'next/link';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function StudentResultsPage() {
  const { showToast } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyResults();
  }, []);

  const loadMyResults = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/exams/results');
      if (res && res.data) setResults(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <PageContainer>
        <PageHeader
          title="My Examination Results & Scorecards"
          subtitle="Review official academic evaluation results, earned percentage scores, and accreditation passing statuses."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'My Results' }]}
        />

        <Grid container spacing={3}>
          {results && results.length > 0 ? (
            results.map((r) => (
              <Grid item xs={12} md={6} key={r.id}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E3EAF5',
                    boxShadow: '0 4px 24px rgba(11, 42, 91, 0.06)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '18px', fontWeight: 700 }}>
                        {r.exam_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Evaluated on {dayjs(r.created_at).format('DD MMMM YYYY')}
                      </Typography>
                    </Box>
                    <StatusChip status={r.status} />
                  </Box>

                  <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', mb: 2.5, display: 'flex', justifyContent: 'space-around' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Score</Typography>
                      <Typography variant="h4" sx={{ color: '#0B2A5B', fontWeight: 700 }}>
                        {r.marks_obtained} / {r.total_marks}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Percentage</Typography>
                      <Typography variant="h4" sx={{ color: '#1D4ED8', fontWeight: 700 }}>
                        {r.percentage}%
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Grade</Typography>
                      <Typography variant="h4" sx={{ color: '#16A34A', fontWeight: 700 }}>
                        {r.grade}
                      </Typography>
                    </Box>
                  </Box>

                  {r.status === 'passed' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        component={Link}
                        href="/student/certificates"
                        variant="outlined"
                        size="small"
                        startIcon={<WorkspacePremiumIcon />}
                      >
                        View Certificate
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <SectionCard>
                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                  No published exam results found yet.
                </Typography>
              </SectionCard>
            </Grid>
          )}
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
