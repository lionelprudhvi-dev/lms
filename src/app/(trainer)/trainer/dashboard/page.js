'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TrainerLayout from '@/components/layout/TrainerLayout';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainerData();
  }, []);

  const loadTrainerData = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/api/batches').catch(() => ({ data: [] })),
        api.get('/api/students').catch(() => ({ data: [] })),
      ]);
      setBatches(bRes.data || []);
      setStudents(sRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TrainerLayout>
      <PageContainer>
        {/* Trainer Banner */}
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
              Welcome back, Professor {user?.first_name || 'Trainer'}! 👨‍🏫
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
              Oversee your active training cohorts, manage curriculum delivery, conduct student evaluations, and record batch attendance.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/trainer/attendance"
              variant="contained"
              startIcon={<AccessTimeIcon />}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#1D4ED8',
                fontWeight: 700,
                '&:hover': { bgcolor: '#EAF2FF' },
              }}
            >
              Batch Attendance
            </Button>
            <Button
              component={Link}
              href="/trainer/materials"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.6)',
                fontWeight: 600,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Upload Material
            </Button>
          </Box>
        </Box>

        {/* KPIs */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Assigned Batches"
              value={batches.length || 2}
              icon={GroupsIcon}
              color="primary"
              subtitle="Active training cohorts"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cohort Students"
              value={students.length || 45}
              icon={SchoolIcon}
              color="info"
              subtitle="Total enrolled trainees"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Attendance"
              value="91.8%"
              icon={AccessTimeIcon}
              color="success"
              subtitle="GPS check-in verified"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Assessments Due"
              value="4"
              icon={AssignmentIcon}
              color="warning"
              subtitle="Pending evaluations"
            />
          </Grid>
        </Grid>

        {/* Content: Batches & Daily Schedule */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <SectionCard
              title="My Training Batches"
              action={
                <Button component={Link} href="/trainer/batches" endIcon={<ArrowForwardIcon />} size="small" sx={{ color: '#1D4ED8', fontWeight: 600 }}>
                  View All
                </Button>
              }
            >
              {batches.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', color: '#5B6B88' }}>
                  <GroupsIcon sx={{ fontSize: 40, color: '#A0AEC0', mb: 1 }} />
                  <Typography variant="body1">No assigned batches.</Typography>
                </Box>
              ) : (
                batches.map((b) => (
                  <Box
                    key={b.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: '12px',
                      border: '1px solid #E3EAF5',
                      bgcolor: '#FFFFFF',
                      '&:hover': { borderColor: '#3B82F6', bgcolor: '#F8FAFF' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '16px', color: '#0B2A5B' }}>
                          {b.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5B6B88' }}>
                          Course: {b.course_name || 'Enterprise Full Stack'} • Timing: 09:30 AM - 12:30 PM
                        </Typography>
                      </Box>
                      <StatusChip status={b.status || 'ongoing'} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1.5, alignItems: 'center' }}>
                      <Chip label={`Enrolled: ${b.enrolled_count || 32} / ${b.capacity || 40}`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8' }} />
                      <Button
                        component={Link}
                        href="/trainer/attendance"
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: '8px', ml: 'auto' }}
                      >
                        Mark Attendance
                      </Button>
                    </Box>
                  </Box>
                ))
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <SectionCard title="Today's Session Schedule">
              <List disablePadding>
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    <EventAvailableIcon sx={{ color: '#1D4ED8' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>Batch Alpha - Module 4: PostgreSQL Optimization</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: '#5B6B88' }}>10:00 AM - 12:00 PM • Main Lab 102</Typography>}
                  />
                </ListItem>
                <Divider />
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    <EventAvailableIcon sx={{ color: '#16A34A' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>Batch Beta - Midterm Exam Review & Coding Lab</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: '#5B6B88' }}>02:00 PM - 04:30 PM • Virtual Classroom A</Typography>}
                  />
                </ListItem>
              </List>
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </TrainerLayout>
  );
}
