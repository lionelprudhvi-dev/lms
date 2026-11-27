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
  IconButton,
  Tooltip,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BlockIcon from '@mui/icons-material/Block';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Link from 'next/link';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function CertificatesPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Revoke modal
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, [selectedCompanyId]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      let url = '/api/certificates';
      if (selectedCompanyId) url += `?companyId=${selectedCompanyId}`;
      const res = await api.get(url);
      if (res && res.data) setCertificates(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRevoke = (cert) => {
    setSelectedCert(cert);
    setRevokeReason('');
    setRevokeOpen(true);
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim()) {
      showToast('Please state a valid reason for revocation', 'error');
      return;
    }
    setRevoking(true);
    try {
      await api.post(`/api/certificates/${selectedCert.id}/revoke`, {
        reason: revokeReason,
      });
      showToast('Certificate successfully revoked', 'success');
      setRevokeOpen(false);
      loadCertificates();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRevoking(false);
    }
  };

  const columns = [
    {
      field: 'certificate_number',
      headerName: 'Certificate ID & QR',
      minWidth: 230,
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
            <WorkspacePremiumIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
              {row.certificate_number}
            </Typography>
            <Link
              href={`/verify/${row.certificate_number}`}
              target="_blank"
              style={{ fontSize: '11px', color: '#1D4ED8', textDecoration: 'none' }}
            >
              Verify Online &rarr;
            </Link>
          </Box>
        </Box>
      ),
    },
    {
      field: 'student_name',
      headerName: 'Recipient Student',
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.student_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.student_id_code}</Typography>
        </Box>
      ),
    },
    {
      field: 'course_name',
      headerName: 'Accredited Program',
      minWidth: 220,
      renderCell: ({ value }) => value,
    },
    {
      field: 'issue_date',
      headerName: 'Issue Date',
      minWidth: 120,
      renderCell: ({ value }) => dayjs(value).format('DD MMM YYYY'),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 110,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 160,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
            href={`/api/certificates/${row.id}/pdf`}
            download
            sx={{ height: 30, fontSize: '12px' }}
          >
            PDF
          </Button>

          {row.status === 'valid' && (
            <Tooltip title="Revoke Credential">
              <IconButton size="small" onClick={() => handleOpenRevoke(row)} sx={{ color: '#DC2626' }}>
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Issued Certificates & Credentials"
          subtitle="Accredited certificates with cryptographic organization identifiers, embedded QR verification codes, and PDF generation."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Certificates' }]}
          action={
            <Button
              component={Link}
              href="/admin/certificates/generate"
              variant="contained"
              startIcon={<WorkspacePremiumIcon />}
            >
              Issue Certificate
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={certificates}
            loading={loading}
            searchPlaceholder="Search certificate ID, student name..."
          />
        </SectionCard>

        {/* Revoke Modal */}
        <Dialog open={revokeOpen} onClose={() => setRevokeOpen(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleConfirmRevoke}>
            <DialogTitle sx={{ color: '#DC2626', fontWeight: 700 }}>
              Revoke Digital Certificate
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                You are revoking certificate: <strong>{selectedCert?.certificate_number}</strong> issued to <strong>{selectedCert?.student_name}</strong>.
              </Typography>

              <TextField
                label="Mandatory Reason for Revocation"
                placeholder="e.g. Academic dishonesty / Administrative error"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                required
                multiline
                rows={3}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setRevokeOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }} disabled={revoking}>
                {revoking ? 'Revoking...' : 'Confirm Revocation'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
