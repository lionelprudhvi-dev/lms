'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Select,
  FormControl,
  Divider,
  TextField,
  InputAdornment,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';

export default function AdminTopbar({ onMenuToggle }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { notifications, unreadCount, markAsRead } = useNotification();

  const [anchorUser, setAnchorUser] = useState(null);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const onStart = () => setNavigating(true);
    window.addEventListener('lms:route-start', onStart);
    return () => window.removeEventListener('lms:route-start', onStart);
  }, []);

  const handleOpenUser = (e) => setAnchorUser(e.currentTarget);
  const handleCloseUser = () => setAnchorUser(null);

  const handleOpenNotif = (e) => setAnchorNotif(e.currentTarget);
  const handleCloseNotif = () => setAnchorNotif(null);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        color: '#0F1B33',
        borderBottom: '1px solid #E3EAF5',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ height: 64, px: { xs: 2, md: 3 }, gap: 2 }}>
        {/* Mobile menu toggle */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuToggle}
          sx={{ display: { md: 'none' }, color: '#0B2A5B' }}
        >
          <MenuIcon />
        </IconButton>

        {/* Company Selector */}
        {companies && companies.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ color: '#1D4ED8', fontSize: 20, display: { xs: 'none', sm: 'block' } }} />
            <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 220 } }}>
              <Select
                value={selectedCompanyId || ''}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                displayEmpty
                sx={{
                  height: 38,
                  fontSize: '13px',
                  fontWeight: 600,
                  bgcolor: '#F8FAFC',
                  borderRadius: '10px',
                  '& .MuiSelect-select': { py: 1 },
                }}
              >
                {companies.map((comp) => (
                  <MenuItem key={comp.id} value={comp.id} sx={{ fontSize: '13px' }}>
                    {comp.name} ({comp.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Global Search Input */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', lg: 'flex' }, justifyContent: 'center' }}>
          <TextField
            size="small"
            placeholder="Search students, courses, batches, fee receipts..."
            sx={{
              maxWidth: 400,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                bgcolor: '#F8FAFC',
                borderRadius: '10px',
                height: 38,
                fontSize: '13px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
          {/* Notifications Center */}
          <Tooltip title="Notifications & Alerts">
            <IconButton onClick={handleOpenNotif} sx={{ color: '#5B6B88' }}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsNoneIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorNotif}
            open={Boolean(anchorNotif)}
            onClose={handleCloseNotif}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 340, maxHeight: 420, p: 0.5, borderRadius: '14px', border: '1px solid #E3EAF5' },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4" sx={{ fontSize: '15px', fontWeight: 700, color: '#0B2A5B' }}>
                Notifications & Alerts
              </Typography>
              <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600 }}>
                {unreadCount} unread
              </Typography>
            </Box>
            <Divider sx={{ borderColor: '#E3EAF5' }} />

            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 5).map((n) => (
                <MenuItem
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    handleCloseNotif();
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: n.is_read ? 'transparent' : '#F0F7FF',
                    whiteSpace: 'normal',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33', fontSize: '13px' }}>
                      {n.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                      {n.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No recent notifications
                </Typography>
              </Box>
            )}
          </Menu>

          {/* User Profile Menu */}
          <Box
            onClick={handleOpenUser}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              p: '4px 8px',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#F8FAFC' },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#1D4ED8',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {user?.first_name ? user.first_name[0] : 'U'}
            </Avatar>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33', lineHeight: 1.2 }}>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                {user?.user_type?.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorUser}
            open={Boolean(anchorUser)}
            onClose={handleCloseUser}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 220, borderRadius: '12px', border: '1px solid #E3EAF5' },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: '#E3EAF5' }} />

            <MenuItem component={Link} href="/admin/settings" onClick={handleCloseUser}>
              <PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: '#5B6B88' }} />
              Profile Settings
            </MenuItem>
            <MenuItem onClick={logout} sx={{ color: '#DC2626' }}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      {navigating && (
        <LinearProgress
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: '#EAF2FF',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 100%)',
            },
          }}
        />
      )}
    </AppBar>
  );
}
