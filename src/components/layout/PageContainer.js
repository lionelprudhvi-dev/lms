'use client';

import React from 'react';
import { Box } from '@mui/material';

export default function PageContainer({ children, maxWidth = '100%', sx = {} }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        mx: 'auto',
        p: { xs: '16px', sm: '20px', md: '24px' },
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        '@keyframes pageFadeSlideUp': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: 'pageFadeSlideUp 0.26s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
