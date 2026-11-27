'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function IssueCertificatePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_id: selectedCompanyId || '',
    student_id: '',
    course_id: '',
    completion_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadStudentsAndCourses();
  }, [selectedCompanyId]);

  const loadStudentsAndCourses = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get(selectedCompanyId ? `/api/students?companyId=${selectedCompanyId}` : '/api/students'),
        api.get(selectedCompanyId ? `/api/courses?companyId=${selectedCompanyId}` : '/api/courses'),
      ]);
      if (sRes && sRes.data) setStudents(sRes.data);
      if (cRes && cRes.data) setCourses(cRes.data);
    } catch (e) {
      // silent
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/certificates', formData);
      showToast('Certificate successfully issued and verified with QR code!', 'success');
      router.push('/admin/certificates');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer maxWidth="800px">
        <PageHeader
          title="Issue Digital Certificate"
          subtitle="Generate verifiable credentials for learners who have completed course requirements with 100% fee clearance."
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Certificates', href: '/admin/certificates' },
            { label: 'Issue' },
          ]}
        />

        <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
          <strong>Fee Clearance Policy:</strong> Certificates are governed by automated financial clearance checks. If the learner has an outstanding fee ledger balance, generation is locked until full payment is recorded.
        </Alert>

        <SectionCard title="Certificate Issuance Details">
          <form onSubmit={handleIssue}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                select
                label="Student Candidate"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Select Completed Learner --</MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id_code}) &bull; Fee Status: {s.fee_status?.toUpperCase() || 'PENDING'}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Accredited Course"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Select Course Program --</MenuItem>
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Date of Completion"
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<WorkspacePremiumIcon />}
                  disabled={loading}
                >
                  {loading ? 'Validating Policy & Generating...' : 'Generate & Issue Certificate'}
                </Button>
              </Box>
            </Box>
          </form>
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
