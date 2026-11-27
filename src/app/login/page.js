'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.user_type === 'student') {
        router.push('/student/dashboard');
      } else if (loggedUser.user_type === 'trainer') {
        router.push('/trainer/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#F5F8FD',
      }}
    >
      {/* Left Brand Panel with Blue Gradient */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0B2A5B 0%, #1D4ED8 100%)',
          p: 6,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
            top: -100,
            right: -100,
          }}
        />

        <Box sx={{ zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#FFFFFF',
                fontSize: '22px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              A
            </Box>
            <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '24px' }}>
              APEX LMS
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#93C5FD', letterSpacing: '0.08em', fontWeight: 600 }}>
            UNIFIED ENTERPRISE ACADEMIC & FINANCIAL PLATFORM
          </Typography>
        </Box>

        <Box sx={{ zIndex: 1, my: 6 }}>
          <Typography variant="h1" sx={{ color: '#FFFFFF', fontSize: '36px', fontWeight: 800, mb: 2, lineHeight: 1.25 }}>
            Empower Learners, Streamline Collections.
          </Typography>
          <Typography variant="body1" sx={{ color: '#E0E7FF', fontSize: '16px', lineHeight: 1.6, maxWidth: 500, mb: 4 }}>
            Class-leading education management engineered with real-time geofenced attendance, automated IP duplicate alerts, verifiable credentials, and multi-tier fee collection.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleOutlineIcon sx={{ color: '#93C5FD' }} />
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                High-precision GPS attendance with Haversine verification
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VerifiedUserIcon sx={{ color: '#93C5FD' }} />
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                Instant tamper-proof digital certificates & QR verification
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountBalanceWalletIcon sx={{ color: '#93C5FD' }} />
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                Automated student fee schedules, PDF receipts & installments
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#93C5FD' }}>
            &copy; 2026 Apex Global Education Group. All rights reserved.
          </Typography>
          <Link href="/verify/APEX-CERT-2026-98014" style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none' }}>
            Public Certificate Verification &rarr;
          </Link>
        </Box>
      </Box>

      {/* Right Login Card */}
      <Box
        sx={{
          flex: { xs: 1, md: 1 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Card
          sx={{
            maxWidth: 460,
            width: '100%',
            p: { xs: 3, sm: 4.5 },
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E3EAF5',
            boxShadow: '0 8px 32px rgba(11, 42, 91, 0.08)',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h2" sx={{ color: '#0B2A5B', fontWeight: 700, fontSize: '24px' }}>
              Sign In to Your Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Enter your credentials to access your organization dashboard.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              placeholder="name@apexlms.com"
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              placeholder="••••••••"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                height: 44,
                fontSize: '15px',
                fontWeight: 600,
                bgcolor: '#1D4ED8',
                mt: 1,
                '&:hover': { bgcolor: '#0B2A5B' },
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: '#E3EAF5' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
              DEMO QUICK FILL ACCOUNTS
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickFill('admin@apexlms.com', 'Admin@123')}
              sx={{ justifyContent: 'space-between', borderColor: '#E3EAF5', color: '#0F1B33', textTransform: 'none' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Org Admin</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>admin@apexlms.com</Typography>
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickFill('ait.admin@apexlms.com', 'Admin@123')}
              sx={{ justifyContent: 'space-between', borderColor: '#E3EAF5', color: '#0F1B33', textTransform: 'none' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Company Admin (AIT)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>ait.admin@apexlms.com</Typography>
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickFill('trainer.vikram@apexlms.com', 'Admin@123')}
              sx={{ justifyContent: 'space-between', borderColor: '#E3EAF5', color: '#0F1B33', textTransform: 'none' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Faculty / Trainer</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>trainer.vikram@apexlms.com</Typography>
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickFill('student.rahul@apexlms.com', 'Admin@123')}
              sx={{ justifyContent: 'space-between', borderColor: '#E3EAF5', color: '#0F1B33', textTransform: 'none' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Student (Rahul Sharma)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>student.rahul@apexlms.com</Typography>
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
