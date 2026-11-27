'use client';

import React, { useState, useEffect } from 'react';
import TrainerLayout from '@/components/layout/TrainerLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import {
  Box,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DownloadIcon from '@mui/icons-material/Download';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function TrainerMaterialsPage() {
  const { showToast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload dialog
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes, bRes] = await Promise.all([
        api.get('/api/materials').catch(() => ({ data: [] })),
        api.get('/api/courses').catch(() => ({ data: [] })),
        api.get('/api/batches').catch(() => ({ data: [] })),
      ]);
      setMaterials(mRes.data || []);
      setCourses(cRes.data || []);
      setBatches(bRes.data || []);
      if (cRes.data?.length > 0) setCourseId(cRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/materials', {
        title,
        course_id: courseId,
        batch_id: batchId || null,
        file_type: fileType,
        file_url: fileUrl || 'https://assets.apex-lms.com/notes.pdf',
      });
      showToast('Learning material uploaded successfully!', 'success');
      setOpenModal(false);
      setTitle('');
      setFileUrl('');
      loadData();
    } catch (err) {
      showToast('Failed to upload material', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Material Title',
      flex: 1.3,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {params.row.file_type === 'video' ? (
            <VideoLibraryIcon sx={{ color: '#1D4ED8' }} />
          ) : (
            <PictureAsPdfIcon sx={{ color: '#DC2626' }} />
          )}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
              {params.row.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5B6B88' }}>
              Type: {params.row.file_type?.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'course_name',
      headerName: 'Course / Batch',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.course_name || 'All Cohorts'} {params.row.batch_name ? `(${params.row.batch_name})` : ''}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Uploaded On',
      width: 140,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#5B6B88' }}>
          {dayjs(params.row.created_at).format('DD MMM YYYY')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 140,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          href={params.row.file_url || '#'}
          target="_blank"
          sx={{ borderRadius: '8px' }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Learning Materials"
          subtitle="Distribute lecture slides, architectural guides, lab manuals, and supplementary reading."
          action={
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => setOpenModal(true)}
              sx={{ bgcolor: '#1D4ED8', fontWeight: 700 }}
            >
              Upload Material
            </Button>
          }
        />

        <SectionCard>
          <DataTable
            rows={materials}
            columns={columns}
            loading={loading}
            emptyMessage="No learning materials uploaded yet."
          />
        </SectionCard>

        {/* Upload Dialog */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleUpload}>
            <DialogTitle sx={{ fontWeight: 700, color: '#0B2A5B' }}>Upload Learning Material</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Material Title"
                    fullWidth
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Course"
                    fullWidth
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                  >
                    {courses.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Specific Batch (Optional)"
                    fullWidth
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    <MenuItem value="">All Batches</MenuItem>
                    {batches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Resource Type"
                    fullWidth
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                  >
                    <MenuItem value="pdf">PDF Document</MenuItem>
                    <MenuItem value="video">Video Recording</MenuItem>
                    <MenuItem value="slide">Presentation Slides</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="File / Cloud URL"
                    fullWidth
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://cloud.storage/sample.pdf"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: '#1D4ED8' }}>
                {submitting ? 'Uploading...' : 'Save & Distribute'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </TrainerLayout>
  );
}
