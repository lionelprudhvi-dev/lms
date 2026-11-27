'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Skeleton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import PaymentsIcon from '@mui/icons-material/Payments';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import HubIcon from '@mui/icons-material/Hub';
import BoltIcon from '@mui/icons-material/Bolt';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const fadeSlideKeyframes = {
  '@keyframes fadeSlideUp': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'fadeSlideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompanyId, selectedCompany } = useCompany();

  const [chartView, setChartView] = useState('courses');
  const [stats, setStats] = useState({
    companies: 0,
    students: 0,
    trainers: 0,
    courses: 0,
    batches: 0,
    attendanceRate: 0,
    presentCount: 0,
    totalAttendance: 0,
    exams: 0,
    certificates: 0,
    ipAlerts: 0,
    feesCollected: 0,
    feesOutstanding: 0,
    feesAssigned: 0,
    feesOverdue: 0,
    todayCollection: 0,
    collectionPercentage: 0,
    accountCounts: { total: 0, paid: 0, partial: 0, overdue: 0 },
  });
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [ipAlerts, setIpAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [selectedCompanyId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const compParam = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const [compRes, stuRes, trnRes, crsRes, batRes, attRes, exRes, certRes, feeRes, ipRes] =
        await Promise.all([
          api.get('/api/companies'),
          api.get(`/api/students${compParam}`),
          api.get(`/api/trainers${compParam}`),
          api.get(`/api/courses${compParam}`),
          api.get(`/api/batches${compParam}`),
          api.get(`/api/attendance${compParam}`),
          api.get(`/api/exams${compParam}`),
          api.get(`/api/certificates${compParam}`),
          api.get(`/api/fees/dashboard${compParam}`),
          api.get(`/api/attendance/ip-matches${compParam}`),
        ]);

      const stuList = stuRes?.data || [];
      const attList = attRes?.data || [];
      const presentCount = attList.filter((a) => a.status === 'present').length;
      const attRate = attList.length > 0 ? Math.round((presentCount / attList.length) * 100) : 0;

      const feeKpis = feeRes?.data?.kpis || {};
      const collected = Number(feeKpis.totalCollected || 0);
      const outstanding = Number(feeKpis.totalOutstanding || 0);
      const assigned = Number(feeKpis.totalAssigned || collected + outstanding);
      const collectionPct =
        feeKpis.collectionPercentage ??
        (assigned > 0 ? Math.round((collected / assigned) * 100) : 0);

      setStats({
        companies: compRes?.data?.length || 0,
        students: stuList.length,
        trainers: trnRes?.data?.length || 0,
        courses: crsRes?.data?.length || 0,
        batches: batRes?.data?.length || 0,
        attendanceRate: attRate,
        presentCount,
        totalAttendance: attList.length,
        exams: exRes?.data?.length || 0,
        certificates: certRes?.data?.length || 0,
        ipAlerts: ipRes?.data?.filter((m) => m.status === 'pending').length || 0,
        feesCollected: collected,
        feesOutstanding: outstanding,
        feesAssigned: assigned,
        feesOverdue: Number(feeKpis.totalOverdue || 0),
        todayCollection: Number(feeKpis.todayCollection || 0),
        collectionPercentage: collectionPct,
        accountCounts: feeKpis.accountCounts || { total: 0, paid: 0, partial: 0, overdue: 0 },
      });

      setCourseBreakdown(
        (feeRes?.data?.courseBreakdown || []).map((c) => ({
          name: c.course_name?.length > 18 ? `${c.course_name.slice(0, 18)}…` : c.course_name,
          collected: Number(c.collected || 0),
          outstanding: Number(c.outstanding || 0),
        }))
      );
      setPaymentMethods(
        (feeRes?.data?.paymentMethods || []).map((pm) => ({
          name: (pm.payment_method || 'Other').toUpperCase(),
          amount: Number(pm.total_amount || 0),
          count: Number(pm.count || 0),
        }))
      );
      setRecentStudents(stuList.slice(0, 5));
      setIpAlerts(ipRes?.data?.slice(0, 4) || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const feeBreakdownData = [
    { name: 'Collected', value: stats.feesCollected > 0 ? stats.feesCollected : 0, color: '#1D4ED8' },
    { name: 'Outstanding', value: stats.feesOutstanding > 0 ? stats.feesOutstanding : 0, color: '#DBEAFE' },
  ];
  const hasFeeData = stats.feesCollected > 0 || stats.feesOutstanding > 0;

  const quickOps = [
    { label: 'Companies', value: stats.companies, icon: BusinessIcon, href: '/admin/companies', color: '#0B2A5B', bg: '#E2E8F0' },
    { label: 'Trainers', value: stats.trainers, icon: RecordVoiceOverIcon, href: '/admin/trainers', color: '#1D4ED8', bg: '#EAF2FF' },
    { label: 'Courses', value: stats.courses, icon: AutoStoriesIcon, href: '/admin/courses', color: '#2563EB', bg: '#DBEAFE' },
    { label: 'Batches', value: stats.batches, icon: GroupsIcon, href: '/admin/batches', color: '#0284C7', bg: '#E0F2FE' },
    { label: 'Exams', value: stats.exams, icon: QuizIcon, href: '/admin/exams', color: '#D97706', bg: '#FEF3C7' },
    { label: 'Certificates', value: stats.certificates, icon: WorkspacePremiumIcon, href: '/admin/certificates', color: '#16A34A', bg: '#DCFCE7' },
    {
      label: 'IP Alerts',
      value: stats.ipAlerts,
      icon: WarningAmberIcon,
      href: '/admin/attendance/ip-matches',
      color: stats.ipAlerts > 0 ? '#DC2626' : '#16A34A',
      bg: stats.ipAlerts > 0 ? '#FEE2E2' : '#DCFCE7',
    },
  ];

  const quickWorkflows = [
    {
      title: 'Collect Student Fee',
      desc: 'Record payment & generate PDF receipt',
      icon: PaymentsIcon,
      href: '/admin/fees/collect',
      color: '#16A34A',
      bg: '#DCFCE7',
    },
    {
      title: 'Enroll New Student',
      desc: 'Assign batch, course & fee plan',
      icon: SchoolIcon,
      href: '/admin/students',
      color: '#1D4ED8',
      bg: '#EAF2FF',
    },
    {
      title: 'Attendance Override',
      desc: 'Audit-logged manual status update',
      icon: EditCalendarIcon,
      href: '/admin/attendance/overrides',
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      title: 'Issue Certificate',
      desc: 'Generate QR-verified PDF credential',
      icon: CardMembershipIcon,
      href: '/admin/certificates/generate',
      color: '#0B2A5B',
      bg: '#E2E8F0',
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        {/* Futuristic Executive Command Center Banner */}
        <Box
          sx={{
            ...fadeSlideKeyframes,
            p: { xs: '16px', md: '24px' },
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #071E44 0%, #0B2A5B 48%, #1D4ED8 100%)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(11, 42, 91, 0.22)',
          }}
        >
          {/* Futuristic subtle dot-matrix grid overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(147, 197, 253, 0.16) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 360,
              height: 360,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.32) 0%, rgba(59,130,246,0) 70%)',
              top: -150,
              right: -60,
              pointerEvents: 'none',
            }}
          />

          <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} lg={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<HubIcon sx={{ fontSize: '14px !important', color: '#93C5FD !important' }} />}
                  label="COMMAND CENTER"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.22)',
                    color: '#DBEAFE',
                    border: '1px solid rgba(147, 197, 253, 0.3)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontSize: '11px',
                  }}
                />
                <Chip
                  icon={<CalendarTodayIcon sx={{ fontSize: '13px !important', color: '#93C5FD !important' }} />}
                  label={dayjs().format('dddd, DD MMM YYYY')}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                    color: '#E0E7FF',
                    fontWeight: 600,
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <Chip
                  label={selectedCompany?.name || 'All Subsidiaries'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.14)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                />
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#4ADE80 !important' }} />}
                  label="Live Telemetry"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(74, 222, 128, 0.14)',
                    color: '#BBF7D0',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Typography
                variant="h1"
                sx={{
                  color: '#FFFFFF',
                  fontSize: { xs: '24px', md: '30px' },
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                }}
              >
                Welcome back, {user?.first_name || 'Admin'} {user?.last_name || ''}
              </Typography>
              <Typography variant="body1" sx={{ color: '#DBEAFE', mt: 0.75, maxWidth: 620, lineHeight: 1.6 }}>
                Real-time enterprise overview across student enrollments, GPS-verified attendance, examination results, and fee collections.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href="/admin/fees/collect"
                  variant="contained"
                  startIcon={<PaymentsIcon />}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#0B2A5B',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
                    '&:hover': { bgcolor: '#EAF2FF', transform: 'translateY(-2px)' },
                  }}
                >
                  Collect Fee
                </Button>
                <Button
                  component={Link}
                  href="/admin/students"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{
                    color: '#FFFFFF',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.22)', borderColor: '#FFFFFF' },
                  }}
                >
                  Enroll Student
                </Button>
                <Button
                  component={Link}
                  href="/admin/attendance/ip-matches"
                  variant="outlined"
                  startIcon={<VerifiedUserIcon />}
                  sx={{
                    color: '#FFFFFF',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.22)', borderColor: '#FFFFFF' },
                  }}
                >
                  IP Alerts ({stats.ipAlerts})
                </Button>
              </Box>
            </Grid>

            {/* Right Glassmorphic Telemetry Pod */}
            <Grid item xs={12} lg={4}>
              <Box
                sx={{
                  p: { xs: '16px', md: '24px' },
                  borderRadius: '16px',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(147, 197, 253, 0.28)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <BoltIcon sx={{ fontSize: 16, color: '#93C5FD' }} />
                    <Typography variant="caption" sx={{ color: '#DBEAFE', fontWeight: 700, letterSpacing: '0.06em' }}>
                      REVENUE TELEMETRY
                    </Typography>
                  </Box>
                  <Chip
                    icon={<TrendingUpIcon sx={{ fontSize: '14px !important', color: '#4ADE80 !important' }} />}
                    label={`${stats.collectionPercentage}%`}
                    size="small"
                    sx={{ bgcolor: 'rgba(74, 222, 128, 0.2)', color: '#FFFFFF', fontWeight: 800, height: 24 }}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, stats.collectionPercentage)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(255, 255, 255, 0.18)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #4ADE80 0%, #22C55E 100%)',
                      borderRadius: 5,
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#BFDBFE', display: 'block' }}>
                      Collected
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '18px' }}>
                      ₹{stats.feesCollected.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#BFDBFE', display: 'block' }}>
                      Outstanding
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FDE68A', fontSize: '18px' }}>
                      ₹{stats.feesOutstanding.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Primary 4 Live KPI Cards */}
        <Grid container spacing={3} sx={fadeSlideKeyframes}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Active Students"
              value={stats.students}
              subtitle={`${stats.batches} active cohorts`}
              icon={SchoolIcon}
              color="#1D4ED8"
              bgColor="#EAF2FF"
              loading={loading}
              onClick={() => router.push('/admin/students')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              subtitle={`${stats.presentCount} of ${stats.totalAttendance} logs present`}
              icon={AccessTimeIcon}
              color="#16A34A"
              bgColor="#DCFCE7"
              loading={loading}
              onClick={() => router.push('/admin/attendance')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Fee Collected"
              value={`₹${stats.feesCollected.toLocaleString()}`}
              subtitle={`Today: ₹${stats.todayCollection.toLocaleString()}`}
              icon={AccountBalanceWalletIcon}
              color="#16A34A"
              bgColor="#DCFCE7"
              loading={loading}
              onClick={() => router.push('/admin/fees')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Pending Dues"
              value={`₹${stats.feesOutstanding.toLocaleString()}`}
              subtitle={`Overdue: ₹${stats.feesOverdue.toLocaleString()}`}
              icon={AccountBalanceWalletIcon}
              color={stats.feesOutstanding > 0 ? '#D97706' : '#16A34A'}
              bgColor={stats.feesOutstanding > 0 ? '#FEF3C7' : '#DCFCE7'}
              loading={loading}
              onClick={() => router.push('/admin/fees/installments')}
            />
          </Grid>
        </Grid>

        {/* Operational Matrix Strip */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: '16px', md: '24px' },
            borderRadius: '16px',
            border: '1px solid #E3EAF5',
            bgcolor: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(11, 42, 91, 0.04)',
          }}
        >
          <Grid container spacing={2}>
            {quickOps.map((item) => {
              const Icon = item.icon;
              return (
                <Grid item xs={6} sm={4} md={12 / 7} key={item.label}>
                  <Box
                    component={Link}
                    href={item.href}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.25,
                      borderRadius: '12px',
                      border: '1px solid #E3EAF5',
                      bgcolor: '#FAFBFD',
                      textDecoration: 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: '#EAF2FF',
                        borderColor: '#60A5FA',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 20px rgba(29, 78, 216, 0.12)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '11px',
                        bgcolor: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1, overflow: 'hidden' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B2A5B', fontSize: '17px', lineHeight: 1.1 }}>
                        {loading ? '—' : item.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600, display: 'block' }} noWrap>
                        {item.label}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* Live Data Analytics Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <SectionCard
              title="Live Revenue & Payment Analytics"
              subtitle={
                chartView === 'courses'
                  ? 'Real-time collected vs outstanding fees grouped by course'
                  : 'Real-time fee collections grouped by payment channel'
              }
              action={
                <ToggleButtonGroup
                  size="small"
                  value={chartView}
                  exclusive
                  onChange={(e, val) => val && setChartView(val)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 1.5,
                      py: 0.5,
                      fontSize: '12px',
                      fontWeight: 600,
                      borderColor: '#E3EAF5',
                      color: '#5B6B88',
                      '&.Mui-selected': {
                        bgcolor: '#EAF2FF',
                        color: '#1D4ED8',
                        borderColor: '#93C5FD',
                      },
                    },
                  }}
                >
                  <ToggleButton value="courses">By Course</ToggleButton>
                  <ToggleButton value="methods">By Method</ToggleButton>
                </ToggleButtonGroup>
              }
            >
              <Box sx={{ width: '100%', height: 290 }}>
                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : chartView === 'courses' ? (
                  courseBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courseBreakdown} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF5" vertical={false} />
                        <XAxis dataKey="name" stroke="#5B6B88" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#5B6B88" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(val) => `₹${Number(val).toLocaleString()}`}
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #E3EAF5',
                            boxShadow: '0 10px 28px rgba(11,42,91,0.12)',
                          }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="collected" name="Collected (₹)" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="outstanding" name="Outstanding (₹)" fill="#93C5FD" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5B6B88' }}>
                      <Typography variant="body2">No course fee accounts recorded yet.</Typography>
                    </Box>
                  )
                ) : paymentMethods.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethods} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF5" vertical={false} />
                      <XAxis dataKey="name" stroke="#5B6B88" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#5B6B88" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(val) => `₹${Number(val).toLocaleString()}`}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #E3EAF5',
                          boxShadow: '0 10px 28px rgba(11,42,91,0.12)',
                        }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="amount" name="Collected Amount (₹)" fill="#16A34A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5B6B88' }}>
                    <Typography variant="body2">No payment transactions recorded yet.</Typography>
                  </Box>
                )}
              </Box>
            </SectionCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <SectionCard
              title="Fee Receivables & Accounts"
              subtitle={`${stats.accountCounts.total} student ledger accounts`}
              action={
                <Button component={Link} href="/admin/fees" size="small" endIcon={<ArrowForwardIcon />}>
                  Ledger
                </Button>
              }
            >
              <Box sx={{ position: 'relative', width: '100%', height: 215, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hasFeeData ? feeBreakdownData : [{ name: 'Empty', value: 1, color: '#E3EAF5' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={hasFeeData ? 4 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {(hasFeeData ? feeBreakdownData : [{ color: '#E3EAF5' }]).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    {hasFeeData && <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />}
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                  <Typography variant="h2" sx={{ fontWeight: 800, color: '#0B2A5B', fontSize: '22px', lineHeight: 1 }}>
                    {stats.collectionPercentage}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                    Collected
                  </Typography>
                </Box>
              </Box>

              {/* Real Account Status Pills */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
                <Chip label={`Paid: ${stats.accountCounts.paid}`} size="small" sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700 }} />
                <Chip label={`Partial: ${stats.accountCounts.partial}`} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 700 }} />
                <Chip label={`Overdue: ${stats.accountCounts.overdue}`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />
              </Box>
            </SectionCard>
          </Grid>
        </Grid>

        {/* Bottom Row: Quick Workflows + IP Alerts + Recent Enrollments */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <SectionCard title="Quick Admin Workflows" subtitle="One-click daily operational actions">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {quickWorkflows.map((wf) => {
                  const Icon = wf.icon;
                  return (
                    <Box
                      key={wf.title}
                      component={Link}
                      href={wf.href}
                      sx={{
                        p: 1.75,
                        borderRadius: '12px',
                        border: '1px solid #E3EAF5',
                        bgcolor: '#F8FAFD',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        textDecoration: 'none',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: '#FFFFFF',
                          borderColor: '#60A5FA',
                          transform: 'translateX(4px)',
                          boxShadow: '0 6px 18px rgba(29, 78, 216, 0.1)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: wf.bg,
                          color: wf.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B', display: 'block' }} noWrap>
                          {wf.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', lineHeight: 1.35, wordBreak: 'break-word' }}>
                          {wf.desc}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ fontSize: 18, color: '#94A3B8', flexShrink: 0 }} />
                    </Box>
                  );
                })}
              </Box>
            </SectionCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <SectionCard
              title="IP Match Alerts"
              subtitle="Shared public IPs queued for review"
              action={
                <Button component={Link} href="/admin/attendance/ip-matches" size="small" endIcon={<ArrowForwardIcon />}>
                  Review
                </Button>
              }
            >
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Skeleton variant="rounded" height={64} />
                  <Skeleton variant="rounded" height={64} />
                </Box>
              ) : ipAlerts.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {ipAlerts.map((alert) => (
                    <Box
                      key={alert.id}
                      sx={{
                        p: 2,
                        bgcolor: '#F8FAFD',
                        borderRadius: '12px',
                        border: '1px solid #E3EAF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B', display: 'block' }} noWrap>
                          {alert.student_a_name} &amp; {alert.student_b_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block', mt: 0.25 }} noWrap>
                          IP: <strong>{alert.ip_address}</strong> &bull; {dayjs(alert.date).format('DD MMM YYYY')}
                        </Typography>
                      </Box>
                      <StatusChip status={alert.status} size="small" />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <VerifiedUserIcon sx={{ fontSize: 44, color: '#16A34A', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B' }}>
                    All Clear
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5B6B88' }}>
                    No suspicious IP matching alerts detected.
                  </Typography>
                </Box>
              )}
            </SectionCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <SectionCard
              title="Recent Enrollments"
              subtitle="Latest learners onboarded"
              action={
                <Button component={Link} href="/admin/students" size="small" endIcon={<ArrowForwardIcon />}>
                  Directory
                </Button>
              }
            >
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Skeleton variant="rounded" height={60} />
                  <Skeleton variant="rounded" height={60} />
                  <Skeleton variant="rounded" height={60} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentStudents.map((s) => (
                    <Box
                      key={s.id}
                      sx={{
                        p: 1.75,
                        bgcolor: '#F8FAFD',
                        borderRadius: '12px',
                        border: '1px solid #E3EAF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#93C5FD', bgcolor: '#FFFFFF' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexGrow: 1, overflow: 'hidden' }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#1D4ED8', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                          {s.full_name ? s.full_name[0] : 'S'}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flexGrow: 1, overflow: 'hidden' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2A5B', display: 'block' }} noWrap>
                            {s.full_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#5B6B88', display: 'block' }} noWrap>
                            {s.student_id_code} &bull; {s.course_name || 'Enrolled'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <StatusChip status={s.fee_status || 'pending'} size="small" />
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.4,
                            fontWeight: 700,
                            color: Number(s.outstanding_balance || 0) > 0 ? '#DC2626' : '#16A34A',
                          }}
                        >
                          {Number(s.outstanding_balance || 0) > 0
                            ? `₹${Number(s.outstanding_balance).toLocaleString()} due`
                            : 'Cleared'}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </AdminLayout>
  );
}
