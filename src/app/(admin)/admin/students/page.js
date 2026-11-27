'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import SearchSelect from '@/components/forms/SearchSelect';
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
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function StudentsPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_id: selectedCompanyId || '',
    course_id: '',
    batch_id: '',
    qualification: 'B.Tech / Bachelor Degree',
    dob: '2002-05-15',
    gender: 'Male',
    address: 'Bengaluru, Karnataka',
    emergency_contact: '+91 98888 77777',
  });

  useEffect(() => {
    loadStudents();
    loadCoursesAndBatches();
  }, [selectedCompanyId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/students?companyId=${selectedCompanyId}` : '/api/students';
      const res = await api.get(url);
      if (res && res.data) setStudents(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndBatches = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        api.get(selectedCompanyId ? `/api/courses?companyId=${selectedCompanyId}` : '/api/courses'),
        api.get(selectedCompanyId ? `/api/batches?companyId=${selectedCompanyId}` : '/api/batches'),
      ]);
      if (cRes && cRes.data) setCourses(cRes.data);
      if (bRes && bRes.data) setBatches(bRes.data);
    } catch (e) {
      // silent
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/students', {
        ...formData,
        company_id: formData.company_id || selectedCompanyId || (companies[0] && companies[0].id),
      });
      showToast('Student enrolled successfully and fee account initialized!', 'success');
      setDialogOpen(false);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company_id: selectedCompanyId || '',
        course_id: '',
        batch_id: '',
        qualification: 'B.Tech / Bachelor Degree',
        dob: '2002-05-15',
        gender: 'Male',
        address: 'Bengaluru, Karnataka',
        emergency_contact: '+91 98888 77777',
      });
      loadStudents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredBatches = formData.course_id
    ? batches.filter((b) => b.course_id === formData.course_id)
    : batches;

  const columns = [
    {
      field: 'full_name',
      headerName: 'Student Name & ID',
      minWidth: 230,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#1D4ED8', fontSize: '13px', fontWeight: 700 }}>
            {row.full_name ? row.full_name[0] : 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
              {row.full_name}
            </Typography>
            <Chip
              label={row.student_id_code}
              size="small"
              sx={{ height: 18, fontSize: '10px', bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }}
            />
          </Box>
        </Box>
      ),
    },
    {
      field: 'company_name',
      headerName: 'Subsidiary',
      minWidth: 160,
      renderCell: ({ value, row }) => (
        <Typography variant="body2" sx={{ fontSize: '13px' }}>
          {value || row.company_code}
        </Typography>
      ),
    },
    {
      field: 'course_name',
      headerName: 'Enrolled Course',
      minWidth: 200,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'batch_name',
      headerName: 'Batch',
      minWidth: 150,
      renderCell: ({ value }) => (
        value ? <Chip label={value} size="small" sx={{ bgcolor: '#F1F5F9', fontSize: '11px' }} /> : '—'
      ),
    },
    {
      field: 'fee_status',
      headerName: 'Fee Account',
      minWidth: 130,
      renderCell: ({ row }) => (
        <Box>
          <StatusChip status={row.fee_status || 'pending'} />
          {row.outstanding_balance > 0 && (
            <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', fontWeight: 600 }}>
              Due: ₹{Number(row.outstanding_balance).toLocaleString()}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Contact Phone',
      minWidth: 130,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Student Information & Enrollment"
          subtitle="Directory of admitted learners with automatic Student ID generation, batch scheduling, and live fee ledger balance tracking."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Students' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Enroll New Student
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={students}
            loading={loading}
            searchPlaceholder="Search student by name, student ID, mobile..."
          />
        </SectionCard>

        {/* Enroll Student Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleEnrollStudent}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700, fontSize: '18px' }}>
              Enroll New Student & Initialize Fee Account
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Legal Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address (Login Username)"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Assign Course"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value, batch_id: '' })}
                    required
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">-- Select Course --</MenuItem>
                    {courses.map((cr) => (
                      <MenuItem key={cr.id} value={cr.id}>
                        {cr.name} ({cr.code}) — ₹{Number(cr.base_fee).toLocaleString()}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Assign Batch"
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">-- Unassigned / Future Batch --</MenuItem>
                    {filteredBatches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name} ({b.schedule_time})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Highest Qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Date of Birth"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Residential Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)} sx={{ color: '#5B6B88' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Enrolling...' : 'Complete Enrollment & Setup Fee Account'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
