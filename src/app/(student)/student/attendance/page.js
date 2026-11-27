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
  Button,
  Grid,
  Card,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoCoords, setGeoCoords] = useState(null);

  useEffect(() => {
    loadMyAttendance();
    // Warm up geolocation
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: Math.round(pos.coords.accuracy),
          });
        },
        (err) => console.log('Location permission:', err.message)
      );
    }
  }, []);

  const loadMyAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/attendance');
      if (res && res.data) {
        setHistory(res.data);
        const todayStr = dayjs().format('YYYY-MM-DD');
        const found = res.data.find((r) => r.date === todayStr);
        setTodayRecord(found || null);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const res = await api.post('/api/attendance/check-in', {
            latitude,
            longitude,
            gps_accuracy: Math.round(accuracy),
            device_info: navigator.userAgent,
          });
          showToast(res.message || 'Check-in recorded successfully!', 'success');
          loadMyAttendance();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          setCheckingIn(false);
        }
      },
      (err) => {
        setCheckingIn(false);
        showToast(`Location error: ${err.message}. Please allow GPS location permissions in your browser.`, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await api.post('/api/attendance/check-out');
      showToast('Check-out recorded successfully!', 'success');
      loadMyAttendance();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <StudentLayout>
      <PageContainer maxWidth="1100px">
        <PageHeader
          title="Daily Attendance & Campus Check-in"
          subtitle="Record your daily verified presence on campus using verified mobile GPS location."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'My Attendance' }]}
        />

        <Grid container spacing={3}>
          {/* Main Action Card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: '16px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E3EAF5',
                boxShadow: '0 4px 24px rgba(11, 42, 91, 0.06)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: todayRecord ? '#DCFCE7' : '#EAF2FF',
                  color: todayRecord ? '#16A34A' : '#1D4ED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                {todayRecord ? <CheckCircleIcon sx={{ fontSize: 36 }} /> : <MyLocationIcon sx={{ fontSize: 36 }} />}
              </Box>

              <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '20px', fontWeight: 700, mb: 0.5 }}>
                {todayRecord ? "Today's Attendance Recorded" : 'Ready to Check In'}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {todayRecord
                  ? `Checked in at ${dayjs(todayRecord.check_in_time).format('hh:mm A')} (${todayRecord.status.toUpperCase()})`
                  : 'Please be within approved campus premises to confirm your GPS location.'}
              </Typography>

              {/* Status details if checked in */}
              {todayRecord ? (
                <Box sx={{ width: '100%', mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E3EAF5' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{todayRecord.date}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Check-in</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{dayjs(todayRecord.check_in_time).format('hh:mm A')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Check-out</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {todayRecord.check_out_time ? dayjs(todayRecord.check_out_time).format('hh:mm A') : 'Pending'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Campus Distance</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {todayRecord.distance_meters !== null ? `${todayRecord.distance_meters}m` : '0m'}
                    </Typography>
                  </Box>
                </Box>
              ) : null}

              {/* Buttons */}
              {!todayRecord ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={checkingIn ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  sx={{
                    width: '100%',
                    height: 48,
                    fontSize: '15px',
                    fontWeight: 700,
                    bgcolor: '#1D4ED8',
                    '&:hover': { bgcolor: '#0B2A5B' },
                  }}
                >
                  {checkingIn ? 'Verifying GPS Location...' : 'Check In Now'}
                </Button>
              ) : !todayRecord.check_out_time ? (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={checkingOut ? <CircularProgress size={18} color="inherit" /> : <AccessTimeIcon />}
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  sx={{ width: '100%', height: 48, fontSize: '15px', fontWeight: 600 }}
                >
                  {checkingOut ? 'Checking out...' : 'Check Out for Today'}
                </Button>
              ) : (
                <Alert severity="success" sx={{ width: '100%', borderRadius: '10px' }}>
                  Full day attendance completed!
                </Alert>
              )}

              {geoCoords && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2, display: 'block' }}>
                  GPS: {geoCoords.lat.toFixed(4)}, {geoCoords.lng.toFixed(4)} (Acc: ±{geoCoords.acc}m)
                </Typography>
              )}
            </Card>
          </Grid>

          {/* History List */}
          <Grid item xs={12} md={7}>
            <SectionCard title="Recent Attendance Records">
              {history && history.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {history.slice(0, 7).map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E3EAF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
                          {dayjs(item.date).format('dddd, DD MMMM YYYY')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          In: {item.check_in_time ? dayjs(item.check_in_time).format('hh:mm A') : '—'} &bull; Out:{' '}
                          {item.check_out_time ? dayjs(item.check_out_time).format('hh:mm A') : '—'}
                        </Typography>
                      </Box>
                      <StatusChip status={item.status} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No attendance history logged yet.
                </Typography>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
