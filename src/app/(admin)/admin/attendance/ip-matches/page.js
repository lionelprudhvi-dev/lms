'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
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
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import GroupIcon from '@mui/icons-material/Group';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function IPMatchDetectionPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('reviewed');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [selectedCompanyId]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      let url = '/api/attendance/ip-matches';
      if (selectedCompanyId) url += `?companyId=${selectedCompanyId}`;
      const res = await api.get(url);
      if (res && res.data) setMatches(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (match) => {
    setSelectedMatch(match);
    setReviewStatus(match.status === 'pending' ? 'reviewed' : match.status);
    setAdminNotes(match.admin_notes || '');
    setReviewOpen(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      await api.put(`/api/attendance/ip-matches/${selectedMatch.id}`, {
        status: reviewStatus,
        admin_notes: adminNotes,
      });
      showToast('IP match review status updated successfully', 'success');
      setReviewOpen(false);
      loadMatches();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingReview(false);
    }
  };

  const pendingCount = matches.filter((m) => m.status === 'pending').length;
  const uniqueIps = new Set(matches.map((m) => m.ip_address)).size;

  const columns = [
    {
      field: 'date',
      headerName: 'Incident Date',
      minWidth: 120,
      renderCell: ({ value }) => dayjs(value).format('DD MMM YYYY'),
    },
    {
      field: 'ip_address',
      headerName: 'Matched Public IP',
      minWidth: 160,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '11px' }}
        />
      ),
    },
    {
      field: 'student_a_name',
      headerName: 'Primary Student (A)',
      minWidth: 190,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.student_a_name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.student_a_code} &bull; {row.check_in_time_a ? dayjs(row.check_in_time_a).format('hh:mm A') : ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'student_b_name',
      headerName: 'Matched Student (B)',
      minWidth: 190,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.student_b_name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.student_b_code} &bull; {row.check_in_time_b ? dayjs(row.check_in_time_b).format('hh:mm A') : ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'company_name',
      headerName: 'Company Subsidiary',
      minWidth: 160,
      renderCell: ({ value }) => value,
    },
    {
      field: 'status',
      headerName: 'Review Status',
      minWidth: 130,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'actions',
      headerName: 'Review Action',
      minWidth: 130,
      renderCell: ({ row }) => (
        <Button size="small" variant="contained" onClick={() => handleOpenReview(row)} sx={{ height: 30, fontSize: '12px' }}>
          Review Alert
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="IP Match Detection Dashboard"
          subtitle="Identifies co-located or suspicious proxy check-ins sharing identical public IP addresses within the attendance time window."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Attendance' }, { label: 'IP Matches' }]}
        />

        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          <strong>Notice:</strong> IP matches are suspicious indicators for administrative review and do not automatically mark learners absent. Shared campus Wi-Fi, carrier-grade NAT, and hotspot networks are legitimate explanations.
        </Alert>

        {/* Stat Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Pending Alerts"
              value={pendingCount}
              subtitle="Requiring coordinator action"
              icon={WarningAmberIcon}
              color="#DC2626"
              bgColor="#FEE2E2"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Unique Matched IPs"
              value={uniqueIps}
              subtitle="Distinct network addresses"
              icon={NetworkCheckIcon}
              color="#1D4ED8"
              bgColor="#EAF2FF"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Total IP Match Logs"
              value={matches.length}
              subtitle="Lifetime recorded alerts"
              icon={GroupIcon}
              color="#0B2A5B"
              bgColor="#F1F5F9"
            />
          </Grid>
        </Grid>

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={matches}
            loading={loading}
            searchPlaceholder="Search IP matches by student or IP address..."
          />
        </SectionCard>

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSaveReview}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>
              Review IP Match Incident
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E3EAF5' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  IP Address: {selectedMatch?.ip_address}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Student A: {selectedMatch?.student_a_name} ({selectedMatch?.student_a_code})
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Student B: {selectedMatch?.student_b_name} ({selectedMatch?.student_b_code})
                </Typography>
              </Box>

              <TextField
                select
                label="Review Decision Status"
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="reviewed">Reviewed & Verified (Legitimate Shared Network)</MenuItem>
                <MenuItem value="dismissed">Dismissed (False Positive / Campus Hub)</MenuItem>
                <MenuItem value="confirmed">Confirmed Proxy (Flagged Suspect)</MenuItem>
              </TextField>

              <TextField
                label="Administrative Notes & Verification Evidence"
                placeholder="e.g. Verified both students physically seated in Lab 3 connected to Campus Guest Wi-Fi"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={savingReview}>
                {savingReview ? 'Saving...' : 'Update Review Decision'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
