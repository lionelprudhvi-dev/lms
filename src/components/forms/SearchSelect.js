'use client';

import React from 'react';
import { Autocomplete, TextField, Chip, Box } from '@mui/material';

export default function SearchSelect({
  label,
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Select option...',
  getOptionLabel = (option) => (option && option.label ? option.label : String(option || '')),
  isOptionEqualToValue = (option, val) => {
    if (!option || !val) return false;
    const optVal = option.value !== undefined ? option.value : option.id || option;
    const vVal = val.value !== undefined ? val.value : val.id || val;
    return optVal === vVal;
  },
  groupBy = null,
  disabled = false,
  error = false,
  helperText = '',
  required = false,
  sx = {},
}) {
  return (
    <Autocomplete
      multiple={multiple}
      options={options}
      value={value}
      onChange={(event, newValue) => {
        onChange(newValue);
      }}
      disabled={disabled}
      groupBy={groupBy}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={getOptionLabel(option)}
            {...getTagProps({ index })}
            size="small"
            key={index}
            sx={{
              bgcolor: '#EAF2FF',
              color: '#1D4ED8',
              fontWeight: 600,
              fontSize: '12px',
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          fullWidth
          size="small"
        />
      )}
      sx={{
        width: '100%',
        ...sx,
      }}
    />
  );
}
