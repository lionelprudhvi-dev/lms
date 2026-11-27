'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Card,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CampaignIcon from '@mui/icons-material/Campaign';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feeAccount, setFeeAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [coursesRes, examsRes, feeRes, annRes] = await Promise.all([
        api.get('/api/courses').catch(() => ({ data: [] })),
        api.get('/api/exams').catch(() => ({ data: [] })),
        api.get('/api/fees/accounts').catch(() => ({ data: [] })),
        api.get('/api/announcements').catch(() => ({ data: [] })),
      ]);

      setCourses(coursesRes.data || []);
      setExams(examsRes.data || []);
      if (feeRes.data && feeRes.data.length > 0) {
        setFeeAccount(feeRes.data[0]);
      }
      setAnnouncements(annRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const outstanding = feeAccount ? Number(feeAccount.outstanding_balance) : 0;

  return (
    <StudentLayout>
      <PageContainer>
        {/* Welcome Banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0B2A5B 0%, #1D4ED8 100%)',
            borderRadius: '16px',
            p: { xs: 3, md: 4 },
            color: '#FFFFFF',
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            boxShadow: '0 8px 32px rgba(11,42,91,0.15)',
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: '22px', md: '28px' }, mb: 1 }}>
              Welcome back, {user?.first_name || 'Student'}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
              Track your course progression, mark daily GPS geofenced attendance, check exam schedules, and manage your tuition fee installments.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/student/attendance"
              variant="contained"
              startIcon={<AccessTimeIcon />}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#1D4ED8',
                fontWeight: 700,
                '&:hover': { bgcolor: '#EAF2FF' },
              }}
            >
              Mark Attendance
            </Button>
            <Button
              component={Link}
              href="/student/exams"
              variant="outlined"
              startIcon={<QuizIcon />}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.6)',
                fontWeight: 600,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              View Exams
            </Button>
          </Box>
        </Box>

        {/* Stat Cards Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Enrolled Courses"
              value={courses.length || 1}
              icon={AutoStoriesIcon}
              color="primary"
              subtitle="Active curriculum"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Attendance Rate"
              value="94.2%"
              icon={AccessTimeIcon}
              color="success"
              subtitle="Geofence compliant"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Upcoming Exams"
              value={exams.length}
              icon={QuizIcon}
              color="info"
              subtitle="Assessments scheduled"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Fee Balance"
              value={`₹${outstanding.toLocaleString()}`}
              icon={AccountBalanceWalletIcon}
              color={outstanding > 0 ? 'warning' : 'success'}
              subtitle={outstanding > 0 ? 'Pending payment' : 'Fully cleared'}
            />
          </Grid>
        </Grid>

        {/* Content Section: Enrolled Courses & Announcements */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <SectionCard
              title="My Courses & Progress"
              action={
                <Button
                  component={Link}
                  href="/student/courses"
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  sx={{ color: '#1D4ED8', fontWeight: 600 }}
                >
                  View All
                </Button>
              }
            >
              {courses.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', color: '#5B6B88' }}>
                  <AutoStoriesIcon sx={{ fontSize: 40, color: '#A0AEC0', mb: 1 }} />
                  <Typography variant="body1">No course enrollments found yet.</Typography>
                </Box>
              ) : (
                courses.slice(0, 3).map((c, i) => (
                  <Box
                    key={c.id || i}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: '12px',
                      border: '1px solid #E3EAF5',
                      bgcolor: '#FFFFFF',
                      '&:hover': { borderColor: '#3B82F6', bgcolor: '#F8FAFF' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '16px', color: '#0B2A5B' }}>
                          {c.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5B6B88' }}>
                          Code: {c.code || 'CRS-01'} • Category: {c.category || 'Engineering'}
                        </Typography>
                      </Box>
                      <StatusChip status={c.status || 'active'} label="In Progress" />
                    </Box>
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 500 }}>
                          Syllabus Completion
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 700 }}>
                          {70 + (i * 10)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={70 + (i * 10)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#EAF2FF',
                          '& .MuiLinearProgress-bar': { bgcolor: '#1D4ED8', borderRadius: 4 },
                        }}
                      />
                    </Box>
                  </Box>
                ))
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <SectionCard
              title="Recent Announcements"
              action={
                <Button
                  component={Link}
                  href="/student/announcements"
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  sx={{ color: '#1D4ED8', fontWeight: 600 }}
                >
                  All
                </Button>
              }
            >
              {announcements.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', color: '#5B6B88' }}>
                  <CampaignIcon sx={{ fontSize: 40, color: '#A0AEC0', mb: 1 }} />
                  <Typography variant="body2">No recent announcements.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {announcements.slice(0, 4).map((a, i) => (
                    <React.Fragment key={a.id || i}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                          <CampaignIcon sx={{ color: a.priority === 'urgent' ? '#DC2626' : '#1D4ED8', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                                {a.title}
                              </Typography>
                              {a.priority === 'urgent' && (
                                <Chip label="Urgent" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#FEE2E2', color: '#DC2626' }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mt: 0.5 }}>
                              {a.content?.length > 70 ? a.content.substring(0, 70) + '...' : a.content} • {dayjs(a.published_at).format('DD MMM')}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {i < announcements.slice(0, 4).length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
