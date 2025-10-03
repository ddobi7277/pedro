import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Alert,
    IconButton,
    Chip,
    Grid,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiConfig } from '../config/apiConfig';
import TestModeToggle from './TestModeToggle';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editDialog, setEditDialog] = useState({ open: false, user: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
    const [formData, setFormData] = useState({
        full_name: '',
        is_admin: false
    });

    useEffect(() => {
        loadUsers();

        // Escuchar cambios de servidor para recargar datos inmediatamente
        const handleServerChange = (event) => {
            console.log('🔄 Server changed, reloading users...', event.detail);
            loadUsers();
        };

        window.addEventListener('serverChanged', handleServerChange);

        return () => {
            window.removeEventListener('serverChanged', handleServerChange);
        };
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('access_token');
            const response = await apiConfig.fetchWithFallback('users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : []);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Error loading users');
                setUsers([]); // Asegurar que users sea siempre un array
            }
        } catch (error) {
            if (error.message === 'SERVER_ERROR') {
                setError('No se pudo conectar con ningún servidor disponible.');
            } else {
                setError('Error de conexión: ' + error.message);
            }
            setUsers([]); // Asegurar que users sea siempre un array
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setFormData({
            full_name: user.full_name,
            is_admin: user.is_admin
        });
        setEditDialog({ open: true, user });
    };

    const handleDeleteUser = (user) => {
        setDeleteDialog({ open: true, user });
    };

    const saveUserChanges = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${getApiUrl()}/admin/users/${editDialog.user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess('User updated successfully');
                setEditDialog({ open: false, user: null });
                loadUsers();
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Error updating user');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteUser = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${getApiUrl()}/admin/users/${deleteDialog.user.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setSuccess('User deleted successfully');
                setDeleteDialog({ open: false, user: null });
                loadUsers();
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Error deleting user');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AdminIcon sx={{ mr: 2 }} />
                    Admin Panel
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* API Configuration Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom>
                                API Configuration
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Control API endpoint settings for development and production
                            </Typography>
                            <TestModeToggle showAlways={true} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* User Statistics Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom>
                                User Statistics
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                <Typography variant="h4">
                                    {users?.length || 0}
                                </Typography>
                                <Typography variant="body1" sx={{ ml: 1 }}>
                                    Total Users
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {users?.filter(user => user.is_admin)?.length || 0} Administrators
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={loadUsers}
                                disabled={loading}
                            >
                                Refresh
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* Users Table */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            User Management
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Username</TableCell>
                                        <TableCell>Full Name</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>User ID</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {user.is_admin ? <AdminIcon sx={{ mr: 1, color: 'primary.main' }} /> : <PersonIcon sx={{ mr: 1 }} />}
                                                    {user.username}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{user.full_name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.is_admin ? 'Admin' : 'User'}
                                                    color={user.is_admin ? 'primary' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                    {user.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => handleEditUser(user)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                {user.username !== 'pedro' && (
                                                    <IconButton
                                                        onClick={() => handleDeleteUser(user)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {(users?.length === 0) && !loading && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">No users found</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Edit User Dialog */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Full Name"
                        fullWidth
                        variant="outlined"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.is_admin}
                                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                            />
                        }
                        label="Administrator"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
                    <Button onClick={saveUserChanges} variant="contained" disabled={loading}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user "{deleteDialog.user?.username}"?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
                    <Button onClick={confirmDeleteUser} color="error" variant="contained" disabled={loading}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}