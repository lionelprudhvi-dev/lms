'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Container,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function PublicVerifyCertificatePage() {
  const { certNo } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyCertificate();
  }, [certNo]);

  const verifyCertificate = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/verify/${certNo}`);
      if (res && res.data) {
        setCert(res.data);
      }
    } catch (err) {
      setError(err.message || 'Certificate verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F5F8FD',
        py: { xs: 4, md: 8 },
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        {/* Brand Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              p: '6px 16px',
              borderRadius: '12px',
              bgcolor: '#0B2A5B',
              color: '#FFFFFF',
              mb: 1.5,
            }}
          >
            <WorkspacePremiumIcon sx={{ color: '#93C5FD' }} />
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '15px' }}>
              APEX GLOBAL CREDENTIAL VERIFIER
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Official public tamper-proof verification portal
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#1D4ED8' }} />
          </Box>
        ) : error ? (
          <Card
            sx={{
              p: 4,
              borderRadius: '20px',
              bgcolor: '#FFFFFF',
              border: '1px solid #FCA5A5',
              boxShadow: '0 8px 32px rgba(220, 38, 38, 0.08)',
              textAlign: 'center',
            }}
          >
            <CancelIcon sx={{ color: '#DC2626', fontSize: 56, mb: 2 }} />
            <Typography variant="h2" sx={{ color: '#DC2626', fontSize: '22px', fontWeight: 700, mb: 1 }}>
              Invalid or Unregistered Credential
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {error}
            </Typography>
            <Chip label={`Queried ID: ${certNo}`} sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />
          </Card>
        ) : (
          <Card
            sx={{
              borderRadius: '20px',
              bgcolor: '#FFFFFF',
              border: cert?.is_valid ? '1px solid #86EFAC' : '1px solid #FCA5A5',
              boxShadow: '0 12px 36px rgba(11, 42, 91, 0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Status Header Banner */}
            <Box
              sx={{
                p: 3,
                bgcolor: cert?.is_valid ? '#DCFCE7' : '#FEE2E2',
                color: cert?.is_valid ? '#15803D' : '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {cert?.is_valid ? <VerifiedIcon sx={{ fontSize: 36 }} /> : <CancelIcon sx={{ fontSize: 36 }} />}
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '18px', color: 'inherit' }}>
                  {cert?.is_valid ? 'VERIFIED AUTHENTIC CREDENTIAL' : 'REVOKED CREDENTIAL'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
                  {cert?.is_valid
                    ? 'Official accredited qualification on record'
                    : `Revoked: ${cert?.revoked_reason || 'Administrative action'}`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                  Candidate Recipient
                </Typography>
                <Typography variant="h2" sx={{ color: '#0B2A5B', fontSize: '24px', fontWeight: 700, mt: 0.25 }}>
                  {cert?.student_name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                  Completed Program
                </Typography>
                <Typography variant="h3" sx={{ color: '#1D4ED8', fontSize: '18px', fontWeight: 700, mt: 0.25 }}>
                  {cert?.course_name}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#E3EAF5' }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Certificate ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
                    {cert?.certificate_number}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Issue Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {dayjs(cert?.issue_date).format('DD MMM YYYY')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Issuing Subsidiary</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cert?.company_name}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Governing Group</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cert?.organization_name}
                  </Typography>
                </Grid>
              </Grid>

              {cert?.is_valid && (
                <Box sx={{ pt: 1, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<FileDownloadIcon />}
                    href={`/api/certificates/${cert?.certificate_number}/pdf`}
                    download
                    sx={{ width: '100%', height: 44, bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#0B2A5B' } }}
                  >
                    Download Official PDF Credential
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E3EAF5', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                Secure verification logged at {dayjs().format('DD MMM YYYY hh:mm A')}
              </Typography>
            </Box>
          </Card>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Link href="/login" style={{ color: '#1D4ED8', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
            &larr; Return to Apex LMS Login
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
