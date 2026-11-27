'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({
  title = 'No data available',
  description = 'There are no records to display at this moment.',
  icon: Icon = InboxOutlinedIcon,
  action = null,
  sx = {},
}) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: '#EAF2FF',
          color: '#1D4ED8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Icon sx={{ fontSize: 32 }} />
      </Box>

      <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '18px', fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, mb: action ? 2.5 : 0 }}>
        {description}
      </Typography>

      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
