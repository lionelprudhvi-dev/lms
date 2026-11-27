'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import { Box, Typography, Grid, Card, Button, Chip } from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Link from 'next/link';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function StudentCertificatesPage() {
  const { showToast } = useToast();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCerts();
  }, []);

  const loadMyCerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/certificates');
      if (res && res.data) setCerts(res.data);
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
          title="My Accredited Digital Certificates"
          subtitle="Download official digitally-signed credentials with cryptographic QR codes and shareable verification URLs."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'My Certificates' }]}
        />

        <Grid container spacing={3}>
          {certs && certs.length > 0 ? (
            certs.map((c) => (
              <Grid item xs={12} md={6} key={c.id}>
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
                        label={c.certificate_number}
                        size="small"
                        sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 700 }}
                      />
                      <StatusChip status={c.status} />
                    </Box>

                    <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '18px', fontWeight: 700, mb: 0.5 }}>
                      {c.course_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Awarded to: {c.student_name}
                    </Typography>

                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Issue Date: {dayjs(c.issue_date).format('DD MMMM YYYY')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Issuing Institution: {c.company_name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link
                      href={`/verify/${c.certificate_number}`}
                      target="_blank"
                      style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Public Verification Link &rarr;
                    </Link>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<FileDownloadIcon />}
                      href={`/api/certificates/${c.id}/pdf`}
                      download
                      sx={{ bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#0B2A5B' } }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <SectionCard>
                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                  No digital certificates issued yet. Complete course evaluations and settle fee balances to receive credentials.
                </Typography>
              </SectionCard>
            </Grid>
          )}
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
