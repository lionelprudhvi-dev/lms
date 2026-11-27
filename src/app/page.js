'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        if (user.user_type === 'student') {
          router.push('/student/dashboard');
        } else if (user.user_type === 'trainer') {
          router.push('/trainer/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }
    }
  }, [user, loading, router]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#F5F8FD' }}>
      <CircularProgress size={40} sx={{ color: '#1D4ED8' }} />
    </Box>
  );
}
