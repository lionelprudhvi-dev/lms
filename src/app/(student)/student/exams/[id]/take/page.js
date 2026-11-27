'use client';

import React, { useState, useEffect, useRef } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import PageContainer from '@/components/layout/PageContainer';
import SectionCard from '@/components/cards/SectionCard';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FlagIcon from '@mui/icons-material/Flag';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function TakeExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(3600); // in seconds
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [examLockedError, setExamLockedError] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {
    loadExam();

    // Tab switch listener
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((c) => c + 1);
        showToast('Warning: Tab switching is monitored and recorded by the examination engine.', 'warning');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const loadExam = async () => {
    setLoading(true);
    try {
      // 1. Fetch exam details & questions
      const res = await api.get(`/api/exams/${id}`);
      if (res && res.data) {
        setExam(res.data);
        const durationSec = (res.data.duration_minutes || 60) * 60;
        setTimeLeft(durationSec);

        // 2. Start or resume attempt
        try {
          await api.post(`/api/exams/${id}/start`);
          startTimer();
        } catch (startErr) {
          setExamLockedError(startErr.message);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    showToast('Time expired! Automatically submitting your examination responses...', 'info');
    await submitExam();
  };

  const submitExam = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/api/exams/${id}/submit`, {
        answers,
        time_spent_seconds: (exam?.duration_minutes || 60) * 60 - timeLeft,
        tab_switches: tabSwitches,
      });
      showToast('Examination completed successfully!', 'success');
      router.push('/student/results');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFlag = (idx) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <StudentLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </StudentLayout>
    );
  }

  if (examLockedError) {
    return (
      <StudentLayout>
        <PageContainer maxWidth="800px">
          <SectionCard title="Assessment Access Blocked">
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
              {examLockedError}
            </Alert>
            <Button variant="contained" onClick={() => router.push('/student/fees')}>
              Go to My Fee Account & Pay Balance
            </Button>
          </SectionCard>
        </PageContainer>
      </StudentLayout>
    );
  }

  const questions = exam?.questions || [];
  const currentQ = questions[currentIdx];

  return (
    <StudentLayout>
      <PageContainer maxWidth="1200px">
        {/* Floating Topbar with Timer & Status */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '16px',
            bgcolor: '#0B2A5B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>
              {exam?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD' }}>
              Question {currentIdx + 1} of {questions.length} &bull; Marks: {currentQ?.marks} pts
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: timeLeft < 300 ? '#DC2626' : 'rgba(255, 255, 255, 0.15)',
                px: 2,
                py: 0.75,
                borderRadius: '10px',
              }}
            >
              <TimerIcon sx={{ fontSize: 20 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '16px' }}>
                {formatTimer(timeLeft)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              onClick={() => setConfirmSubmitOpen(true)}
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 700 }}
            >
              Submit Exam
            </Button>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Main Question Display */}
          <Grid item xs={12} md={8}>
            <SectionCard>
              {currentQ ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h3" sx={{ color: '#0B2A5B', fontSize: '18px', fontWeight: 600 }}>
                      Q{currentIdx + 1}. {currentQ.question_text}
                    </Typography>

                    <Button
                      size="small"
                      startIcon={<FlagIcon />}
                      onClick={() => toggleFlag(currentIdx)}
                      sx={{
                        color: flagged.has(currentIdx) ? '#D97706' : '#94A3B8',
                        bgcolor: flagged.has(currentIdx) ? '#FEF3C7' : 'transparent',
                      }}
                    >
                      {flagged.has(currentIdx) ? 'Flagged' : 'Flag'}
                    </Button>
                  </Box>

                  <Divider sx={{ borderColor: '#E3EAF5' }} />

                  {/* Options */}
                  {currentQ.question_type === 'mcq' || currentQ.question_type === 'true_false' ? (
                    <RadioGroup
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    >
                      {currentQ.options &&
                        currentQ.options.map((opt) => (
                          <Paper
                            key={opt.id}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              mb: 1.5,
                              borderRadius: '10px',
                              borderColor: answers[currentQ.id] === opt.id ? '#1D4ED8' : '#E3EAF5',
                              bgcolor: answers[currentQ.id] === opt.id ? '#EAF2FF' : '#FFFFFF',
                              cursor: 'pointer',
                            }}
                            onClick={() => setAnswers({ ...answers, [currentQ.id]: opt.id })}
                          >
                            <FormControlLabel
                              value={opt.id}
                              control={<Radio size="small" />}
                              label={opt.option_text}
                              sx={{ width: '100%', m: 0 }}
                            />
                          </Paper>
                        ))}
                    </RadioGroup>
                  ) : currentQ.question_type === 'multi_select' ? (
                    <FormGroup>
                      {currentQ.options &&
                        currentQ.options.map((opt) => {
                          const currentArr = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                          const isSel = currentArr.includes(opt.id);
                          return (
                            <Paper
                              key={opt.id}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                mb: 1.5,
                                borderRadius: '10px',
                                borderColor: isSel ? '#1D4ED8' : '#E3EAF5',
                                bgcolor: isSel ? '#EAF2FF' : '#FFFFFF',
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isSel}
                                    onChange={(e) => {
                                      const updated = e.target.checked
                                        ? [...currentArr, opt.id]
                                        : currentArr.filter((i) => i !== opt.id);
                                      setAnswers({ ...answers, [currentQ.id]: updated });
                                    }}
                                    size="small"
                                  />
                                }
                                label={opt.option_text}
                                sx={{ width: '100%', m: 0 }}
                              />
                            </Paper>
                          );
                        })}
                    </FormGroup>
                  ) : (
                    <TextField
                      multiline
                      rows={4}
                      placeholder="Write your detailed answer response here..."
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                      fullWidth
                    />
                  )}

                  {/* Navigation Buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      disabled={currentIdx === questions.length - 1}
                      onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    >
                      Next Question
                    </Button>
                  </Box>
                </Box>
              ) : null}
            </SectionCard>
          </Grid>

          {/* Question Navigator Sidebar */}
          <Grid item xs={12} md={4}>
            <SectionCard title="Question Navigator">
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, mb: 3 }}>
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isCurrent = currentIdx === idx;
                  const isFlag = flagged.has(idx);

                  return (
                    <Button
                      key={q.id}
                      variant={isCurrent ? 'contained' : 'outlined'}
                      onClick={() => setCurrentIdx(idx)}
                      sx={{
                        minWidth: 0,
                        height: 40,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        bgcolor: isCurrent ? '#0B2A5B' : isAnswered ? '#DCFCE7' : isFlag ? '#FEF3C7' : '#FFFFFF',
                        color: isCurrent ? '#FFFFFF' : isAnswered ? '#15803D' : isFlag ? '#B45309' : '#0F1B33',
                        borderColor: isCurrent ? 'transparent' : isAnswered ? '#86EFAC' : '#E3EAF5',
                      }}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: '#DCFCE7' }} />
                  <Typography variant="caption">Answered ({Object.keys(answers).length})</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: '#FEF3C7' }} />
                  <Typography variant="caption">Marked for Review ({flagged.size})</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: '#F1F5F9' }} />
                  <Typography variant="caption">
                    Remaining ({questions.length - Object.keys(answers).length})
                  </Typography>
                </Box>
              </Box>
            </SectionCard>
          </Grid>
        </Grid>

        {/* Submit Confirmation Dialog */}
        <ConfirmDialog
          open={confirmSubmitOpen}
          title="Submit Assessment?"
          message={`You have answered ${Object.keys(answers).length} out of ${questions.length} questions. Are you sure you wish to submit? Once submitted, responses are final.`}
          confirmLabel="Submit Final Assessment"
          loading={submitting}
          onConfirm={submitExam}
          onCancel={() => setConfirmSubmitOpen(false)}
        />
      </PageContainer>
    </StudentLayout>
  );
}
