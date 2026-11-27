'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  TextField,
  InputAdornment,
  Typography,
  Skeleton,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmptyState from '@/components/feedback/EmptyState';

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  searchPlaceholder = 'Search...',
  searchField = null,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items matching your criteria.',
  emptyAction = null,
  onExportExcel = null,
  onExportPdf = null,
  onExportCsv = null,
  headerAction = null,
  rowKey = 'id',
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [exportAnchor, setExportAnchor] = useState(null);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (searchField && row[searchField]) {
        return String(row[searchField]).toLowerCase().includes(q);
      }
      return columns.some((col) => {
        const val = row[col.field];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      });
    });
  }, [rows, search, searchField, columns]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const hasExports = Boolean(onExportExcel || onExportPdf || onExportCsv);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search and Action Toolbar */}
      <Box
        sx={{
          p: '16px 20px',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid #E3EAF5',
        }}
      >
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ maxWidth: { sm: 320 }, width: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end' }}>
          {hasExports && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={(e) => setExportAnchor(e.currentTarget)}
                sx={{ borderColor: '#E3EAF5', color: '#0F1B33', '&:hover': { bgcolor: '#F8FAFC' } }}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportAnchor}
                open={Boolean(exportAnchor)}
                onClose={() => setExportAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {onExportExcel && (
                  <MenuItem
                    onClick={() => {
                      setExportAnchor(null);
                      onExportExcel(filteredRows);
                    }}
                  >
                    Export to Excel (.xlsx)
                  </MenuItem>
                )}
                {onExportCsv && (
                  <MenuItem
                    onClick={() => {
                      setExportAnchor(null);
                      onExportCsv(filteredRows);
                    }}
                  >
                    Export to CSV (.csv)
                  </MenuItem>
                )}
                {onExportPdf && (
                  <MenuItem
                    onClick={() => {
                      setExportAnchor(null);
                      onExportPdf(filteredRows);
                    }}
                  >
                    Export to PDF (.pdf)
                  </MenuItem>
                )}
              </Menu>
            </>
          )}

          {headerAction}
        </Box>
      </Box>

      {/* Table Container */}
      <TableContainer sx={{ maxHeight: 650, overflowX: 'auto' }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align || 'left'}
                  sx={{
                    minWidth: col.minWidth || 100,
                    width: col.width,
                    bgcolor: '#F8FAFC',
                    color: '#0B2A5B',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderBottom: '1px solid #E3EAF5',
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton variant="text" width="80%" height={24} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <TableRow
                  key={row[rowKey] || idx}
                  hover
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: '#EAF2FF !important' },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.field} align={col.align || 'left'}>
                      {col.renderCell ? col.renderCell({ row, value: row[col.field] }) : row[col.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6 }}>
                  <EmptyState title={emptyTitle} description={emptyMessage} action={emptyAction} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: '1px solid #E3EAF5' }}
      />
    </Box>
  );
}
