'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import QuizIcon from '@mui/icons-material/Quiz';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignIcon from '@mui/icons-material/Campaign';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: DashboardIcon },
  { label: 'Organization', href: '/admin/organization', icon: CorporateFareIcon },
  { label: 'Companies', href: '/admin/companies', icon: BusinessIcon },
  { label: 'Users & RBAC', href: '/admin/rbac', icon: AdminPanelSettingsIcon },
  { label: 'Students', href: '/admin/students', icon: SchoolIcon },
  { label: 'Trainers', href: '/admin/trainers', icon: RecordVoiceOverIcon },
  { label: 'Courses', href: '/admin/courses', icon: AutoStoriesIcon },
  { label: 'Batches', href: '/admin/batches', icon: GroupsIcon },
  {
    label: 'Attendance',
    icon: AccessTimeFilledIcon,
    subItems: [
      { label: 'Daily Attendance', href: '/admin/attendance' },
      { label: 'Location Management', href: '/admin/attendance/locations' },
      { label: 'IP Match Detection', href: '/admin/attendance/ip-matches' },
      { label: 'Attendance Overrides', href: '/admin/attendance/overrides' },
      { label: 'Attendance Reports', href: '/admin/attendance/reports' },
    ],
  },
  {
    label: 'Examinations',
    icon: QuizIcon,
    subItems: [
      { label: 'Exam Management', href: '/admin/exams' },
      { label: 'Question Bank', href: '/admin/exams/questions' },
      { label: 'Exam Results', href: '/admin/exams/results' },
    ],
  },
  {
    label: 'Certificates',
    icon: WorkspacePremiumIcon,
    subItems: [
      { label: 'Templates', href: '/admin/certificates/templates' },
      { label: 'Generate & Issue', href: '/admin/certificates/generate' },
      { label: 'Issued Certificates', href: '/admin/certificates' },
      { label: 'Verification Logs', href: '/admin/certificates/verifications' },
    ],
  },
  {
    label: 'Fees & Finance',
    icon: AccountBalanceWalletIcon,
    subItems: [
      { label: 'Fee Dashboard', href: '/admin/fees' },
      { label: 'Fee Structures', href: '/admin/fees/structures' },
      { label: 'Fee Collection', href: '/admin/fees/collect' },
      { label: 'Installments', href: '/admin/fees/installments' },
      { label: 'Discounts & Waivers', href: '/admin/fees/discounts' },
      { label: 'Refunds', href: '/admin/fees/refunds' },
      { label: 'Payment Receipts', href: '/admin/fees/receipts' },
      { label: 'Fee Reports', href: '/admin/fees/reports' },
    ],
  },
  { label: 'Reports & Analytics', href: '/admin/reports', icon: AssessmentIcon },
  { label: 'Announcements', href: '/admin/announcements', icon: CampaignIcon },
  { label: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export default function AdminSidebar({ mobileOpen, onMobileClose }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);
  const [openSubMenus, setOpenSubMenus] = useState({
    Attendance: pathname?.startsWith('/admin/attendance'),
    Examinations: pathname?.startsWith('/admin/exams'),
    Certificates: pathname?.startsWith('/admin/certificates'),
    'Fees & Finance': pathname?.startsWith('/admin/fees'),
  });

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const handleNavClick = (href) => {
    if (href && href !== pathname) {
      setPendingHref(href);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lms:route-start'));
      }
    }
    if (onMobileClose) onMobileClose();
  };

  const toggleSubMenu = (label) => {
    if (collapsed) setCollapsed(false);
    setOpenSubMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isItemActive = (href) => pathname === href;
  const isParentActive = (subItems) => subItems?.some((sub) => pathname === sub.href);

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#0B2A5B',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
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
              <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
                APEX LMS
              </Typography>
              <Typography variant="caption" sx={{ color: '#93C5FD', fontSize: '11px' }}>
                Enterprise Portal
              </Typography>
            </Box>
          </Box>
        )}

        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{ color: '#93C5FD', display: { xs: 'none', md: 'flex' } }}
          size="small"
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1.5, px: collapsed ? 1 : 1.5 }}>
        <List disablePadding>
          {navItems.map((item) => {
            const hasSub = Boolean(item.subItems);
            const parentActive = hasSub && isParentActive(item.subItems);
            const isPending = !hasSub && pendingHref === item.href;
            const active = (!hasSub && isItemActive(item.href)) || isPending;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.label : ''} placement="right">
                    <ListItemButton
                      component={hasSub ? 'div' : Link}
                      href={hasSub ? undefined : item.href}
                      onClick={hasSub ? () => toggleSubMenu(item.label) : () => handleNavClick(item.href)}
                      sx={{
                        borderRadius: '10px',
                        py: 1,
                        px: collapsed ? 1.5 : 2,
                        minHeight: 42,
                        bgcolor: active || parentActive ? '#EAF2FF' : 'transparent',
                        color: active || parentActive ? '#1D4ED8' : '#F1F5F9',
                        borderLeft: active || parentActive ? '4px solid #1D4ED8' : '4px solid transparent',
                        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: active || parentActive ? '#EAF2FF' : 'rgba(255, 255, 255, 0.14)',
                          color: active || parentActive ? '#1D4ED8' : '#FFFFFF',
                          transform: collapsed ? 'none' : 'translateX(4px)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 'auto' : 36,
                          color: active || parentActive ? '#1D4ED8' : '#CBD5E1',
                          justifyContent: 'center',
                          transition: 'color 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </ListItemIcon>

                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '13.5px',
                              fontWeight: active || parentActive ? 600 : 500,
                              color: 'inherit',
                            }}
                          />
                          {isPending && <CircularProgress size={14} sx={{ color: '#1D4ED8', mr: 0.5 }} />}
                          {hasSub && (openSubMenus[item.label] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />)}
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>

                {/* Sub Menu Items */}
                {hasSub && !collapsed && (
                  <Collapse in={openSubMenus[item.label]} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 4, my: 0.5 }}>
                      {item.subItems.map((sub) => {
                        const subPending = pendingHref === sub.href;
                        const subActive = isItemActive(sub.href) || subPending;
                        return (
                          <ListItem key={sub.label} disablePadding sx={{ mb: 0.3 }}>
                            <ListItemButton
                              component={Link}
                              href={sub.href}
                              onClick={() => handleNavClick(sub.href)}
                              sx={{
                                py: 0.75,
                                px: 1.5,
                                borderRadius: '8px',
                                minHeight: 34,
                                bgcolor: subActive ? 'rgba(59, 130, 246, 0.28)' : 'transparent',
                                color: subActive ? '#FFFFFF' : '#E2E8F0',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.14)',
                                  color: '#FFFFFF',
                                  transform: 'translateX(4px)',
                                },
                              }}
                            >
                              <ListItemText
                                primary={sub.label}
                                primaryTypographyProps={{
                                  fontSize: '12.5px',
                                  fontWeight: subActive ? 600 : 400,
                                  color: 'inherit',
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Footer / Version */}
      {!collapsed && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', textAlign: 'center' }}>
            Apex v2.6 Enterprise Edition
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 'none',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
}
