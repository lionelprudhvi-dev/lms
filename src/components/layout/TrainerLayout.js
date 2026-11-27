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
  Chip,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/context/AuthContext';

const trainerNav = [
  { label: 'Dashboard', href: '/trainer/dashboard', icon: DashboardIcon },
  { label: 'My Batches', href: '/trainer/batches', icon: GroupsIcon },
  { label: 'Students', href: '/trainer/students', icon: SchoolIcon },
  { label: 'Attendance', href: '/trainer/attendance', icon: AccessTimeIcon },
  { label: 'Materials', href: '/trainer/materials', icon: FolderIcon },
  { label: 'Assignments', href: '/trainer/assignments', icon: AssignmentIcon },
  { label: 'Exams', href: '/trainer/exams', icon: QuizIcon },
  { label: 'Performance', href: '/trainer/performance', icon: TrendingUpIcon },
];

export default function TrainerLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F8FD', display: 'flex', flexDirection: 'column' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 3 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#0B2A5B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#FFFFFF',
                fontSize: '18px',
              }}
            >
              T
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#0B2A5B', fontWeight: 700, fontSize: '15px' }}>
                APEX FACULTY
              </Typography>
              <Chip label="Trainer Portal" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#E0F2FE', color: '#0369A1' }} />
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {trainerNav.map((item) => {
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

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#0B2A5B', fontSize: '14px', fontWeight: 700 }}>
                {user?.first_name ? user.first_name[0] : 'T'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user?.trainer?.trainer_id_code || 'Faculty'}
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

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
