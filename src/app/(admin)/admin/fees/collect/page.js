'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Card,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function FeeCollectionDeskPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    amount: '',
    payment_method: 'upi',
    reference_number: '',
    remarks: 'Tuition Fee Payment',
    installment_id: '',
  });

  useEffect(() => {
    loadStudents();
  }, [selectedCompanyId]);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const url = selectedCompanyId ? `/api/fees/accounts?companyId=${selectedCompanyId}` : '/api/fees/accounts';
      const res = await api.get(url);
      if (res && res.data) setStudents(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    const found = students.find((s) => s.student_id === studentId || s.id === studentId);
    setSelectedStudent(found || null);
    setPaymentForm((prev) => ({
      ...prev,
      student_id: studentId,
      amount: found ? String(found.outstanding_balance) : '',
    }));
    setReceiptResult(null);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.student_id || !paymentForm.amount) {
      showToast('Select a student and enter a payment amount', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/fees/collect', paymentForm);
      showToast('Payment confirmed and receipt generated!', 'success');
      setReceiptResult(res.data?.receipt || null);
      loadStudents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer maxWidth="1100px">
        <PageHeader
          title="Fee Collection Desk"
          subtitle="Process offline and online fee collections, auto-allocate to installments, and instantly issue authenticated PDF receipts."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees' }, { label: 'Collect' }]}
        />

        <Grid container spacing={3}>
          {/* Collection Form */}
          <Grid item xs={12} md={7}>
            <SectionCard title="Record Fee Payment">
              <form onSubmit={handleProcessPayment}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    select
                    label="Search / Select Student"
                    value={paymentForm.student_id}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    required
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">-- Select Student Learner --</MenuItem>
                    {students.map((s) => (
                      <MenuItem key={s.student_id} value={s.student_id}>
                        {s.student_name} ({s.student_id_code}) &bull; Due: ₹{Number(s.outstanding_balance).toLocaleString()}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Payment Amount (INR)"
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        required
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Payment Mode"
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        required
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="upi">UPI / QR Code</MenuItem>
                        <MenuItem value="cash">Cash in Hand</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer (NEFT/RTGS)</MenuItem>
                        <MenuItem value="cheque">Cheque / Demand Draft</MenuItem>
                        <MenuItem value="card">Credit / Debit Card</MenuItem>
                        <MenuItem value="payment_gateway">Online Payment Gateway</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  <TextField
                    label="Transaction / Reference / Cheque No."
                    placeholder="e.g. UPI/2026/89410291 or Cheque #00412"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    fullWidth
                    size="small"
                  />

                  <TextField
                    label="Internal Ledger Remarks"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PointOfSaleIcon />}
                    disabled={submitting}
                    sx={{ height: 44, bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#0B2A5B' }, fontWeight: 700 }}
                  >
                    {submitting ? 'Processing Transaction...' : 'Confirm Payment & Issue Receipt'}
                  </Button>
                </Box>
              </form>
            </SectionCard>
          </Grid>

          {/* Student Ledger Summary / Receipt Output */}
          <Grid item xs={12} md={5}>
            {receiptResult ? (
              <Card
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #86EFAC',
                  boxShadow: '0 8px 24px rgba(22, 163, 74, 0.1)',
                  textAlign: 'center',
                }}
              >
                <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 52, mb: 1 }} />
                <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '20px', fontWeight: 700 }}>
                  Payment Realized
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Official Receipt: <strong>{receiptResult.receipt_number}</strong>
                </Typography>

                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', mb: 3, textAlign: 'left' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Student</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{receiptResult.student_name}</Typography>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Amount Paid</Typography>
                  <Typography variant="h4" sx={{ color: '#1D4ED8', fontWeight: 700, mb: 1 }}>
                    ₹{Number(receiptResult.amount).toLocaleString()}
                  </Typography>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Current Net Outstanding</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                    ₹{Number(receiptResult.current_outstanding).toLocaleString()}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  href={`/api/fees/receipts/${receiptResult.id}/pdf`}
                  download
                  fullWidth
                  sx={{ height: 42, bgcolor: '#1D4ED8', fontWeight: 700 }}
                >
                  Download Official PDF Receipt
                </Button>
              </Card>
            ) : selectedStudent ? (
              <SectionCard title="Learner Ledger Account">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#0B2A5B', fontWeight: 700, fontSize: '18px' }}>
                      {selectedStudent.student_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedStudent.student_id_code} &bull; {selectedStudent.course_name}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: '#E3EAF5' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Base Fee</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{Number(selectedStudent.base_fee).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Discount Granted</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#16A34A' }}>
                      - ₹{Number(selectedStudent.total_discount || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Net Payable Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      ₹{Number(selectedStudent.net_payable).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Paid to Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                      ₹{Number(selectedStudent.total_paid).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: '#FEE2E2', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                      Outstanding Due:
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#B91C1C' }}>
                      ₹{Number(selectedStudent.outstanding_balance).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </SectionCard>
            ) : (
              <SectionCard>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Select a student from the dropdown to preview their fee ledger balance and installments.
                </Typography>
              </SectionCard>
            )}
          </Grid>
        </Grid>
      </PageContainer>
    </AdminLayout>
  );
}
