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
  Grid,
  Card,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DownloadIcon from '@mui/icons-material/Download';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function StudentCoursesPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoursesAndMaterials();
  }, []);

  const loadCoursesAndMaterials = async () => {
    setLoading(true);
    try {
      const [cRes, mRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/materials').catch(() => ({ data: [] })),
      ]);
      setCourses(cRes.data || []);
      setMaterials(mRes.data || []);
    } catch (err) {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <PageContainer>
        <PageHeader
          title="My Enrolled Courses"
          subtitle="Access your academic curriculum, syllabus modules, video lectures, and learning notes."
        />

        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} key={course.id}>
              <SectionCard
                title={course.name}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={`Code: ${course.code}`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }} />
                    <Chip label={`${course.duration_weeks || 12} Weeks`} size="small" />
                    <StatusChip status={course.status || 'active'} />
                  </Box>
                }
              >
                <Typography variant="body1" sx={{ color: '#5B6B88', mb: 3 }}>
                  {course.description || 'Comprehensive industry curriculum covering core architectures, hands-on implementations, and evaluations.'}
                </Typography>

                {/* Modules & Chapters */}
                <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, color: '#0B2A5B', mb: 2 }}>
                  Course Syllabus & Modules
                </Typography>

                <Accordion defaultExpanded sx={{ border: '1px solid #E3EAF5', borderRadius: '12px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AutoStoriesIcon sx={{ color: '#1D4ED8' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                        Module 1: Foundations & Core Principles
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List disablePadding>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <PlayCircleOutlineIcon sx={{ color: '#1D4ED8' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Lesson 1.1: Architecture Overview & Tooling</Typography>}
                          secondary="Video Lecture • 45 mins"
                        />
                        <Button size="small" variant="outlined" sx={{ borderRadius: '8px' }}>
                          Watch
                        </Button>
                      </ListItem>
                      <Divider />
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <PictureAsPdfIcon sx={{ color: '#DC2626' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Lesson 1.2: System Specification Guide</Typography>}
                          secondary="PDF Document • 14 Pages"
                        />
                        <Button size="small" variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: '8px' }}>
                          Download
                        </Button>
                      </ListItem>
                      <Divider />
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon sx={{ color: '#D97706' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Assignment 1: Hands-on Implementation Exercise</Typography>}
                          secondary="Graded Assessment • Due End of Week"
                        />
                        <Button size="small" variant="contained" sx={{ bgcolor: '#1D4ED8', borderRadius: '8px' }}>
                          Submit
                        </Button>
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={{ border: '1px solid #E3EAF5', borderRadius: '12px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AutoStoriesIcon sx={{ color: '#1D4ED8' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                        Module 2: Advanced System Modules & Scalability
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#5B6B88' }}>
                      Detailed lessons, video recordings, and lab exercises for advanced deployment topics.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </SectionCard>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
