'use client';

import React, { useState, useEffect } from 'react';
import TrainerLayout from '@/components/layout/TrainerLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import StatCard from '@/components/cards/StatCard';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const gradeDistribution = [
  { grade: 'A+ (90-100%)', count: 14, fill: '#16A34A' },
  { grade: 'A (80-89%)', count: 18, fill: '#1D4ED8' },
  { grade: 'B (70-79%)', count: 8, fill: '#3B82F6' },
  { grade: 'C (60-69%)', count: 4, fill: '#D97706' },
  { grade: 'Fail (<60%)', count: 1, fill: '#DC2626' },
];

export default function TrainerPerformancePage() {
  return (
    <TrainerLayout>
      <PageContainer>
        <PageHeader
          title="Cohort Performance & Analytics"
          subtitle="Deep dive into trainee pass rates, score distributions, and learning module masteries."
        />

        {/* KPIs */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Overall Pass Rate"
              value="97.8%"
              icon={CheckCircleIcon}
              color="success"
              subtitle="Above org average (+4%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Average Score"
              value="84.2 / 100"
              icon={TrendingUpIcon}
              color="primary"
              subtitle="Consistently high"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Distinctions (A+)"
              value="14"
              icon={EmojiEventsIcon}
              color="info"
              subtitle="Top tier performers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Needs Mentoring"
              value="1"
              icon={HelpOutlineIcon}
              color="warning"
              subtitle="Score below threshold"
            />
          </Grid>
        </Grid>

        {/* Grade Distribution Chart */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <SectionCard title="Score & Grade Distribution Across Cohorts">
              <Box sx={{ width: '100%', height: 300, mt: 1 }}>
                <ResponsiveContainer>
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF5" />
                    <XAxis dataKey="grade" tick={{ fill: '#5B6B88', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#5B6B88', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </SectionCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <SectionCard title="Module Mastery Breakdown">
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                    Module 1: Architecture & Data Modeling
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                    92%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={92} sx={{ height: 8, borderRadius: 4, bgcolor: '#EAF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                    Module 2: Raw SQL Queries & Transactions
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D4ED8' }}>
                    88%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={88} sx={{ height: 8, borderRadius: 4, bgcolor: '#EAF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#1D4ED8' } }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                    Module 3: Security & RBAC Implementation
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                    85%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4, bgcolor: '#EAF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#3B82F6' } }} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                    Module 4: Performance Tuning & Indexing
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                    76%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={76} sx={{ height: 8, borderRadius: 4, bgcolor: '#EAF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }} />
              </Box>
            </SectionCard>
          </Grid>
        </Grid>
      </PageContainer>
    </TrainerLayout>
  );
}
