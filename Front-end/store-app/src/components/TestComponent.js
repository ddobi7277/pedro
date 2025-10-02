import React from 'react';
import { Typography, Container } from '@mui/material';

const TestComponent = () => {
    return (
        <Container>
            <Typography variant="h4">
                Prueba de compilación exitosa
            </Typography>
            <Typography variant="body1">
                El sistema de fallback está funcionando correctamente.
            </Typography>
        </Container>
    );
};

export default TestComponent;