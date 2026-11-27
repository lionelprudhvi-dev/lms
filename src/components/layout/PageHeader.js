'use client';

import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  action = null,
  sx = {},
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        ...sx,
      }}
    >
      <Box>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: '16px' }} />}
            sx={{ mb: 0.75 }}
          >
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast || !item.href ? (
                <Typography key={index} variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {item.label}
                </Typography>
              ) : (
                <MuiLink
                  key={index}
                  component={Link}
                  href={item.href}
                  underline="hover"
                  sx={{ color: 'primary.main', fontSize: '12px', fontWeight: 500 }}
                >
                  {item.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        )}
        <Typography variant="h1" sx={{ color: '#0B2A5B', fontSize: { xs: '22px', md: '26px' } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: { sm: 2 } }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
