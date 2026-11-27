'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

export default function StudentFeePortalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [account, setAccount] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Online Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('upi');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadMyFeeAccount();
  }, []);

  const loadMyFeeAccount = async () => {
    setLoading(true);
    try {
      const [accRes, rcptRes] = await Promise.all([
        api.get('/api/fees/accounts'),
        api.get('/api/fees/receipts'),
      ]);
      if (accRes && accRes.data && accRes.data.length > 0) {
        setAccount(accRes.data[0]);
        setPayAmount(String(accRes.data[0].outstanding_balance));
      }
      if (rcptRes && rcptRes.data) {
        setReceipts(rcptRes.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnline = async (e) => {
    e.preventDefault();
    if (!account) return;
    setPaying(true);
    try {
      await api.post('/api/fees/collect', {
        student_id: account.student_id,
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        reference_number: 'ONLINE/RZP/' + Math.floor(100000 + Math.random() * 900000),
        remarks: 'Student Online Portal Payment',
      });
      showToast('Payment successful! Your official receipt is ready for download.', 'success');
      setPayModalOpen(false);
      loadMyFeeAccount();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const outstanding = Number(account?.outstanding_balance || 0);

  return (
    <StudentLayout>
      <PageContainer>
        <PageHeader
          title="My Fee Account & Installments"
          subtitle="View tuition schedules, outstanding ledger balances, payment history, and download authenticated PDF receipts."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'My Fees' }]}
        />

        <Grid container spacing={3}>
          {/* Account Overview Cards */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: '#0B2A5B',
                color: '#FFFFFF',
                boxShadow: '0 8px 32px rgba(11, 42, 91, 0.15)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 600 }}>
                NET OUTSTANDING BALANCE
              </Typography>
              <Typography variant="h1" sx={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 800, my: 1 }}>
                ₹{outstanding.toLocaleString()}
              </Typography>
              <StatusChip status={account?.status || 'pending'} />

              <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.15)' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#93C5FD' }}>Total Program Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{Number(account?.base_fee || 0).toLocaleString()}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#93C5FD' }}>Scholarship / Discount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#86EFAC' }}>
                  - ₹{Number(account?.total_discount || 0).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#93C5FD' }}>Total Paid to Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#86EFAC' }}>
                  ₹{Number(account?.total_paid || 0).toLocaleString()}
                </Typography>
              </Box>

              {outstanding > 0 ? (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PaymentIcon />}
                  onClick={() => setPayModalOpen(true)}
                  sx={{ bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#2563EB' }, fontWeight: 700, height: 42 }}
                >
                  Pay Outstanding Online
                </Button>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', py: 1 }}>
                  <CheckCircleIcon sx={{ color: '#86EFAC' }} />
                  <Typography variant="body2" sx={{ color: '#86EFAC', fontWeight: 700 }}>
                    100% Fee Cleared
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Installment Schedule */}
          <Grid item xs={12} md={8}>
            <SectionCard title="Configured Milestone Installment Schedule">
              {account?.installments && account.installments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {account.installments.map((inst) => (
                    <Box
                      key={inst.id}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: inst.status === 'paid' ? '#DCFCE7' : inst.status === 'overdue' ? '#FEE2E2' : '#F8FAFC',
                        border: '1px solid #E3EAF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
                          Installment {inst.number}: {inst.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Due Date: {dayjs(inst.due_date).format('DD MMMM YYYY')}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F1B33' }}>
                          ₹{Number(inst.due_amount).toLocaleString()}
                        </Typography>
                        <StatusChip status={inst.status} size="small" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No installment schedules registered.
                </Typography>
              )}
            </SectionCard>
          </Grid>

          {/* Payment Receipts History */}
          <Grid item xs={12}>
            <SectionCard title="Official Payment Receipts">
              {receipts && receipts.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {receipts.map((rcpt) => (
                    <Box
                      key={rcpt.id}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E3EAF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
                          Receipt: {rcpt.receipt_number}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Paid on {dayjs(rcpt.payment_date).format('DD MMM YYYY')} via {rcpt.payment_method?.toUpperCase()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{ color: '#16A34A', fontWeight: 800 }}>
                          ₹{Number(rcpt.amount).toLocaleString()}
                        </Typography>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<FileDownloadIcon />}
                          href={`/api/fees/receipts/${rcpt.id}/pdf`}
                          download
                        >
                          Download PDF
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No payment receipts recorded yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>
        </Grid>

        {/* Pay Online Dialog */}
        <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handlePayOnline}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>
              Online Fee Payment (Razorpay Mock)
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Payment Amount (INR)"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                fullWidth
                size="small"
              />

              <TextField
                select
                label="Payment Method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="upi">UPI / Instant QR</MenuItem>
                <MenuItem value="card">Credit / Debit Card</MenuItem>
                <MenuItem value="net_banking">Net Banking (All Indian Banks)</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={paying}>
                {paying ? 'Processing...' : `Pay ₹${payAmount}`}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </StudentLayout>
  );
}
