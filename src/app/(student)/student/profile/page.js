'use client';

import React from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import {
  Box,
  Typography,
  Grid,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import { useAuth } from '@/context/AuthContext';

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <StudentLayout>
      <PageContainer>
        <PageHeader
          title="Student Profile"
          subtitle="Personal identity details, enrolled batch credentials, and emergency contact details."
        />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <SectionCard>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: '#1D4ED8',
                    color: '#FFFFFF',
                    fontSize: '36px',
                    fontWeight: 700,
                    mb: 2,
                    boxShadow: '0 4px 16px rgba(29,78,216,0.3)',
                  }}
                >
                  {user?.first_name ? user.first_name[0] : 'S'}
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '20px', color: '#0B2A5B', mb: 0.5 }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5B6B88', mb: 1.5 }}>
                  {user?.email}
                </Typography>
                <Chip
                  label="Enrolled Student"
                  sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600, borderRadius: '8px' }}
                />
              </Box>
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={8}>
            <SectionCard title="Academic & Personal Information">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                      FIRST NAME
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0B2A5B', mt: 0.5 }}>
                      {user?.first_name || 'Rahul'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                      LAST NAME
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0B2A5B', mt: 0.5 }}>
                      {user?.last_name || 'Sharma'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                      EMAIL ADDRESS
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0B2A5B', mt: 0.5 }}>
                      {user?.email || 'student@apex.com'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                      ORGANIZATION
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0B2A5B', mt: 0.5 }}>
                      {user?.organization_name || 'Apex Global Education'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                      PHONE NUMBER
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0B2A5B', mt: 0.5 }}>
                      {user?.phone || '+91 9876543210'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #E3EAF5', borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 600 }}>
                      ACCOUNT STATUS
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label="Active / Good Standing" size="small" sx={{ bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 700 }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </StudentLayout>
  );
}
