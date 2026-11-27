'use client';

import React from 'react';
import { Card, Box, Typography, Chip, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#1D4ED8',
  bgColor = '#EAF2FF',
  trend,
  trendType = 'up',
  loading = false,
  onClick,
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: { xs: '16px', md: '24px' },
        borderRadius: '16px',
        bgcolor: '#FFFFFF',
        border: '1px solid #E3EAF5',
        boxShadow: '0 4px 20px rgba(11, 42, 91, 0.05)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: color,
          opacity: 0.85,
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(29, 78, 216, 0.12)',
          borderColor: '#93C5FD',
        },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1.5 }}>
        <Box sx={{ minWidth: 0, flexGrow: 1, overflow: 'hidden' }}>
          <Typography
            variant="caption"
            sx={{
              color: '#5B6B88',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
            }}
            noWrap
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={90} height={38} sx={{ mt: 0.5 }} />
          ) : (
            <Typography
              variant="h2"
              sx={{
                color: '#0B2A5B',
                mt: 0.5,
                fontWeight: 700,
                fontSize: { xs: '24px', md: '28px' },
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          )}
        </Box>

        {Icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: bgColor,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 'auto',
          pt: 1.5,
          borderTop: '1px solid #F1F5F9',
          gap: 1,
        }}
      >
        {loading ? (
          <Skeleton variant="text" width={110} height={18} />
        ) : (
          <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 500, display: 'block', minWidth: 0 }} noWrap>
            {subtitle || 'Updated just now'}
          </Typography>
        )}

        {!loading && trend && (
          <Chip
            size="small"
            icon={
              trendType === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: '14px !important' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: '14px !important' }} />
              )
            }
            label={trend}
            sx={{
              height: 22,
              fontSize: '11px',
              bgcolor: trendType === 'up' ? '#DCFCE7' : '#FEE2E2',
              color: trendType === 'up' ? '#15803D' : '#B91C1C',
              fontWeight: 600,
            }}
          />
        )}
      </Box>
    </Card>
  );
}
