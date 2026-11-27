'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

const ACTIONS = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'override', label: 'Override' },
  { key: 'export', label: 'Export' },
  { key: 'print', label: 'Print' },
];

export default function PermissionMatrix({
  role,
  availableModules = [],
  initialPermissions = [],
  onSave,
  loading = false,
}) {
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());

  useEffect(() => {
    setSelectedPermissions(new Set(initialPermissions));
  }, [initialPermissions]);

  const togglePermission = (moduleName, actionKey) => {
    const code = `${moduleName.toLowerCase().replace(/\s+/g, '_')}.${actionKey}`;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const isChecked = (moduleName, actionKey) => {
    const code = `${moduleName.toLowerCase().replace(/\s+/g, '_')}.${actionKey}`;
    return selectedPermissions.has(code);
  };

  const toggleRow = (moduleName) => {
    const rowCodes = ACTIONS.map(
      (a) => `${moduleName.toLowerCase().replace(/\s+/g, '_')}.${a.key}`
    );
    const allChecked = rowCodes.every((code) => selectedPermissions.has(code));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        rowCodes.forEach((c) => next.delete(c));
      } else {
        rowCodes.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  const toggleColumn = (actionKey) => {
    const colCodes = availableModules.map(
      (m) => `${m.toLowerCase().replace(/\s+/g, '_')}.${actionKey}`
    );
    const allChecked = colCodes.every((code) => selectedPermissions.has(code));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        colCodes.forEach((c) => next.delete(c));
      } else {
        colCodes.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allCodes = [];
    availableModules.forEach((m) => {
      ACTIONS.forEach((a) => {
        allCodes.push(`${m.toLowerCase().replace(/\s+/g, '_')}.${a.key}`);
      });
    });

    const isAllSelected = allCodes.every((c) => selectedPermissions.has(c));
    if (isAllSelected) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(allCodes));
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Matrix Header Actions */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleSelectAll}
            sx={{ borderColor: '#E3EAF5', color: '#0F1B33' }}
          >
            Toggle All Permissions
          </Button>
          <Chip
            label={`${selectedPermissions.size} Permissions Granted`}
            size="small"
            sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600 }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => onSave(Array.from(selectedPermissions))}
          disabled={loading || role?.is_system}
        >
          {loading ? 'Saving...' : 'Save Permission Matrix'}
        </Button>
      </Box>

      {/* 2D Permissions Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: '12px',
          borderColor: '#E3EAF5',
          maxHeight: '600px',
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 220, bgcolor: '#0B2A5B', color: '#FFFFFF', fontWeight: 700 }}>
                System Module
              </TableCell>
              {ACTIONS.map((action) => (
                <TableCell
                  key={action.key}
                  align="center"
                  sx={{
                    bgcolor: '#0B2A5B',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { bgcolor: '#1D4ED8' },
                  }}
                  onClick={() => toggleColumn(action.key)}
                >
                  <Tooltip title={`Click to toggle all ${action.label} permissions`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <span>{action.label}</span>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ bgcolor: '#0B2A5B', color: '#FFFFFF', fontWeight: 600 }}>
                Row Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {availableModules.map((moduleName) => {
              const rowCodes = ACTIONS.map(
                (a) => `${moduleName.toLowerCase().replace(/\s+/g, '_')}.${a.key}`
              );
              const isRowFullyChecked = rowCodes.every((code) => selectedPermissions.has(code));

              return (
                <TableRow
                  key={moduleName}
                  hover
                  sx={{
                    '&:hover': { bgcolor: '#F8FAFC !important' },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#0F1B33', py: 1 }}>
                    {moduleName}
                  </TableCell>

                  {ACTIONS.map((action) => {
                    const checked = isChecked(moduleName, action.key);
                    return (
                      <TableCell key={action.key} align="center" sx={{ py: 0.5 }}>
                        <Checkbox
                          size="small"
                          checked={checked}
                          onChange={() => togglePermission(moduleName, action.key)}
                          sx={{
                            color: '#CBD5E1',
                            '&.Mui-checked': {
                              color: '#1D4ED8',
                            },
                          }}
                        />
                      </TableCell>
                    );
                  })}

                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <Button
                      size="small"
                      onClick={() => toggleRow(moduleName)}
                      sx={{ fontSize: '11px', height: '26px', minWidth: '60px', color: '#5B6B88' }}
                    >
                      {isRowFullyChecked ? 'Clear' : 'Select'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
