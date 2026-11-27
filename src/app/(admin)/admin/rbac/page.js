'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import SectionCard from '@/components/cards/SectionCard';
import PermissionMatrix from '@/components/rbac/PermissionMatrix';
import DataTable from '@/components/tables/DataTable';
import StatusChip from '@/components/feedback/StatusChip';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function RBACPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0); // 0: Roles & Matrix, 1: Users List
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsData, setPermissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // New Role Dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', code: '', description: '' });

  // New User Dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    user_type: 'staff',
    role_ids: [],
    company_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        api.get('/api/rbac/roles'),
        api.get('/api/rbac/permissions'),
        api.get('/api/users'),
      ]);

      if (rolesRes && rolesRes.data) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !selectedRole) {
          setSelectedRole(rolesRes.data[0]);
        }
      }
      if (permsRes && permsRes.data) {
        setPermissionsData(permsRes.data);
      }
      if (usersRes && usersRes.data) {
        setUsers(usersRes.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMatrix = async (updatedPermissions) => {
    if (!selectedRole) return;
    setSavingMatrix(true);
    try {
      await api.put(`/api/rbac/roles/${selectedRole.id}`, {
        permissions: updatedPermissions,
      });
      showToast(`Updated permissions for role [${selectedRole.name}]`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/rbac/roles', newRole);
      showToast('Custom role created successfully', 'success');
      setRoleDialogOpen(false);
      setNewRole({ name: '', code: '', description: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/users', newUser);
      showToast('User account created successfully', 'success');
      setUserDialogOpen(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        user_type: 'staff',
        role_ids: [],
        company_ids: [],
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const availableModules = permissionsData?.grouped ? Object.keys(permissionsData.grouped) : [];

  const userColumns = [
    {
      field: 'name',
      headerName: 'User Name & Email',
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1B33' }}>
            {row.first_name} {row.last_name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'user_type',
      headerName: 'User Type',
      minWidth: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value?.toUpperCase()}
          size="small"
          sx={{ bgcolor: '#EAF2FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}
        />
      ),
    },
    {
      field: 'roles',
      headerName: 'Assigned Roles',
      minWidth: 200,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value && value.map((r) => (
            <Chip key={r.id} label={r.name} size="small" sx={{ fontSize: '11px', height: 22 }} />
          ))}
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      minWidth: 140,
      renderCell: ({ value }) => value || '—',
    },
    {
      field: 'is_active',
      headerName: 'Status',
      minWidth: 100,
      renderCell: ({ value }) => <StatusChip status={value ? 'active' : 'inactive'} />,
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader
          title="Access Control & RBAC Matrix"
          subtitle="Configure system and custom roles with the fine-grained 2D Permission Matrix (Modules × Create, Read, Update, Delete, Approve, Override, Export, Print)."
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users & RBAC' }]}
          action={
            tab === 0 ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRoleDialogOpen(true)}>
                Add Custom Role
              </Button>
            ) : (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUserDialogOpen(true)}>
                Add New User
              </Button>
            )
          }
        />

        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          sx={{
            borderBottom: '1px solid #E3EAF5',
            '& .MuiTab-root': { fontWeight: 600, fontSize: '14px', textTransform: 'none' },
          }}
        >
          <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Role Permission Matrix" />
          <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="System Users & Staff" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Roles Selection Pill Bar */}
            <SectionCard title="Select Role to Inspect & Grant Permissions">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <Button
                      key={r.id}
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedRole(r)}
                      sx={{
                        borderRadius: '10px',
                        borderColor: isSelected ? 'transparent' : '#E3EAF5',
                        color: isSelected ? '#FFFFFF' : '#0B2A5B',
                        bgcolor: isSelected ? '#0B2A5B' : '#FFFFFF',
                        '&:hover': {
                          bgcolor: isSelected ? '#1D4ED8' : '#EAF2FF',
                        },
                      }}
                    >
                      {r.name} {r.is_system && '★'}
                    </Button>
                  );
                })}
              </Box>

              {selectedRole && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E3EAF5' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2A5B' }}>
                    Configuring: {selectedRole.name} ({selectedRole.code})
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {selectedRole.description || 'Custom organizational permission definition'}
                    {selectedRole.is_system && ' — System Super Role (Protected)'}
                  </Typography>
                </Box>
              )}
            </SectionCard>

            {/* The 2D Dynamic Permission Matrix */}
            <SectionCard title={`Permission Matrix: ${selectedRole?.name || 'Selected Role'}`}>
              <PermissionMatrix
                role={selectedRole}
                availableModules={availableModules}
                initialPermissions={selectedRole?.permissions || []}
                onSave={handleSaveMatrix}
                loading={savingMatrix}
              />
            </SectionCard>
          </Box>
        )}

        {tab === 1 && (
          <SectionCard noPadding>
            <DataTable
              columns={userColumns}
              rows={users}
              loading={loading}
              searchPlaceholder="Search user by name, email, role..."
            />
          </SectionCard>
        )}

        {/* Dialog: Create Custom Role */}
        <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleCreateRole}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Add Custom Role</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Role Name"
                placeholder="e.g. Senior Academic Supervisor"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Role Code"
                placeholder="e.g. ACAD_SUPERVISOR"
                value={newRole.code}
                onChange={(e) => setNewRole({ ...newRole, code: e.target.value.toUpperCase() })}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create Role</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Dialog: Create User */}
        <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateUser}>
            <DialogTitle sx={{ color: '#0B2A5B', fontWeight: 700 }}>Add New User Account</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="First Name"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Last Name"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  required
                  fullWidth
                  size="small"
                />
              </Box>

              <TextField
                label="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <TextField
                label="Default Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <TextField
                select
                label="User Type"
                value={newUser.user_type}
                onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="company_admin">Company Admin</MenuItem>
                <MenuItem value="trainer">Faculty / Trainer</MenuItem>
                <MenuItem value="student">Student Learner</MenuItem>
                <MenuItem value="staff">Fee / Operations Staff</MenuItem>
              </TextField>

              <TextField
                label="Phone Number"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                fullWidth
                size="small"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create User</Button>
            </DialogActions>
          </form>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
