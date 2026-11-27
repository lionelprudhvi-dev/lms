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
import ReplayIcon from '@mui/icons-material/Replay';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dayjs from 'dayjs';

export default function RefundsPage() {
  const { showToast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    payment_id: '',
    amount: '',
    reason: '',
    refund_method: 'bank_transfer',
    reference_number: '',
  });

  useEffect(() => {
    loadRefunds();
    loadPayments();
  }, []);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/fees/refunds');
      if (res && res.data) setRefunds(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await api.get('/api/fees/receipts');
      if (res && res.data) setPayments(res.data);
    } catch (e) {
      // silent
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/fees/refunds', formData);
      showToast('Fee refund processed and financial ledger updated!', 'success');
      setDialogOpen(false);
      loadRefunds();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'refund_number',
      headerName: 'Refund Ref & Date',
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
            {row.refund_number}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {dayjs(row.created_at).format('DD MMM YYYY hh:mm A')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'student_name',
      headerName: 'Student Beneficiary',
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.student_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.student_id_code}</Typography>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Refund Amount',
      minWidth: 140,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
          ₹{Number(value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'refund_method',
      headerName: 'Method & Ref',
      minWidth: 160,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ textTransform: 'uppercase', fontSize: '12px' }}>
            {row.refund_method}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.reference_number || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'reason',
      headerName: 'Audit Reason',
      minWidth: 240,
      renderCell: ({ value }) => value,
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
          title="Fee Refunds & Ledger Reversals"
          subtitle="Process duplicate payment corrections, withdrawal refunds, and financial cancellations linked to original receipts."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Refunds' }]}
          action={
            <Button variant="contained" startIcon={<ReplayIcon />} onClick={() => setDialogOpen(true)}>
              Issue Fee Refund
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={refunds}
            loading={loading}
            searchPlaceholder="Search refunds by reference, student..."
          />
        </SectionCard>

        {/* Process Refund Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleProcessRefund}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Issue Fee Refund</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Select Original Payment"
                value={formData.payment_id}
                onChange={(e) => setFormData({ ...formData, payment_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Select Confirmed Payment Receipt --</MenuItem>
                {payments.map((p) => (
                  <MenuItem key={p.payment_id} value={p.payment_id}>
                    {p.receipt_number} &bull; {p.student_name} (₹{Number(p.amount).toLocaleString()})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Refund Amount (INR)"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <TextField
                select
                label="Refund Mode"
                value={formData.refund_method}
                onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</MenuItem>
                <MenuItem value="upi">UPI Reversal</MenuItem>
                <MenuItem value="cheque">Accounts Cheque</MenuItem>
                <MenuItem value="cash">Cash Voucher</MenuItem>
              </TextField>

              <TextField
                label="Bank Reference / UTR Number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                fullWidth
                size="small"
              />

              <TextField
                label="Mandatory Audit Reason"
                placeholder="e.g. Duplicate payment realization / Authorized admission withdrawal"
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
              <Button type="submit" variant="contained" sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }} disabled={saving}>
                {saving ? 'Processing...' : 'Process Refund'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
