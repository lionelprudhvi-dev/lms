'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Alert,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Link from 'next/link';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function StudentExamsPage() {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/exams');
      if (res && res.data) setExams(res.data);
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
          title="Scheduled Online Examinations"
          subtitle="View upcoming and active tests, review assessment rules, and initiate your timed exam attempts."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'My Exams' }]}
        />

        <Grid container spacing={3}>
          {exams && exams.length > 0 ? (
            exams.map((exam) => (
              <Grid item xs={12} md={6} key={exam.id}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E3EAF5',
                    boxShadow: '0 4px 24px rgba(11, 42, 91, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip
                        label={exam.code}
                        size="small"
                        sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 700 }}
                      />
                      <StatusChip status={exam.status} />
                    </Box>

                    <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '18px', fontWeight: 700, mb: 0.5 }}>
                      {exam.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      {exam.course_name}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: '#5B6B88' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {exam.duration_minutes} Minutes
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <QuizIcon sx={{ fontSize: 16, color: '#5B6B88' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {exam.question_count || 3} Questions ({exam.total_marks} Marks)
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#16A34A' }}>
                        Passing: {exam.passing_marks} pts
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Exam Date: {dayjs(exam.exam_date).format('DD MMM YYYY')}
                    </Typography>

                    <Button
                      component={Link}
                      href={`/student/exams/${exam.id}/take`}
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      sx={{ bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#0B2A5B' } }}
                    >
                      Start Assessment
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <SectionCard>
                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                  No scheduled examinations available at this moment.
                </Typography>
              </SectionCard>
            </Grid>
          )}
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
