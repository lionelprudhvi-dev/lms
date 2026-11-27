'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

const REPORT_TYPES = [
  { key: 'outstanding', label: '1. Outstanding Balances Report' },
  { key: 'daily_collection', label: '2. Daily & Recent Collection Report' },
  { key: 'installments_due', label: '3. Installment Due Calendar' },
  { key: 'overdue_defaulters', label: '4. Overdue Defaulters Report' },
  { key: 'staff_performance', label: '5. Staff Collection Performance' },
  { key: 'transactions', label: '6. Complete Transaction Audit History' },
];

export default function FeeReportsPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [reportType, setReportType] = useState('outstanding');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportType, selectedCompanyId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let url = `/api/fees/reports?type=${reportType}`;
      if (selectedCompanyId) url += `&companyId=${selectedCompanyId}`;
      const res = await api.get(url);
      if (res && res.data) setRows(res.data.rows || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getColumns = () => {
    if (reportType === 'staff_performance') {
      return [
        {
          field: 'name',
          headerName: 'Staff Member',
          minWidth: 220,
          renderCell: ({ row }) => `${row.first_name} ${row.last_name} (${row.email})`,
        },
        {
          field: 'transactions_count',
          headerName: 'Transactions Processed',
          minWidth: 180,
          align: 'center',
          renderCell: ({ value }) => `${value || 0} collections`,
        },
        {
          field: 'total_collected',
          headerName: 'Total Collection Realized',
          minWidth: 200,
          renderCell: ({ value }) => (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
              ₹{Number(value).toLocaleString()}
            </Typography>
          ),
        },
      ];
    }

    if (reportType === 'installments_due') {
      return [
        {
          field: 'due_date',
          headerName: 'Due Date',
          minWidth: 130,
          renderCell: ({ value }) => dayjs(value).format('DD MMM YYYY'),
        },
        {
          field: 'student_name',
          headerName: 'Student Name',
          minWidth: 200,
          renderCell: ({ row }) => (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.student_name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.student_id_code} &bull; {row.phone}</Typography>
            </Box>
          ),
        },
        { field: 'title', headerName: 'Milestone Title', minWidth: 200 },
        {
          field: 'due_amount',
          headerName: 'Due Amount',
          minWidth: 140,
          renderCell: ({ value }) => (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
              ₹{Number(value).toLocaleString()}
            </Typography>
          ),
        },
        {
          field: 'status',
          headerName: 'Status',
          minWidth: 120,
          renderCell: ({ value }) => <StatusChip status={value} />,
        },
      ];
    }

    // Default / Outstanding
    return [
      {
        field: 'student_name',
        headerName: 'Student Recipient',
        minWidth: 220,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.student_name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.student_id_code}</Typography>
          </Box>
        ),
      },
      { field: 'course_name', headerName: 'Course Program', minWidth: 200 },
      {
        field: 'net_payable',
        headerName: 'Net Payable',
        minWidth: 140,
        renderCell: ({ value }) => `₹${Number(value || 0).toLocaleString()}`,
      },
      {
        field: 'total_paid',
        headerName: 'Paid to Date',
        minWidth: 140,
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
            ₹${Number(value || 0).toLocaleString()}
          </Typography>
        ),
      },
      {
        field: 'outstanding_balance',
        headerName: 'Outstanding Due',
        minWidth: 150,
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626' }}>
            ₹{Number(value || 0).toLocaleString()}
          </Typography>
        ),
      },
      {
        field: 'status',
        headerName: 'Ledger Status',
        minWidth: 120,
        renderCell: ({ value }) => <StatusChip status={value} />,
      },
    ];
  };

  const handleExportCsv = (filteredRows) => {
    if (!filteredRows || filteredRows.length === 0) return;
    const keys = Object.keys(filteredRows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        keys.join(','),
        ...filteredRows.map((r) => keys.map((k) => `"${r[k] !== undefined ? r[k] : ''}"`).join(',')),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Report_${reportType}_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Financial & Fee Reports"
          subtitle="Generate student ledgers, outstanding defaulters lists, collection audits, installment forecasts, and exportable financial reports."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Reports' }]}
          action={
            <FormControl size="small" sx={{ minWidth: 260, bgcolor: '#FFFFFF', borderRadius: '10px' }}>
              <InputLabel>Select Report Type</InputLabel>
              <Select
                value={reportType}
                label="Select Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map((rt) => (
                  <MenuItem key={rt.key} value={rt.key}>
                    {rt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={getColumns()}
            rows={rows}
            loading={loading}
            onExportCsv={handleExportCsv}
            searchPlaceholder="Filter report records..."
          />
        </SectionCard>
      </PageContainer>
    </AdminLayout>
  );
}
