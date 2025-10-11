import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, TextField, Typography, Box, Stack, Alert
} from '@mui/material';
import { getApiUrl, apiConfig } from '../config/apiConfig';

export default function Welcome() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async () => {
    const token = localStorage.getItem('token');

    if (!username || !fullName || !password) {
      setErrorMsg("Username, Nombre Completo y Contraseña son obligatorios.");
      return;
    }

    try {
      const response = await apiConfig.fetchWithFallback('register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          full_name: fullName,
          email: email || null,
          store_name: storeName || null,
          hashed_password: password
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Usuario creado exitosamente. Redirigiendo al dashboard...');
        setErrorMsg('');
        setUsername('');
        setFullName('');
        setEmail('');
        setStoreName('');
        setPassword('');

        // Esperar 2 segundos antes de navegar para que el usuario vea el mensaje
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        const errorDetail = Array.isArray(data.detail)
          ? data.detail.map((e) => e.msg).join(', ')
          : (data.detail || 'Error al registrar usuario.');
        setSuccessMsg('');
        setErrorMsg(errorDetail);
      }
    } catch (err) {
      setSuccessMsg('');
      setErrorMsg('Error de conexión con el servidor.');
    }
  };
  return (
    <Box sx={{ padding: 4, maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        Registro de Usuario
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Complete los campos para crear un nuevo usuario en el sistema
      </Typography>

      <Box mt={2}>
        <Stack spacing={3} mt={2}>
          <TextField
            label="Nombre de Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            placeholder="Ingrese el nombre de usuario"
            helperText="El nombre de usuario debe ser único en el sistema"
          />
          <TextField
            label="Nombre Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
            placeholder="Ingrese el nombre completo del usuario"
            helperText="Este nombre se mostrará en el sistema"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            placeholder="Ingrese el email del usuario (opcional)"
            helperText="Email para contacto y notificaciones"
          />
          <TextField
            label="Nombre de la Tienda"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            fullWidth
            placeholder="Ingrese el nombre de la tienda (opcional)"
            helperText="Nombre de la tienda del usuario"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            placeholder="Ingrese una contraseña segura"
            helperText="La contraseña debe tener al menos 6 caracteres"
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegister}
              sx={{ flex: 1 }}
            >
              Crear Usuario
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/dashboard')}
              sx={{ flex: 1 }}
            >
              Cancelar
            </Button>
          </Box>
        </Stack>
        {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mt: 2 }}>{successMsg}</Alert>}
      </Box>
    </Box>
  );
}
