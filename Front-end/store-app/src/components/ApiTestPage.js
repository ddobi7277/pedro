import React from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Alert,
    Divider
} from '@mui/material';
import { apiConfig } from '../config/apiConfig';
import TestModeToggle from './TestModeToggleNew';

const ApiTestPage = () => {
    const [status, setStatus] = React.useState(null);
    const [testResult, setTestResult] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        updateStatus();
    }, []);

    const updateStatus = () => {
        const currentStatus = apiConfig.getStatus();
        setStatus(currentStatus);
    };

    const testConnection = async () => {
        setIsLoading(true);
        setTestResult(null);

        try {
            const response = await apiConfig.fetchWithFallback('docs');
            if (response.ok) {
                setTestResult({
                    success: true,
                    message: 'Conexión exitosa',
                    url: response.url
                });
            } else {
                setTestResult({
                    success: false,
                    message: `Error: ${response.status}`,
                    url: response.url
                });
            }
        } catch (error) {
            if (error.message === 'SERVER_ERROR') {
                setTestResult({
                    success: false,
                    message: 'Todos los servidores están fuera de línea',
                    error: error.message
                });
            } else {
                setTestResult({
                    success: false,
                    message: 'Error de red',
                    error: error.message
                });
            }
        } finally {
            setIsLoading(false);
            updateStatus();
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={1} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Prueba de Conectividad API
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph>
                    Pruebe la conectividad con los servidores disponibles.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={testConnection}
                        disabled={isLoading}
                        size="large"
                    >
                        {isLoading ? 'Probando...' : 'Probar Conexión'}
                    </Button>
                </Box>

                {testResult && (
                    <Alert
                        severity={testResult.success ? 'success' : 'error'}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1">
                            <strong>Resultado:</strong> {testResult.message}
                        </Typography>
                        {testResult.url && (
                            <Typography variant="body2">
                                <strong>URL:</strong> {testResult.url}
                            </Typography>
                        )}
                        {testResult.error && (
                            <Typography variant="body2">
                                <strong>Error:</strong> {testResult.error}
                            </Typography>
                        )}
                    </Alert>
                )}

                {status && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Estado Actual:
                        </Typography>
                        <Alert severity="info">
                            <Typography variant="body2">
                                <strong>Entorno:</strong> {status.isDevelopment ? 'Desarrollo' : 'Producción'}<br />
                                <strong>Modo Test:</strong> {status.testMode ? 'Activado' : 'Desactivado'}<br />
                                <strong>URL Actual:</strong> {status.currentBaseUrl}<br />
                                <strong>Secuencia:</strong> {status.fallbackSequence.join(' → ')}
                            </Typography>
                        </Alert>
                    </Box>
                )}

                <TestModeToggle />
            </Paper>
        </Container>
    );
};

export default ApiTestPage;