'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Chip,
  Grid,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function CoursesPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewCurriculumDialog, setViewCurriculumDialog] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    company_id: selectedCompanyId || '',
    category: 'Cloud & Software Engineering',
    duration_weeks: 12,
    total_hours: 140,
    base_fee: 45000,
    mode: 'classroom',
    description: '',
  });

  useEffect(() => {
    loadCourses();
  }, [selectedCompanyId]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/courses?companyId=${selectedCompanyId}` : '/api/courses';
      const res = await api.get(url);
      if (res && res.data) setCourses(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/courses', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Course created successfully!', 'success');
      setDialogOpen(false);
      setFormData({
        name: '',
        code: '',
        company_id: selectedCompanyId || '',
        category: 'Cloud & Software Engineering',
        duration_weeks: 12,
        total_hours: 140,
        base_fee: 45000,
        mode: 'classroom',
        description: '',
      });
      loadCourses();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewCurriculum = async (courseId) => {
    try {
      const res = await api.get(`/api/courses/${courseId}`);
      if (res && res.data) {
        setSelectedCourseDetail(res.data);
        setViewCurriculumDialog(true);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Course Title & Code',
      minWidth: 260,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: '#EAF2FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoStoriesIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.name}
            </Typography>
            <Chip
              label={row.code}
              size="small"
              sx={{ height: 18, fontSize: '10px', bgcolor: '#F1F5F9', fontWeight: 600 }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Discipline',
      minWidth: 160,
      renderCell: ({ value }) => value || 'Technology',
    },
    {
      field: 'duration_weeks',
      headerName: 'Duration',
      minWidth: 120,
      renderCell: ({ row }) => `${row.duration_weeks} wks (${row.total_hours}h)`,
    },
    {
      field: 'base_fee',
      headerName: 'Standard Fee',
      minWidth: 130,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
          ₹{Number(value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'mode',
      headerName: 'Delivery Mode',
      minWidth: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value?.toUpperCase()}
          size="small"
          sx={{ height: 22, fontSize: '11px', bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'enrolled_student_count',
      headerName: 'Enrolled Learners',
      minWidth: 140,
      align: 'center',
      renderCell: ({ value }) => (
        <Chip label={`${value || 0} Enrolled`} size="small" sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 600 }} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Curriculum',
      minWidth: 130,
      renderCell: ({ row }) => (
        <Button size="small" variant="outlined" onClick={() => handleViewCurriculum(row.id)}>
          View Syllabus
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Courses & Academic Curriculum"
          subtitle="Define courses, syllabus modules, chapters, lessons, instructional duration, and standard baseline tuition fees."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Courses' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Create New Course
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={courses}
            loading={loading}
            searchPlaceholder="Search courses by title, code, category..."
          />
        </SectionCard>

        {/* Create Course Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateCourse}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Create New Course</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Course Title"
                placeholder="e.g. Master in Artificial Intelligence & Robotics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Course Code"
                    placeholder="e.g. AI-ROB-401"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Company Subsidiary"
                    value={formData.company_id || (companies[0] && companies[0].id) || ''}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  >
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Duration (Weeks)"
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value, 10) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Total Hours"
                    type="number"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseInt(e.target.value, 10) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Base Tuition (₹)"
                    type="number"
                    value={formData.base_fee}
                    onChange={(e) => setFormData({ ...formData, base_fee: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                select
                label="Delivery Mode"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="classroom">Classroom (On-Campus)</MenuItem>
                <MenuItem value="online">Online Virtual Live</MenuItem>
                <MenuItem value="hybrid">Hybrid (Blended Learning)</MenuItem>
              </TextField>

              <TextField
                label="Course Synopsis / Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Creating...' : 'Create Course'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Syllabus / Curriculum Modal */}
        <Dialog open={viewCurriculumDialog} onClose={() => setViewCurriculumDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>
            Curriculum Structure: {selectedCourseDetail?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {selectedCourseDetail?.modules && selectedCourseDetail.modules.length > 0 ? (
              selectedCourseDetail.modules.map((m, idx) => (
                <Accordion key={m.id} defaultExpanded={idx === 0} sx={{ mb: 1.5, border: '1px solid #E3EAF5' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                      {m.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      {m.description || 'Module curriculum overview and learning outcomes.'}
                    </Typography>

                    {m.lessons && m.lessons.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {m.lessons.map((les) => (
                          <Box
                            key={les.id}
                            sx={{
                              p: 1.5,
                              bgcolor: '#F8FAFC',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
                                {les.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {les.content_text}
                              </Typography>
                            </Box>
                            <Chip label={`${les.duration_mins} mins`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8' }} />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        No lessons registered under this module yet.
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No syllabus modules uploaded for this course yet.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setViewCurriculumDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
