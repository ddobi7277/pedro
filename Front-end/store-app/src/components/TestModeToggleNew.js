import React, { useState, useEffect } from 'react';
import {
    FormControlLabel,
    Switch,
    Paper,
    Typography,
    Box,
    Alert,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Computer as ComputerIcon,
    Public as PublicIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { apiConfig } from '../config/apiConfig';

const TestModeToggle = () => {
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        updateStatus();
    }, []);

    const updateStatus = () => {
        const status = apiConfig.getStatus();
        setConfig(status);
    };

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            apiConfig.toggleTestMode();
            // Pequeña pausa para que el usuario vea el cambio
            await new Promise(resolve => setTimeout(resolve, 500));
            updateStatus();
        } catch (error) {
            console.error('Error toggling test mode:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetConnection = async () => {
        setIsLoading(true);
        try {
            await apiConfig.retryConnection();
            updateStatus();
        } catch (error) {
            console.error('Error resetting connection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!config) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'success';
            case 'offline': return 'error';
            case 'error': return 'warning';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': return <CheckIcon />;
            case 'offline': return <ErrorIcon />;
            case 'error': return <WarningIcon />;
            default: return null;
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, m: 2, maxWidth: 600 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">
                    Configuración de API
                </Typography>
            </Box>

            {/* Información del entorno */}
            <Alert
                severity={config.isDevelopment ? "info" : "success"}
                sx={{ mb: 2 }}
            >
                <Typography variant="body2">
                    <strong>Entorno:</strong> {config.isDevelopment ? 'Desarrollo (localhost:3000)' : 'Producción'}
                </Typography>
            </Alert>

            {/* Control del modo test */}
            {config.isDevelopment && (
                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.testMode}
                                onChange={handleToggle}
                                disabled={isLoading}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body1">
                                Modo Test (Saltar cubaunify.uk)
                            </Typography>
                        }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        {config.testMode
                            ? 'Conectando directamente a localhost:8000'
                            : 'Intentando cubaunify.uk primero, luego localhost:8000'
                        }
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Estado actual */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Estado Actual:
                </Typography>
                <Chip
                    icon={config.currentBaseUrl.includes('localhost') ? <ComputerIcon /> : <PublicIcon />}
                    label={config.currentBaseUrl}
                    color={config.serverError ? 'error' : 'primary'}
                    variant="outlined"
                />
            </Box>

            {/* Secuencia de fallback */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Secuencia de conexión:
                </Typography>
                <List dense>
                    {config.fallbackSequence.map((server, index) => (
                        <ListItem key={server} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {index + 1}.
                                </Typography>
                            </ListItemIcon>
                            <ListItemText
                                primary={server}
                                secondary={index === 0 ? 'Prioridad principal' : 'Fallback'}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Estado de conectividad */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Estado de Servidores:
                </Typography>
                <List dense>
                    {Object.entries(config.urlStatus).map(([url, status]) => (
                        <ListItem key={url} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {getStatusIcon(status)}
                            </ListItemIcon>
                            <ListItemText
                                primary={url.replace('http://localhost:8000', 'localhost:8000').replace('https://cubaunify.uk', 'cubaunify.uk')}
                                secondary={
                                    <Chip
                                        size="small"
                                        label={status || 'No verificado'}
                                        color={getStatusColor(status)}
                                        variant="outlined"
                                    />
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Información adicional */}
            {config.isDevelopment && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Funcionamiento:</strong><br />
                        • <strong>Modo Normal:</strong> Intenta cubaunify.uk → localhost:8000<br />
                        • <strong>Modo Test:</strong> Va directo a localhost:8000<br />
                        • <strong>Error:</strong> Muestra diálogo con opciones de reintento
                    </Typography>
                </Alert>
            )}
        </Paper>
    );
};

export default TestModeToggle;