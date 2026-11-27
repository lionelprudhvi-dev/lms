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
  MenuItem,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import dayjs from 'dayjs';

export default function DailyAttendancePage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Override Dialog
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [overrideData, setOverrideData] = useState({
    new_status: 'present',
    reason: '',
    remarks: '',
  });
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [selectedCompanyId, selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      let url = `/api/attendance?date=${selectedDate}`;
      if (selectedCompanyId) url += `&companyId=${selectedCompanyId}`;
      const res = await api.get(url);
      if (res && res.data) setRecords(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (record) => {
    setSelectedRecord(record);
    setOverrideData({
      new_status: record.status === 'present' ? 'late' : 'present',
      reason: '',
      remarks: '',
    });
    setOverrideOpen(true);
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!overrideData.reason.trim()) {
      showToast('Mandatory audit reason required', 'error');
      return;
    }
    setSavingOverride(true);
    try {
      await api.post('/api/attendance/override', {
        attendance_id: selectedRecord.id,
        ...overrideData,
      });
      showToast('Attendance status successfully overridden and logged in audit', 'success');
      setOverrideOpen(false);
      loadAttendance();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingOverride(false);
    }
  };

  const columns = [
    {
      field: 'student_name',
      headerName: 'Student Name & ID',
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
            {row.student_name}
          </Typography>
          <Chip label={row.student_id_code} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#F1F5F9' }} />
        </Box>
      ),
    },
    {
      field: 'check_in_time',
      headerName: 'Check-In Time',
      minWidth: 150,
      renderCell: ({ value }) => (value ? dayjs(value).format('hh:mm A') : '—'),
    },
    {
      field: 'check_out_time',
      headerName: 'Check-Out Time',
      minWidth: 150,
      renderCell: ({ value }) => (value ? dayjs(value).format('hh:mm A') : '—'),
    },
    {
      field: 'distance_meters',
      headerName: 'Geofence Distance',
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {row.is_flagged ? (
            <Tooltip title={row.flag_reason || 'Outside campus geofence boundary'}>
              <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 18 }} />
            </Tooltip>
          ) : (
            <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 18 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.distance_meters !== null ? `${row.distance_meters} m` : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            (±{row.gps_accuracy}m)
          </Typography>
        </Box>
      ),
    },
    {
      field: 'server_ip',
      headerName: 'Server Observed IP',
      minWidth: 160,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontSize: '11px' }} />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 110,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'actions',
      headerName: 'Override',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
          onClick={() => handleOpenOverride(row)}
          sx={{ height: 30, fontSize: '12px' }}
        >
          Override
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Daily Attendance & Geofence Logs"
          subtitle="Real-time learner check-ins with Haversine GPS radius calculation, public IP logging, and authorized override audit trail."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Attendance' }]}
          action={
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{ bgcolor: '#FFFFFF', borderRadius: '10px' }}
            />
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={records}
            loading={loading}
            searchPlaceholder="Search attendance by student name, ID, or IP..."
          />
        </SectionCard>

        {/* Override Modal */}
        <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSaveOverride}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>
              Attendance Override & Mandatory Audit Log
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Updating attendance for: <strong>{selectedRecord?.student_name}</strong> on {selectedRecord?.date}.
                Original recorded status was: <strong>{selectedRecord?.status}</strong>.
              </Typography>

              <TextField
                select
                label="New Attendance Status"
                value={overrideData.new_status}
                onChange={(e) => setOverrideData({ ...overrideData, new_status: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="late">Late Arrival</MenuItem>
                <MenuItem value="half_day">Half Day</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
              </TextField>

              <TextField
                label="Mandatory Reason for Override"
                placeholder="e.g. Valid medical clinic slip provided / biometric sensor glitch"
                value={overrideData.reason}
                onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                required
                multiline
                rows={2}
                fullWidth
                size="small"
              />

              <TextField
                label="Additional Coordinator Remarks"
                value={overrideData.remarks}
                onChange={(e) => setOverrideData({ ...overrideData, remarks: e.target.value })}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOverrideOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={savingOverride}>
                {savingOverride ? 'Logging...' : 'Confirm & Log Audit'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
