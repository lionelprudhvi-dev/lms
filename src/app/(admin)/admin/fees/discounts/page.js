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
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DiscountIcon from '@mui/icons-material/Discount';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function DiscountsPage() {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    discount_type: 'scholarship',
    discount_value: 5000,
    reason: '',
  });

  useEffect(() => {
    loadDiscounts();
    loadStudents();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/fees/discounts');
      if (res && res.data) setDiscounts(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get('/api/fees/accounts');
      if (res && res.data) setStudents(res.data);
    } catch (e) {
      // silent
    }
  };

  const handleGrantDiscount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/fees/discounts', formData);
      showToast('Fee discount/scholarship approved and applied to student account!', 'success');
      setDialogOpen(false);
      loadDiscounts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
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
    {
      field: 'discount_type',
      headerName: 'Concession Category',
      minWidth: 160,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
          {value?.replace(/_/g, ' ')}
        </Typography>
      ),
    },
    {
      field: 'calculated_amount',
      headerName: 'Concession Amount',
      minWidth: 150,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
          ₹{Number(value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'reason',
      headerName: 'Justification & Audit',
      minWidth: 260,
      renderCell: ({ value, row }) => (
        <Box>
          <Typography variant="body2">{value}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Approved by: {row.approver_first_name} on {dayjs(row.created_at).format('DD MMM YYYY')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 110,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Fee Discounts & Scholarships"
          subtitle="Manage merit scholarships, hardship waivers, corporate concessions, and administrative discount audit approvals."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Discounts' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Grant Discount / Scholarship
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={discounts}
            loading={loading}
            searchPlaceholder="Search discounts by student, reason..."
          />
        </SectionCard>

        {/* Grant Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleGrantDiscount}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Grant Fee Concession</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Student Account"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Select Student --</MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.student_id} value={s.student_id}>
                    {s.student_name} ({s.student_id_code}) &bull; Due: ₹{Number(s.outstanding_balance).toLocaleString()}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Concession Type"
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="scholarship">Merit Academic Scholarship</MenuItem>
                <MenuItem value="management_concession">Management Hardship Concession</MenuItem>
                <MenuItem value="promotional">Early Bird / Promotional Discount</MenuItem>
                <MenuItem value="fixed">Fixed Waiver</MenuItem>
              </TextField>

              <TextField
                label="Concession Amount (INR)"
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                required
                fullWidth
                size="small"
              />

              <TextField
                label="Mandatory Approval Justification"
                placeholder="e.g. 95% entrance score achieved; validated by Dean committee"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Approving...' : 'Apply Concession'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
