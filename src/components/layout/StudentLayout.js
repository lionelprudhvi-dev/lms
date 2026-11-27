'use client';

import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Chip,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CampaignIcon from '@mui/icons-material/Campaign';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/context/AuthContext';

const studentNav = [
  { label: 'Dashboard', href: '/student/dashboard', icon: DashboardIcon },
  { label: 'My Courses', href: '/student/courses', icon: AutoStoriesIcon },
  { label: 'My Attendance', href: '/student/attendance', icon: AccessTimeIcon },
  { label: 'My Exams', href: '/student/exams', icon: QuizIcon },
  { label: 'My Results', href: '/student/results', icon: QuizIcon },
  { label: 'My Certificates', href: '/student/certificates', icon: WorkspacePremiumIcon },
  { label: 'My Fees', href: '/student/fees', icon: AccountBalanceWalletIcon },
  { label: 'Announcements', href: '/student/announcements', icon: CampaignIcon },
];

export default function StudentLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F8FD', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E3EAF5',
          color: '#0F1B33',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 }, height: 68, gap: 2 }}>
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 3 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#FFFFFF',
                fontSize: '18px',
              }}
            >
              A
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#0B2A5B', fontWeight: 700, fontSize: '15px' }}>
                APEX LEARNER
              </Typography>
              <Chip label="Student Portal" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#EAF2FF', color: '#1D4ED8' }} />
            </Box>
          </Box>

          {/* Nav links for desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {studentNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  component={Link}
                  href={item.href}
                  startIcon={<Icon sx={{ fontSize: '18px !important' }} />}
                  sx={{
                    color: active ? '#1D4ED8' : '#5B6B88',
                    bgcolor: active ? '#EAF2FF' : 'transparent',
                    fontWeight: active ? 600 : 500,
                    borderRadius: '8px',
                    px: 1.5,
                    height: 38,
                    '&:hover': { bgcolor: active ? '#EAF2FF' : '#F1F5F9' },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Profile & Logout */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#1D4ED8', fontSize: '14px', fontWeight: 700 }}>
                {user?.first_name ? user.first_name[0] : 'S'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user?.student?.student_id_code || 'Student'}
                </Typography>
              </Box>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={logout} sx={{ color: '#DC2626' }}>
                <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
