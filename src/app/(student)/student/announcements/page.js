'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import {
  Box,
  Typography,
  Card,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <PageContainer>
        <PageHeader
          title="Campus Announcements"
          subtitle="Stay updated with official broadcasts, academic deadlines, holiday schedules, and campus events."
        />

        <SectionCard title="Official Notice Board">
          {announcements.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: '#5B6B88' }}>
              <CampaignIcon sx={{ fontSize: 56, color: '#A0AEC0', mb: 1.5 }} />
              <Typography variant="h3" sx={{ fontWeight: 600, fontSize: '18px', mb: 0.5 }}>
                No Active Announcements
              </Typography>
              <Typography variant="body2">
                All campus broadcasts and notices will be displayed here as they are published.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {announcements.map((a, i) => {
                const isUrgent = a.priority === 'urgent';
                return (
                  <React.Fragment key={a.id || i}>
                    <Box
                      sx={{
                        p: 2.5,
                        my: 1.5,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isUrgent ? '#FECACA' : '#E3EAF5',
                        bgcolor: isUrgent ? '#FFF5F5' : '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(11,42,91,0.04)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CampaignIcon sx={{ color: isUrgent ? '#DC2626' : '#1D4ED8' }} />
                          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '17px', color: '#0B2A5B' }}>
                            {a.title}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={a.priority?.toUpperCase() || 'NORMAL'}
                            size="small"
                            sx={{
                              bgcolor: isUrgent ? '#FEE2E2' : '#EAF2FF',
                              color: isUrgent ? '#DC2626' : '#1D4ED8',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#5B6B88', fontWeight: 500 }}>
                            {dayjs(a.published_at).format('MMM DD, YYYY • hh:mm A')}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#334155', mt: 1, lineHeight: 1.6 }}>
                        {a.content}
                      </Typography>
                      {a.company_name && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1.5, fontStyle: 'italic' }}>
                          Broadcasted for: {a.company_name}
                        </Typography>
                      )}
                    </Box>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </SectionCard>
      </PageContainer>
    </StudentLayout>
  );
}
