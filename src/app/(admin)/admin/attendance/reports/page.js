'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import { Box, Grid, Typography, Button, TextField } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function AttendanceReportsPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [selectedCompanyId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const url = selectedCompanyId ? `/api/attendance?companyId=${selectedCompanyId}` : '/api/attendance';
      const res = await api.get(url);
      if (res && res.data) setRecords(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const flaggedCount = records.filter((r) => r.is_flagged).length;
  const presentPct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const columns = [
    {
      field: 'date',
      headerName: 'Date',
      minWidth: 120,
      renderCell: ({ value }) => dayjs(value).format('DD MMM YYYY'),
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
      headerName: 'Course',
      minWidth: 180,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'batch_name',
      headerName: 'Batch',
      minWidth: 150,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'check_in_time',
      headerName: 'Check In',
      minWidth: 120,
      renderCell: ({ value }) => (value ? dayjs(value).format('hh:mm A') : '—'),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  const handleExportCsv = (rowsToExport) => {
    const headers = ['Date', 'Student ID', 'Student Name', 'Course', 'Batch', 'Check In', 'Status'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rowsToExport.map((r) =>
          [r.date, r.student_id_code, `"${r.student_name}"`, `"${r.course_name || ''}"`, `"${r.batch_name || ''}"`, r.check_in_time || '', r.status].join(',')
        ),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Attendance Analytics & Reports"
          subtitle="Comprehensive attendance summaries, punctuality metrics, geofence compliance, and exportable CSV/Excel audits."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Attendance' }, { label: 'Reports' }]}
        />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Attendance Rate"
              value={`${presentPct}%`}
              subtitle={`${presentCount} of ${total} records`}
              icon={CheckCircleOutlineIcon}
              color="#16A34A"
              bgColor="#DCFCE7"
              trend="+4.2% vs last mo"
              trendType="up"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Late Check-ins"
              value={lateCount}
              subtitle="Beyond grace threshold"
              icon={AccessTimeIcon}
              color="#D97706"
              bgColor="#FEF3C7"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Geofence Flagged"
              value={flaggedCount}
              subtitle="Outside campus radius"
              icon={WarningAmberIcon}
              color="#DC2626"
              bgColor="#FEE2E2"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Total Records"
              value={total}
              subtitle="Logged attendance entries"
              icon={CheckCircleOutlineIcon}
              color="#1D4ED8"
              bgColor="#EAF2FF"
            />
          </Grid>
        </Grid>

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={records}
            loading={loading}
            onExportCsv={handleExportCsv}
            searchPlaceholder="Filter report records..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
