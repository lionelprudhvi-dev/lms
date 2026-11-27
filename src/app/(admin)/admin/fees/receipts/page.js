'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import { Box, Typography, Button, Chip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReceiptIcon from '@mui/icons-material/Receipt';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function ReceiptsArchivePage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, [selectedCompanyId]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      let url = '/api/fees/receipts';
      if (selectedCompanyId) url += `?companyId=${selectedCompanyId}`;
      const res = await api.get(url);
      if (res && res.data) setReceipts(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'receipt_number',
      headerName: 'Receipt ID & Date',
      minWidth: 220,
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
            <ReceiptIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
              {row.receipt_number}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {dayjs(row.payment_date).format('DD MMM YYYY')}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'student_name',
      headerName: 'Student Name',
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
      headerName: 'Course & Batch',
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '13px' }}>{row.course_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.batch_name || 'Cohort'}</Typography>
        </Box>
      ),
    },
    {
      field: 'payment_method',
      headerName: 'Mode & Ref',
      minWidth: 160,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '12px' }}>
            {row.payment_method}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.reference_number || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Paid Amount',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
          ₹{Number(value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'current_outstanding',
      headerName: 'Balance',
      minWidth: 130,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ color: Number(value) > 0 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
          ₹{Number(value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'PDF',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="contained"
          startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
          href={`/api/fees/receipts/${row.id}/pdf`}
          download
          sx={{ height: 30, fontSize: '12px', bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#0B2A5B' } }}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Payment Receipts Archive"
          subtitle="Complete historical archive of all auto-generated, authenticated digital payment receipts available for instantaneous PDF download and reprint."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Receipts' }]}
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={receipts}
            loading={loading}
            searchPlaceholder="Search receipts by receipt number, student name..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
