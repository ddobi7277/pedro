import React from 'react';
import {
    Box,
    Switch,
    FormControlLabel,
    Chip,
    Paper,
    Typography,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Divider,
    CircularProgress,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import {
    Computer as ComputerIcon,
    Public as PublicIcon,
    Settings as SettingsIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { apiConfig } from '../config/apiConfig';

const TestModeContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: theme.spacing(1, 0),
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
    border: '1px solid',
    borderColor: theme.palette.mode === 'dark' ? '#333' : '#ddd',
}));

const ServerListItem = styled(ListItem, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    border: '2px solid',
    borderColor: isActive ? theme.palette.primary.main : theme.palette.divider,
    borderRadius: theme.spacing(1),
    margin: theme.spacing(0.5, 0),
    backgroundColor: isActive ? theme.palette.primary.light + '20' : 'transparent',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    }
}));

export default function TestModeToggle({ currentUser, showAlways = false }) {
    const [config, setConfig] = React.useState(null);
    const [isChecking, setIsChecking] = React.useState(false);

    React.useEffect(() => {
        updateStatus();
        // Verificar estado usando el intervalo configurado (por defecto 20 minutos)
        const interval = setInterval(checkServersAndUpdate, apiConfig.checkInterval);

        console.log(`🕐 Server status check interval: ${apiConfig.getCheckIntervalMinutes()} minutes`);

        // Escuchar eventos de cambio automático de servidor
        const handleServerSwitch = (event) => {
            console.log('🔄 Received server switch event:', event.detail);
            // Actualizar estado inmediatamente cuando hay cambio automático
            updateStatus();
        };

        window.addEventListener('serverSwitched', handleServerSwitch);

        return () => {
            clearInterval(interval);
            window.removeEventListener('serverSwitched', handleServerSwitch);
        };
    }, []);

    const updateStatus = () => {
        const status = apiConfig.getStatus();
        setConfig(status);
    };

    const checkServersAndUpdate = async () => {
        if (isChecking) return; // Evitar verificaciones superpuestas

        try {
            setIsChecking(true);
            await apiConfig.checkAllServersStatus();
            updateStatus();
        } catch (error) {
            console.error('Error checking servers:', error);
        } finally {
            setIsChecking(false);
        }
    };

    // Solo mostrar para usuarios admin o si showAlways es true
    const isAdmin = showAlways || (currentUser && (currentUser.username === 'pedro' || currentUser.username === 'admin'));

    if (!isAdmin || !config) {
        return null;
    }

    const handleServerClick = async (serverType) => {
        setIsChecking(true);

        try {
            const isTestMode = serverType === 'development';

            // Primero verificar el estado del servidor al que queremos cambiar
            const targetServerUrl = isTestMode ? apiConfig.DEVELOPMENT_URL : apiConfig.PRODUCTION_URL;
            const serverAvailable = await apiConfig.verifyServerStatus(targetServerUrl);

            if (!serverAvailable) {
                console.log(`❌ ${serverType === 'development' ? 'localhost:8000' : 'cubaunify.uk'} is not available`);
                // El servidor ya está marcado como offline por verifyServerStatus
                updateStatus();
                return;
            }

            // Si el servidor está disponible, proceder con el cambio
            const serverOnline = await apiConfig.switchToServer(isTestMode);

            if (serverOnline) {
                console.log(`✅ Successfully switched to ${serverType === 'development' ? 'localhost:8000' : 'cubaunify.uk'}`);

                // Actualizar inmediatamente el estado de la UI
                updateStatus();

                // Trigger a refresh of any data that depends on the server
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('serverChanged', {
                    detail: {
                        serverType,
                        isTestMode,
                        serverUrl: apiConfig.currentBaseUrl
                    }
                }));

            } else {
                console.log(`❌ Failed to switch to ${serverType === 'development' ? 'localhost:8000' : 'cubaunify.uk'}`);
            }

            // Solo actualizar el estado de la UI
            updateStatus();
        } catch (error) {
            console.error('Error switching servers:', error);
        } finally {
            setIsChecking(false);
        }
    }; const getCurrentServer = () => {
        if (config.testMode) {
            return 'development';
        }
        return 'production';
    };

    const getServerStatus = (serverType) => {
        const url = serverType === 'production'
            ? (config.PRODUCTION_URL || 'https://cubaunify.uk')
            : (config.DEVELOPMENT_URL || 'http://localhost:8000');
        const status = config.urlStatus && config.urlStatus[url];
        return status;
    };

    const getServerStatusText = (serverType) => {
        const status = getServerStatus(serverType);
        const currentServer = getCurrentServer();

        if (serverType === currentServer) {
            return status === 'online' ? 'Activo' : 'Not Working';
        } else {
            return status === 'online' ? 'Disponible' : 'No disponible';
        }
    };

    const getServerStatusColor = (serverType) => {
        const status = getServerStatus(serverType);
        const currentServer = getCurrentServer();

        if (serverType === currentServer) {
            return status === 'online' ? 'primary' : 'error';
        } else {
            return status === 'online' ? 'success' : 'default';
        }
    };

    const currentServer = getCurrentServer();

    return (
        <TestModeContainer elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">
                    Configuración de Servidores
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Servidor actual: <strong>{config.currentBaseUrl}</strong>
            </Typography>

            {config.isDevelopment && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Seleccionar Servidor:
                    </Typography>

                    <List sx={{ p: 0 }}>
                        {/* Servidor de Producción (cubaunify.uk) */}
                        <ServerListItem
                            isActive={currentServer === 'production'}
                            onClick={() => handleServerClick('production')}
                        >
                            <ListItemIcon>
                                <PublicIcon color={currentServer === 'production' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Producción (cubaunify.uk)"
                                secondary={getServerStatusText('production')}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getServerStatus('production') === 'online' && <CheckIcon color="success" fontSize="small" />}
                                {getServerStatus('production') === 'offline' && <ErrorIcon color="error" fontSize="small" />}
                                {isChecking && <CircularProgress size={16} />}
                                <Chip
                                    label={getServerStatusText('production')}
                                    color={getServerStatusColor('production')}
                                    size="small"
                                />
                            </Box>
                        </ServerListItem>

                        {/* Servidor de Desarrollo (localhost:8000) */}
                        <ServerListItem
                            isActive={currentServer === 'development'}
                            onClick={() => handleServerClick('development')}
                        >
                            <ListItemIcon>
                                <ComputerIcon color={currentServer === 'development' ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Pruebas (localhost:8000)"
                                secondary={getServerStatusText('development')}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getServerStatus('development') === 'online' && <CheckIcon color="success" fontSize="small" />}
                                {getServerStatus('development') === 'offline' && <ErrorIcon color="error" fontSize="small" />}
                                {isChecking && <CircularProgress size={16} />}
                                <Chip
                                    label={getServerStatusText('development')}
                                    color={getServerStatusColor('development')}
                                    size="small"
                                />
                            </Box>
                        </ServerListItem>
                    </List>
                </Box>
            )}

            {/* Configuración de intervalo de verificación */}
            {config.isDevelopment && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Frecuencia de Verificación Automática:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                            value={apiConfig.getCheckIntervalMinutes()}
                            onChange={(e) => {
                                apiConfig.setCheckInterval(e.target.value);
                                // Reiniciar el componente para aplicar el nuevo intervalo
                                window.location.reload();
                            }}
                        >
                            {apiConfig.getIntervalOptions().map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        Actual: cada {apiConfig.getCheckIntervalMinutes()} minutos
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Información del comportamiento actual */}
            <Alert severity={config.testMode ? "warning" : "info"} sx={{ mt: 1 }}>
                <Typography variant="body2">
                    <strong>{config.testMode ? 'Modo Test Activado:' : 'Modo Normal:'}</strong><br />
                    {config.testMode
                        ? 'Las peticiones van directamente a localhost:8000'
                        : 'Las peticiones intentan cubaunify.uk primero, luego localhost:8000 como fallback'
                    }
                </Typography>
            </Alert>

            {!config.isDevelopment && (
                <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        <strong>Modo Producción:</strong> Todas las peticiones van a cubaunify.uk
                    </Typography>
                </Alert>
            )}
        </TestModeContainer>
    );
}