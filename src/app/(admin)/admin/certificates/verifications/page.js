'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import { Box, Typography, Chip } from '@mui/material';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function CertificateVerificationsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/certificates/verifications');
      if (res && res.data) setLogs(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'verified_at',
      headerName: 'Verification Scan Timestamp',
      minWidth: 200,
      renderCell: ({ value }) => dayjs(value).format('DD MMM YYYY hh:mm:ss A'),
    },
    {
      field: 'certificate_number',
      headerName: 'Scanned Certificate ID',
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
            {row.certificate_number}
          </Typography>
          {row.student_name && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {row.student_name}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'ip_address',
      headerName: 'Scanner Public IP',
      minWidth: 150,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontSize: '11px' }} />
      ),
    },
    {
      field: 'is_valid',
      headerName: 'Verification Result',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Chip
          label={value ? 'VALID CREDENTIAL' : 'INVALID / NOT FOUND'}
          size="small"
          sx={{
            bgcolor: value ? '#DCFCE7' : '#FEE2E2',
            color: value ? '#15803D' : '#B91C1C',
            fontWeight: 700,
            fontSize: '11px',
          }}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Public Certificate Verification Scans"
          subtitle="Audit log of third-party employers, verifiers, and mobile scans querying credentials on the public portal."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Certificates' }, { label: 'Verification Logs' }]}
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={logs}
            loading={loading}
            searchPlaceholder="Search verification logs by certificate ID, IP..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
