'use client';

import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';

export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
  sx = {},
  headerSx = {},
  hoverable = false,
  onClick,
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: '16px',
        bgcolor: '#FFFFFF',
        border: '1px solid #E3EAF5',
        boxShadow: '0 4px 24px rgba(11, 42, 91, 0.06)',
        overflow: 'hidden',
        cursor: hoverable || onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(hoverable || onClick
          ? {
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(29, 78, 216, 0.14)',
                borderColor: '#93C5FD',
              },
            }
          : {}),
        ...sx,
      }}
    >
      {(title || action) && (
        <>
          <Box
            sx={{
              p: { xs: '16px', md: '20px 24px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              ...headerSx,
            }}
          >
            <Box>
              {title && (
                <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '18px', fontWeight: 600 }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{action}</Box>}
          </Box>
          <Divider sx={{ borderColor: '#E3EAF5' }} />
        </>
      )}

      <Box sx={{ p: noPadding ? 0 : { xs: '16px', md: '24px' } }}>{children}</Box>
    </Card>
  );
}
