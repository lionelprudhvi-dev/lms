'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  TextField,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import QuizIcon from '@mui/icons-material/Quiz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

const reportTypes = [
  {
    id: 'students',
    title: 'Student Roster & Enrollments Report',
    category: 'Academic',
    icon: PeopleIcon,
    description: 'Complete listing of all enrolled students, courses, batches, and enrollment dates.',
  },
  {
    id: 'attendance',
    title: 'Daily & Monthly Attendance Summary',
    category: 'Attendance',
    icon: AccessTimeIcon,
    description: 'Batch-wise attendance rates, late check-ins, leaves, and geofence distance logs.',
  },
  {
    id: 'ip_matches',
    title: 'IP Match & Fraud Audit Report',
    category: 'Attendance',
    icon: SecurityIcon,
    description: 'Suspicious simultaneous check-ins sharing the same public IP address.',
  },
  {
    id: 'exams',
    title: 'Examination Results & Performance',
    category: 'Examinations',
    icon: QuizIcon,
    description: 'Exam attempt scores, pass/fail status, and question-level difficulty analysis.',
  },
  {
    id: 'fees_collection',
    title: 'Fee Collection & Revenue Report',
    category: 'Finance',
    icon: AccountBalanceWalletIcon,
    description: 'Daily collections, payment methods, transaction receipts, and collector staff attribution.',
  },
  {
    id: 'fees_outstanding',
    title: 'Outstanding Dues & Overdue Aging',
    category: 'Finance',
    icon: AccountBalanceWalletIcon,
    description: 'Students with overdue fee installments and balance aging buckets (30/60/90 days).',
  },
];

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompany();
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [exportingId, setExportingId] = useState(null);

  const handleExport = (reportId, format) => {
    setExportingId(`${reportId}-${format}`);
    setTimeout(() => {
      showToast(`Exported ${reportId} report as ${format.toUpperCase()} successfully!`, 'success');
      setExportingId(null);
    }, 700);
  };

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Consolidated Enterprise Reports"
          subtitle="Generate and export comprehensive audit reports across academics, attendance, exams, and financials."
        />

        {/* Filters */}
        <SectionCard sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="Start Date"
                fullWidth
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="End Date"
                fullWidth
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Filter by Company"
                fullWidth
                size="small"
                value={selectedCompanyId || 'all'}
              >
                <MenuItem value="all">All Companies</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Report Cards Grid */}
        <Grid container spacing={3}>
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Grid item xs={12} md={6} key={report.id}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: '1px solid #E3EAF5',
                    boxShadow: '0 4px 24px rgba(11,42,91,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(29,78,216,0.14)',
                      borderColor: '#93C5FD',
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          bgcolor: '#EAF2FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1D4ED8',
                        }}
                      >
                        <Icon />
                      </Box>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '17px', color: '#0B2A5B' }}>
                          {report.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600 }}>
                          Category: {report.category}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#5B6B88', mb: 2 }}>
                      {report.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid #F1F5F9' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={exportingId === `${report.id}-excel`}
                      onClick={() => handleExport(report.id, 'excel')}
                      sx={{ borderRadius: '8px', flex: 1, fontWeight: 600 }}
                    >
                      {exportingId === `${report.id}-excel` ? 'Exporting...' : 'Excel (.xlsx)'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={exportingId === `${report.id}-csv`}
                      onClick={() => handleExport(report.id, 'csv')}
                      sx={{ borderRadius: '8px', flex: 1, fontWeight: 600 }}
                    >
                      CSV
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      disabled={exportingId === `${report.id}-pdf`}
                      onClick={() => handleExport(report.id, 'pdf')}
                      sx={{ borderRadius: '8px', flex: 1, bgcolor: '#1D4ED8', fontWeight: 600 }}
                    >
                      PDF
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </PageContainer>
    </AdminLayout>
  );
}
