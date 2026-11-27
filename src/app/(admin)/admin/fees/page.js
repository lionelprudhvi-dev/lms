'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import Link from 'next/link';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#1D4ED8', '#0B2A5B', '#16A34A', '#D97706', '#9333EA', '#0EA5E9'];

export default function FeeDashboardPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeeDashboard();
  }, [selectedCompanyId]);

  const loadFeeDashboard = async () => {
    setLoading(true);
    try {
      let url = '/api/fees/dashboard';
      if (selectedCompanyId) url += `?companyId=${selectedCompanyId}`;
      const res = await api.get(url);
      if (res && res.data) setData(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {};
  const monthlyTrend = data?.monthlyTrend || [];
  const paymentMethods = data?.paymentMethods || [];
  const courseBreakdown = data?.courseBreakdown || [];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Fee Management & Collection Dashboard"
          subtitle="Real-time financial collection metrics, outstanding receivables, installment statuses, and cash flow trends."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Fees & Finance' }]}
          action={
            <Button
              component={Link}
              href="/admin/fees/collect"
              variant="contained"
              startIcon={<PointOfSaleIcon />}
              sx={{ bgcolor: '#1D4ED8', '&:hover': { bgcolor: '#0B2A5B' } }}
            >
              Fee Collection Desk
            </Button>
          }
        />

        {/* Top KPI Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Fees Assigned"
              value={`₹${(kpis.totalAssigned || 0).toLocaleString()}`}
              subtitle={`${kpis.accountCounts?.total || 0} student accounts`}
              icon={AccountBalanceWalletIcon}
              color="#0B2A5B"
              bgColor="#F1F5F9"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Collected"
              value={`₹${(kpis.totalCollected || 0).toLocaleString()}`}
              subtitle={`${kpis.collectionPercentage || 0}% collection rate`}
              icon={PaymentsIcon}
              color="#16A34A"
              bgColor="#DCFCE7"
              trend={`+${kpis.collectionPercentage || 0}%`}
              trendType="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Net Outstanding"
              value={`₹${(kpis.totalOutstanding || 0).toLocaleString()}`}
              subtitle="Pending collection balance"
              icon={TrendingUpIcon}
              color="#1D4ED8"
              bgColor="#EAF2FF"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Overdue Dues"
              value={`₹${(kpis.totalOverdue || 0).toLocaleString()}`}
              subtitle={`${kpis.accountCounts?.overdue || 0} overdue accounts`}
              icon={WarningAmberIcon}
              color="#DC2626"
              bgColor="#FEE2E2"
            />
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3}>
          {/* Monthly Trend */}
          <Grid item xs={12} md={8}>
            <SectionCard title="Monthly Fee Collection Trend (INR)">
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#5B6B88" fontSize={12} />
                    <YAxis
                      stroke="#5B6B88"
                      fontSize={12}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Collection']}
                      contentStyle={{ borderRadius: 10, borderColor: '#E3EAF5' }}
                    />
                    <Bar dataKey="collected" fill="#1D4ED8" radius={[6, 6, 0, 0]} name="Collected" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </SectionCard>
          </Grid>

          {/* Payment Methods Distribution */}
          <Grid item xs={12} md={4}>
            <SectionCard title="Payment Method Breakdown">
              <Box sx={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      dataKey="total_amount"
                      nameKey="payment_method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {paymentMethods.map((m, idx) => (
                  <Box key={m.payment_method} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {m.payment_method.replace(/_/g, ' ')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F1B33' }}>
                      ₹{Number(m.total_amount).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </SectionCard>
          </Grid>

          {/* Program Wise Allocation */}
          <Grid item xs={12}>
            <SectionCard title="Course-wise Fee Realization">
              <Grid container spacing={2}>
                {courseBreakdown.map((item) => {
                  const total = Number(item.collected) + Number(item.outstanding);
                  const pct = total > 0 ? Math.round((Number(item.collected) / total) * 100) : 0;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={item.course_name}>
                      <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E3EAF5' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B', mb: 1 }}>
                          {item.course_name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Realization</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16A34A' }}>
                            {pct}% (₹{Number(item.collected).toLocaleString()})
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#1D4ED8' } }}
                        />
                        <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', mt: 1, fontWeight: 600 }}>
                          Outstanding: ₹{Number(item.outstanding).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </AdminLayout>
  );
}
