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
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Article as LogIcon
} from '@mui/icons-material';
import { apiConfig, getApiUrl } from '../config/apiConfig';
import TestModeToggle from './TestModeToggle';

export default function AdminPanel() {
    // Helper function to get valid token
    const getValidToken = () => {
        const storedToken = localStorage.getItem('token');
        return storedToken && storedToken !== 'null' && storedToken !== 'undefined' ? storedToken : null;
    };

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editDialog, setEditDialog] = useState({ open: false, user: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        store_name: '',
        is_admin: false
    });

    // Estados para logs
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState('');
    const [showLogs, setShowLogs] = useState(false);

    // Estado para controlar expansión de User Management
    const [showUserManagement, setShowUserManagement] = useState(true);

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
            const token = getValidToken();
            if (!token) {
                setError('No valid token found');
                setUsers([]);
                setLoading(false);
                return;
            }

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

    const loadLogs = async () => {
        setLogsLoading(true);
        setLogsError('');
        try {
            const token = getValidToken();
            if (!token) {
                setLogsError('No valid token found');
                setLogs([]);
                setLogsLoading(false);
                return;
            }

            // Intentar endpoint con timestamps precisos primero
            let response;
            let isPrecise = false;

            try {
                response = await apiConfig.fetchWithFallback('logtrack-precise', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    isPrecise = data.precise || false;
                    console.log(`Logs cargados con timestamps ${isPrecise ? 'precisos' : 'estimados'}`);
                    setLogs(data.logs || []);
                } else {
                    throw new Error('Precise endpoint failed');
                }
            } catch (preciseError) {
                console.log('Endpoint preciso no disponible, usando endpoint básico');

                // Fallback al endpoint básico si el preciso no está disponible
                response = await apiConfig.fetchWithFallback('logtrack', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setLogs(data.logs || []);
                } else {
                    const errorData = await response.json();
                    setLogsError(errorData.detail || 'Error loading logs');
                    setLogs([]);
                }
            }
        } catch (error) {
            if (error.message === 'SERVER_ERROR') {
                setLogsError('No se pudo conectar con ningún servidor disponible.');
            } else {
                setLogsError('Error de conexión: ' + error.message);
            }
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleEditUser = (user) => {
        console.log('🔍 [DEBUG] User object received:', user);
        console.log('🔍 [DEBUG] User email:', user.email);
        console.log('🔍 [DEBUG] User store_name:', user.store_name);
        
        setFormData({
            username: user.username,
            full_name: user.full_name,
            email: user.email || '',
            store_name: user.store_name || '',
            is_admin: user.is_admin
        });
        setEditDialog({ open: true, user });
    };

    const handleDeleteUser = (user) => {
        setDeleteDialog({ open: true, user });
    };

    const saveUserChanges = async () => {
        console.log('saveUserChanges called!');
        console.log('🔍 [DEBUG] Current formData:', formData);
        console.log('🔍 [DEBUG] formData.email:', formData.email);
        console.log('🔍 [DEBUG] formData.store_name:', formData.store_name);
        console.log('editDialog.user:', editDialog.user);

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = getValidToken();
            if (!token) {
                console.log('No valid token found');
                setError('No valid token found');
                setLoading(false);
                return;
            }

            console.log('Token found, making request...');
            console.log('URL:', `admin/users/${editDialog.user.id}`);
            console.log('Request body:', JSON.stringify(formData));

            const response = await apiConfig.fetchWithFallback(`admin/users/${editDialog.user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (response.ok) {
                console.log('Update successful!');
                setSuccess('User updated successfully');
                setEditDialog({ open: false, user: null });
                loadUsers();
            } else {
                const errorData = await response.json();
                console.log('Error response:', errorData);
                setError(errorData.detail || 'Error updating user');
            }
        } catch (err) {
            console.log('Fetch error:', err);
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
            const token = getValidToken();
            if (!token) {
                setError('No valid token found');
                setLoading(false);
                return;
            }

            const response = await apiConfig.fetchWithFallback(`admin/users/${deleteDialog.user.id}`, {
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
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon />
                                    <Typography variant="h6">
                                        User Management
                                    </Typography>
                                </Box>
                                <Button
                                    onClick={() => setShowUserManagement(!showUserManagement)}
                                    endIcon={showUserManagement ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    variant="contained"
                                    size="small"
                                >
                                    {showUserManagement ? 'Hide Users' : 'Show Users'}
                                </Button>
                            </Box>

                            {showUserManagement && (
                                <Box sx={{ mt: 2 }}>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Username</TableCell>
                                                    <TableCell>Full Name</TableCell>
                                                    <TableCell>Email</TableCell>
                                                    <TableCell>Store Name</TableCell>
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
                                                        <TableCell>{user.email || '-'}</TableCell>
                                                        <TableCell>{user.store_name || '-'}</TableCell>
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
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Server Logs Section */}
            <Box sx={{ mt: 4 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LogIcon />
                                <Typography variant="h6">
                                    Server Logs
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    onClick={loadLogs}
                                    disabled={logsLoading}
                                    startIcon={<RefreshIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    Refresh
                                </Button>
                                <Button
                                    onClick={() => setShowLogs(!showLogs)}
                                    endIcon={showLogs ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    variant="contained"
                                    size="small"
                                >
                                    {showLogs ? 'Hide Logs' : 'Show Logs'}
                                </Button>
                            </Box>
                        </Box>

                        {showLogs && (
                            <Box sx={{ mt: 2 }}>
                                {logsError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {logsError}
                                    </Alert>
                                )}

                                {logsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <Typography>Loading logs...</Typography>
                                    </Box>
                                ) : logs.length > 0 ? (
                                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Time</TableCell>
                                                    <TableCell>Type</TableCell>
                                                    <TableCell>Log Message</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {logs.map((log, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>{log.date}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {log.time}
                                                                {log.estimated && (
                                                                    <Chip
                                                                        label="~"
                                                                        size="small"
                                                                        sx={{
                                                                            minWidth: '20px',
                                                                            height: '16px',
                                                                            fontSize: '10px',
                                                                            bgcolor: 'warning.light'
                                                                        }}
                                                                        title="Timestamp estimado basado en posición en archivo"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={log.type}
                                                                size="small"
                                                                color={
                                                                    log.type === 'INFO' ? 'primary' :
                                                                        log.type === 'TOKEN' ? 'secondary' :
                                                                            log.type === 'CLOUDFLARE' ? 'info' :
                                                                                log.type === 'SYSTEM' ? 'warning' :
                                                                                    'default'
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.75rem',
                                                                    whiteSpace: 'pre-wrap',
                                                                    maxWidth: '400px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                                title={log.log_msg}
                                                            >
                                                                {log.log_msg}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 3 }}>
                                        <Typography color="text.secondary">No logs available</Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* Edit User Dialog */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        variant="outlined"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        sx={{ mb: 2 }}
                        helperText="Username will be updated in all related records (items, sales, etc.)"
                    />
                    <TextField
                        margin="dense"
                        label="Full Name"
                        fullWidth
                        variant="outlined"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        sx={{ mb: 2 }}
                        helperText="Optional - User email address"
                    />
                    <TextField
                        margin="dense"
                        label="Store Name"
                        fullWidth
                        variant="outlined"
                        value={formData.store_name}
                        onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                        sx={{ mb: 2 }}
                        helperText="Optional - Name of the user's store"
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