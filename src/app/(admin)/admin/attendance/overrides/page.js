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

export default function AttendanceOverridesPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/attendance/override');
      if (res && res.data) setLogs(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'created_at',
      headerName: 'Override Timestamp',
      minWidth: 160,
      renderCell: ({ value }) => dayjs(value).format('DD MMM YYYY hh:mm A'),
    },
    {
      field: 'student_name',
      headerName: 'Student Affected',
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
            {row.student_name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.student_id_code} &bull; Attendance Date: {row.date}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'previous_status',
      headerName: 'Previous Status',
      minWidth: 130,
      renderCell: ({ value }) => <StatusChip status={value || 'absent'} />,
    },
    {
      field: 'new_status',
      headerName: 'Overridden Status',
      minWidth: 140,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'reason',
      headerName: 'Mandatory Audit Reason',
      minWidth: 260,
      renderCell: ({ value, row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
            {value}
          </Typography>
          {row.remarks && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Note: {row.remarks}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'modifier_name',
      headerName: 'Modified By (Staff)',
      minWidth: 160,
      renderCell: ({ row }) => (
        <Chip
          label={`${row.modifier_first_name || 'Admin'} ${row.modifier_last_name || ''}`}
          size="small"
          sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Attendance Override Audit Trail"
          subtitle="Immutable historical audit records of every administrative manual status change, timestamped with modifier credentials and mandatory reasons."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Attendance' }, { label: 'Overrides' }]}
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={logs}
            loading={loading}
            searchPlaceholder="Search override logs by student, modifier, reason..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
