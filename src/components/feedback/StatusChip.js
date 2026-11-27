'use client';

import React from 'react';
import { Chip } from '@mui/material';

const statusConfig = {
  // Common / general statuses
  active: { label: 'Active', bg: '#DCFCE7', color: '#15803D' },
  inactive: { label: 'Inactive', bg: '#F1F5F9', color: '#475569' },
  completed: { label: 'Completed', bg: '#E0F2FE', color: '#0369A1' },
  suspended: { label: 'Suspended', bg: '#FEE2E2', color: '#B91C1C' },
  pending: { label: 'Pending', bg: '#FEF3C7', color: '#B45309' },
  approved: { label: 'Approved', bg: '#DCFCE7', color: '#15803D' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#B91C1C' },
  cancelled: { label: 'Cancelled', bg: '#F1F5F9', color: '#64748B' },
  
  // Attendance
  present: { label: 'Present', bg: '#DCFCE7', color: '#15803D' },
  absent: { label: 'Absent', bg: '#FEE2E2', color: '#B91C1C' },
  late: { label: 'Late', bg: '#FEF3C7', color: '#B45309' },
  half_day: { label: 'Half Day', bg: '#E0F2FE', color: '#0369A1' },
  holiday: { label: 'Holiday', bg: '#F3E8FF', color: '#7E22CE' },

  // Fees
  paid: { label: 'Paid', bg: '#DCFCE7', color: '#15803D' },
  partially_paid: { label: 'Partially Paid', bg: '#FEF3C7', color: '#B45309' },
  overdue: { label: 'Overdue', bg: '#FEE2E2', color: '#B91C1C' },
  refunded: { label: 'Refunded', bg: '#F1F5F9', color: '#475569' },

  // Exams / Results
  passed: { label: 'Passed', bg: '#DCFCE7', color: '#15803D' },
  failed: { label: 'Failed', bg: '#FEE2E2', color: '#B91C1C' },
  published: { label: 'Published', bg: '#DCFCE7', color: '#15803D' },
  draft: { label: 'Draft', bg: '#F1F5F9', color: '#475569' },

  // Certificates
  valid: { label: 'Valid', bg: '#DCFCE7', color: '#15803D' },
  revoked: { label: 'Revoked', bg: '#FEE2E2', color: '#B91C1C' },

  // IP Match
  reviewed: { label: 'Reviewed', bg: '#DCFCE7', color: '#15803D' },
  dismissed: { label: 'Dismissed', bg: '#F1F5F9', color: '#64748B' },
  confirmed: { label: 'Flagged Suspect', bg: '#FEE2E2', color: '#B91C1C' },
};

export default function StatusChip({ status, label, size = 'small' }) {
  const normalizedKey = String(status || '').toLowerCase().replace(/[\s-]/g, '_');
  const conf = statusConfig[normalizedKey] || {
    label: label || status || 'Unknown',
    bg: '#F1F5F9',
    color: '#475569',
  };

  return (
    <Chip
      size={size}
      label={label || conf.label}
      sx={{
        backgroundColor: conf.bg,
        color: conf.color,
        fontWeight: 600,
        fontSize: size === 'small' ? '12px' : '13px',
        borderRadius: '6px',
        border: 'none',
        height: size === 'small' ? 24 : 28,
      }}
    />
  );
}
