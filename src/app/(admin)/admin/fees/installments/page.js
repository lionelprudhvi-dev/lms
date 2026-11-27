'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function InstallmentsPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [selectedCompanyId]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/fees/accounts?companyId=${selectedCompanyId}` : '/api/fees/accounts';
      const res = await api.get(url);
      if (res && res.data) setAccounts(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'student_name',
      headerName: 'Student Name & ID',
      minWidth: 220,
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
      field: 'installments',
      headerName: 'Configured Installment Schedules',
      minWidth: 320,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }}>
          {row.installments && row.installments.length > 0 ? (
            row.installments.map((inst) => (
              <Box
                key={inst.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: '4px 8px',
                  bgcolor: inst.status === 'paid' ? '#DCFCE7' : inst.status === 'overdue' ? '#FEE2E2' : '#F8FAFC',
                  borderRadius: '6px',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Inst {inst.number}: ₹{Number(inst.due_amount).toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Due: {dayjs(inst.due_date).format('DD MMM')}
                  </Typography>
                  <StatusChip status={inst.status} size="small" />
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="caption">No installment schedule registered</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'outstanding_balance',
      headerName: 'Total Due',
      minWidth: 130,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: Number(value) > 0 ? '#DC2626' : '#16A34A' }}>
          ₹{Number(value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Account Status',
      minWidth: 120,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Student Installment Schedules & Realization"
          subtitle="Track structured milestone payments, registration advances, upcoming due dates, and per-installment clearing statuses."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Installments' }]}
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={accounts}
            loading={loading}
            searchPlaceholder="Search installments by student name, ID..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
