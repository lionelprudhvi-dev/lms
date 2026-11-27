'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import DataTable from '@/components/tables/DataTable';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
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
  IconButton,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function AdminAnnouncementsPage() {
  const { showToast } = useToast();
  const { companies } = useCompany();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/announcements', {
        title,
        content,
        company_id: companyId || null,
        target_role: targetRole,
        priority,
      });
      showToast('Announcement broadcasted successfully!', 'success');
      setOpenModal(false);
      setTitle('');
      setContent('');
      loadAnnouncements();
    } catch (err) {
      showToast('Failed to broadcast announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/announcements?id=${deleteId}`);
      showToast('Announcement deleted successfully', 'success');
      setDeleteId(null);
      loadAnnouncements();
    } catch (e) {
      showToast('Failed to delete announcement', 'error');
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Announcement',
      flex: 1.4,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
          <CampaignIcon sx={{ color: params.row.priority === 'urgent' ? '#DC2626' : '#1D4ED8', mt: 0.3 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
              {params.row.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mt: 0.3 }}>
              {params.row.content?.length > 80 ? params.row.content.substring(0, 80) + '...' : params.row.content}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'company_name',
      headerName: 'Scope',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2">{params.row.company_name || 'All Companies'}</Typography>
      ),
    },
    {
      field: 'target_role',
      headerName: 'Target Audience',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.target_role?.toUpperCase() || 'ALL'}
          size="small"
          sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => {
        const isUrgent = params.row.priority === 'urgent';
        return (
          <Chip
            label={params.row.priority?.toUpperCase() || 'NORMAL'}
            size="small"
            sx={{
              bgcolor: isUrgent ? '#FEE2E2' : '#DCFCE7',
              color: isUrgent ? '#DC2626' : '#16A34A',
              fontWeight: 700,
            }}
          />
        );
      },
    },
    {
      field: 'published_at',
      headerName: 'Published',
      width: 140,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#5B6B88' }}>
          {dayjs(params.row.published_at).format('DD MMM YYYY')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      renderCell: (params) => (
        <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Announcements & Broadcasts"
          subtitle="Publish organization-wide or company-specific announcements to students, trainers, and staff."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenModal(true)}
              sx={{ bgcolor: '#1D4ED8', fontWeight: 700 }}
            >
              New Announcement
            </Button>
          }
        />

        <SectionCard>
          <DataTable
            rows={announcements}
            columns={columns}
            loading={loading}
            emptyMessage="No announcements broadcasted yet."
          />
        </SectionCard>

        {/* Modal */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreate}>
            <DialogTitle sx={{ fontWeight: 700, color: '#0B2A5B' }}>Broadcast Announcement</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Notice Title"
                    fullWidth
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Detailed Notice Message"
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Target Company"
                    fullWidth
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                  >
                    <MenuItem value="">Organization-wide (All Companies)</MenuItem>
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Target Audience"
                    fullWidth
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  >
                    <MenuItem value="all">Everyone</MenuItem>
                    <MenuItem value="student">Students Only</MenuItem>
                    <MenuItem value="trainer">Trainers Only</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Priority Level"
                    fullWidth
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <MenuItem value="low">Low (General Information)</MenuItem>
                    <MenuItem value="medium">Medium (Standard Academic Notice)</MenuItem>
                    <MenuItem value="urgent">Urgent (Immediate Attention Required)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: '#1D4ED8' }}>
                {submitting ? 'Publishing...' : 'Broadcast Now'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Confirm Delete */}
        <ConfirmDialog
          open={Boolean(deleteId)}
          title="Delete Announcement"
          message="Are you sure you want to remove this announcement? It will no longer appear on student or trainer dashboards."
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      </PageContainer>
    </AdminLayout>
  );
}
