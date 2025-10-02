import React from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Divider
} from '@mui/material';
import TestModeToggle from './TestModeToggleNew';

const Preferences = () => {
    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={1} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Configuración de la Aplicación
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph>
                    Ajuste la configuración de la aplicación según sus necesidades.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Configuración de API
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Controle cómo la aplicación se conecta a los servidores disponibles.
                    </Typography>

                    <TestModeToggle />
                </Box>
            </Paper>
        </Container>
    );
};

export default Preferences;