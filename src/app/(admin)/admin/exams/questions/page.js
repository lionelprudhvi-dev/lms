'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Chip,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';

export default function QuestionBankPage() {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompany();

  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    exam_id: '',
    question_text: '',
    question_type: 'mcq',
    difficulty: 'medium',
    marks: 5,
    negative_marks: 0,
    explanation: '',
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  });

  useEffect(() => {
    loadQuestions();
    loadExams();
  }, [selectedCompanyId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/exams/questions');
      if (res && res.data) setQuestions(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async () => {
    try {
      const res = await api.get('/api/exams');
      if (res && res.data) setExams(res.data);
    } catch (e) {
      // silent
    }
  };

  const handleOptionChange = (idx, text) => {
    const updated = [...formData.options];
    updated[idx].text = text;
    setFormData({ ...formData, options: updated });
  };

  const handleCorrectOptionSelect = (idx) => {
    const updated = formData.options.map((opt, i) => ({
      ...opt,
      is_correct: i === idx,
    }));
    setFormData({ ...formData, options: updated });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/exams/questions', formData);
      showToast('Question created and added to assessment bank!', 'success');
      setDialogOpen(false);
      setFormData({
        exam_id: '',
        question_text: '',
        question_type: 'mcq',
        difficulty: 'medium',
        marks: 5,
        negative_marks: 0,
        explanation: '',
        options: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ],
      });
      loadQuestions();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'question_text',
      headerName: 'Question Statement',
      minWidth: 320,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
            {row.question_text}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Exam: {row.exam_name || 'General Bank'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'question_type',
      headerName: 'Type',
      minWidth: 120,
      renderCell: ({ value }) => (
        <Chip label={value?.toUpperCase()} size="small" sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 600 }} />
      ),
    },
    {
      field: 'marks',
      headerName: 'Marks',
      minWidth: 90,
      align: 'center',
      renderCell: ({ value }) => `${value} pts`,
    },
    {
      field: 'difficulty',
      headerName: 'Difficulty',
      minWidth: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            bgcolor: value === 'easy' ? '#DCFCE7' : value === 'medium' ? '#FEF3C7' : '#FEE2E2',
            color: value === 'easy' ? '#15803D' : value === 'medium' ? '#B45309' : '#B91C1C',
            fontWeight: 600,
            fontSize: '11px',
          }}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Question Bank & Assessment Items"
          subtitle="Repository of objective and descriptive question items with negative marking rules and automated answer verification keys."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Examinations' }, { label: 'Questions' }]}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Question
            </Button>
          }
        />

        <SectionCard noPadding>
          <DataTable
            columns={columns}
            rows={questions}
            loading={loading}
            searchPlaceholder="Search questions..."
          />
        </SectionCard>

        {/* Add Question Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleAddQuestion}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Add Assessment Question</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                select
                label="Assign to Examination"
                value={formData.exam_id}
                onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                <MenuItem value="">-- Select Exam --</MenuItem>
                {exams.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>
                    {ex.name} ({ex.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Question Statement"
                placeholder="Enter complete question text..."
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                required
                multiline
                rows={3}
                fullWidth
                size="small"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Format Type"
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="mcq">Multiple Choice (MCQ)</MenuItem>
                    <MenuItem value="true_false">True / False</MenuItem>
                    <MenuItem value="multi_select">Multi-Select Checkboxes</MenuItem>
                    <MenuItem value="short">Short Answer</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Score Marks"
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Negative Marks Deducted"
                    type="number"
                    value={formData.negative_marks}
                    onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Options Section */}
              {formData.question_type === 'mcq' && (
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E3EAF5' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B', mb: 1.5 }}>
                    Answer Options (Select the radio of the correct key):
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {formData.options.map((opt, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Radio
                          checked={opt.is_correct}
                          onChange={() => handleCorrectOptionSelect(idx)}
                          size="small"
                        />
                        <TextField
                          placeholder={`Option ${idx + 1}`}
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          fullWidth
                          size="small"
                          required
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <TextField
                label="Solution Explanation"
                placeholder="Detailed rationale displayed after exam completion"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Add Question'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
