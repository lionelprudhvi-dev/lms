'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Skeleton,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

const defaultForm = {
  name: '',
  title: 'Certificate of Completion',
  company_id: '',
  background_color: '#FFFFFF',
  border_style: 'double',
  primary_color: '#0B2A5B',
  secondary_color: '#1D4ED8',
  header_text: 'This is proudly presented to',
  body_template: 'for outstandingly and successfully completing the course requirements and practical assessments.',
  footer_text: 'Issued with pride and high distinction.',
  signatory_name: 'Dr. Evelyn Vance',
  signatory_title: 'Academic Director',
  is_active: true,
};

export default function CertificateTemplatesPage() {
  const { showToast } = useToast();
  const { companies } = useCompany();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/certificates/templates');
      setTemplates(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tpl) => {
    setForm({
      id: tpl.id,
      name: tpl.name || '',
      title: tpl.title || 'Certificate of Completion',
      company_id: tpl.company_id || '',
      background_color: tpl.background_color || '#FFFFFF',
      border_style: tpl.border_style || 'double',
      primary_color: tpl.primary_color || '#0B2A5B',
      secondary_color: tpl.secondary_color || '#1D4ED8',
      header_text: tpl.header_text || '',
      body_template: tpl.body_template || '',
      footer_text: tpl.footer_text || '',
      signatory_name: tpl.signatory_name || '',
      signatory_title: tpl.signatory_title || '',
      is_active: tpl.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await api.put('/api/certificates/templates', form);
        showToast('Certificate template updated successfully', 'success');
      } else {
        await api.post('/api/certificates/templates', form);
        showToast('Certificate template created successfully', 'success');
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (err) {
      showToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/certificates/templates?id=${deleteId}`);
      showToast('Template deleted successfully', 'success');
      setDeleteId(null);
      loadTemplates();
    } catch (err) {
      showToast(err.message || 'Failed to delete template', 'error');
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Certificate Templates"
          subtitle="Design and manage branded certificate layouts, signatory credentials, and styling."
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Certificates', href: '/admin/certificates' },
            { label: 'Templates' },
          ]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              New Template
            </Button>
          }
        />

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Skeleton variant="rounded" height={240} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        ) : templates.length === 0 ? (
          <SectionCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkspacePremiumIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#0B2A5B', mb: 0.5 }}>
                No Certificate Templates Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#5B6B88', mb: 3 }}>
                Create your first branded certificate template to start issuing verifiable credentials.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Create First Template
              </Button>
            </Box>
          </SectionCard>
        ) : (
          <Grid container spacing={3}>
            {templates.map((tpl) => (
              <Grid item xs={12} md={6} lg={4} key={tpl.id}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: '1px solid #E3EAF5',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(29, 78, 216, 0.12)',
                      borderColor: '#93C5FD',
                    },
                  }}
                >
                  <Box>
                    {/* Mini visual preview header */}
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: '12px',
                        bgcolor: tpl.background_color || '#FFFFFF',
                        border: `3px ${tpl.border_style === 'double' ? 'double' : 'solid'} ${tpl.primary_color || '#0B2A5B'}`,
                        textAlign: 'center',
                      }}
                    >
                      <WorkspacePremiumIcon sx={{ color: tpl.secondary_color || '#1D4ED8', fontSize: 28, mb: 0.5 }} />
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: tpl.primary_color || '#0B2A5B', letterSpacing: '0.06em' }}>
                        {tpl.title?.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5B6B88', fontSize: '11px' }}>
                        Signed by {tpl.signatory_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
                        {tpl.name}
                      </Typography>
                      <StatusChip status={tpl.is_active ? 'active' : 'inactive'} size="small" />
                    </Box>

                    <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mb: 1.5 }}>
                      Scope: {tpl.company_name || 'Organization-wide'} &bull; Border: {tpl.border_style}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #F1F5F9', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setPreviewTemplate(tpl)}
                    >
                      Preview
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(tpl)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(tpl.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Template Modal */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleSave}>
            <DialogTitle sx={{ fontWeight: 700, color: '#0B2A5B' }}>
              {form.id ? 'Edit Certificate Template' : 'Create Certificate Template'}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Template Name"
                    fullWidth
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Executive Gold & Navy"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Certificate Title"
                    fullWidth
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Target Subsidiary (Optional)"
                    fullWidth
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                  >
                    <MenuItem value="">Organization-wide</MenuItem>
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
                    label="Border Style"
                    fullWidth
                    value={form.border_style}
                    onChange={(e) => setForm({ ...form, border_style: e.target.value })}
                  >
                    <MenuItem value="double">Double Classic</MenuItem>
                    <MenuItem value="solid">Solid Minimal</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    label="Primary Color"
                    fullWidth
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    label="Accent Color"
                    fullWidth
                    value={form.secondary_color}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    label="Background Color"
                    fullWidth
                    value={form.background_color}
                    onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Header Salutation"
                    fullWidth
                    value={form.header_text}
                    onChange={(e) => setForm({ ...form, header_text: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Citation Body Text"
                    fullWidth
                    multiline
                    rows={2}
                    value={form.body_template}
                    onChange={(e) => setForm({ ...form, body_template: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Signatory Name"
                    fullWidth
                    value={form.signatory_name}
                    onChange={(e) => setForm({ ...form, signatory_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Signatory Title"
                    fullWidth
                    value={form.signatory_title}
                    onChange={(e) => setForm({ ...form, signatory_title: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Template'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Live Preview Dialog */}
        <Dialog open={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: '#0B2A5B' }}>
            Template Preview: {previewTemplate?.name}
          </DialogTitle>
          <DialogContent dividers>
            {previewTemplate && (
              <Box
                sx={{
                  p: { xs: 3, md: 5 },
                  bgcolor: previewTemplate.background_color || '#FFFFFF',
                  border: `6px ${previewTemplate.border_style === 'double' ? 'double' : 'solid'} ${previewTemplate.primary_color || '#0B2A5B'}`,
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <WorkspacePremiumIcon sx={{ fontSize: 48, color: previewTemplate.secondary_color || '#1D4ED8', mb: 1 }} />
                <Typography variant="h2" sx={{ color: previewTemplate.primary_color || '#0B2A5B', fontWeight: 800, letterSpacing: '0.06em', mb: 1 }}>
                  {previewTemplate.title?.toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5B6B88', mb: 2 }}>
                  {previewTemplate.header_text}
                </Typography>
                <Typography variant="h1" sx={{ color: '#0F1B33', fontWeight: 800, mb: 2 }}>
                  Rahul Sharma
                </Typography>
                <Typography variant="body1" sx={{ color: '#334155', maxWidth: 540, mx: 'auto', mb: 4 }}>
                  {previewTemplate.body_template}
                </Typography>
                <Divider sx={{ maxWidth: 260, mx: 'auto', mb: 1.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: previewTemplate.primary_color || '#0B2A5B' }}>
                  {previewTemplate.signatory_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5B6B88' }}>
                  {previewTemplate.signatory_title}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={Boolean(deleteId)}
          title="Delete Certificate Template"
          message="Are you sure you want to delete this template? Existing issued certificates will not be affected."
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      </PageContainer>
    </AdminLayout>
  );
}
