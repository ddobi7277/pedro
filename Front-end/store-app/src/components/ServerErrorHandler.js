import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper
} from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';

const ServerErrorHandler = ({
    open,
    onRetry,
    onCancel,
    title = "Problemas con el servidor",
    message = "No se pudo conectar con ningún servidor disponible. Por favor, inténtelo de nuevo."
}) => {
    const [retrying, setRetrying] = useState(false);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            await onRetry();
        } catch (error) {
            console.error('Error during retry:', error);
        } finally {
            setRetrying(false);
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            aria-labelledby="server-error-title"
        >
            <DialogTitle id="server-error-title">
                <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon color="error" />
                    <Typography variant="h6" component="span">
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                        {message}
                    </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary">
                    Esto puede ocurrir debido a:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 2 }}>
                    <Typography component="li" variant="body2" color="text.secondary">
                        Problemas temporales de conectividad
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary">
                        Mantenimiento de servidores
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary">
                        Configuración de red local
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    color="inherit"
                    disabled={retrying}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleRetry}
                    variant="contained"
                    color="primary"
                    disabled={retrying}
                    startIcon={retrying ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                    {retrying ? 'Reintentando...' : 'Intentar de nuevo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Componente para mostrar cuando se cancela (pantalla completa de error)
export const ServerErrorScreen = ({
    onRetry,
    title = "Lo sentimos mucho",
    message = "Problemas con el servidor. Inténtelo en otro momento."
}) => {
    const [retrying, setRetrying] = useState(false);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            await onRetry();
        } catch (error) {
            console.error('Error during retry:', error);
        } finally {
            setRetrying(false);
        }
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            bgcolor="background.default"
            p={3}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    maxWidth: 500,
                    borderRadius: 2
                }}
            >
                <WarningIcon
                    color="error"
                    sx={{ fontSize: 80, mb: 2 }}
                />

                <Typography variant="h4" gutterBottom color="error">
                    {title}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {message}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Nuestro equipo técnico está trabajando para resolver este problema.
                    Gracias por su paciencia.
                </Typography>

                <Button
                    onClick={handleRetry}
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={retrying}
                    startIcon={retrying ? <CircularProgress size={20} /> : <RefreshIcon />}
                    sx={{ minWidth: 150 }}
                >
                    {retrying ? 'Reintentando...' : 'Reintentar conexión'}
                </Button>
            </Paper>
        </Box>
    );
};

export default ServerErrorHandler;