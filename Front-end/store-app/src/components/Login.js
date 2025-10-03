
import { useNavigate } from "react-router-dom";
import { getApiUrl, apiConfig } from '../config/apiConfig';
import { logDebug, logAuth, logAPI, logError, logSuccess, logNav } from '../utils/logger';
import ServerErrorHandler, { ServerErrorScreen } from './ServerErrorHandler';


import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { Alert, CircularProgress } from '@mui/material';

import AppTheme from './LoginComponents/AppTheme';
import ColorModeSelect from './LoginComponents/ColorModeSelect';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function Login(props) {
  const navigate = useNavigate();
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [errorSms, setErrorSms] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Estados para manejo de errores de servidor
  const [serverError, setServerError] = React.useState(false);
  const [serverErrorDialog, setServerErrorDialog] = React.useState(false);
  const [showErrorScreen, setShowErrorScreen] = React.useState(false);


  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent form submission if validation fails
    logDebug('Login attempt started', { username });

    if (validateInputs()) {
      logDebug('Validation passed, preparing API call');
      setLoading(true);
      const formDetails = new URLSearchParams();
      formDetails.append('username', username);
      formDetails.append('password', password);

      try {
        // Usar fetchWithFallback del apiConfig para manejo automático de fallback
        logAPI('POST', 'token', 'Login credentials');

        const response = await apiConfig.fetchWithFallback('token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formDetails,
        });

        const data = await response.json();

        if (response.ok) {
          logSuccess('Login successful', { username, hasToken: !!data.access_token });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token', data.access_token); // Guardar también como 'token' para compatibilidad
          localStorage.setItem('username', username); // Guardar username para verificaciones
          logNav('Redirecting to dashboard');
          navigate('/dashboard');
        } else {
          logAuth('Login failed - Invalid credentials', { username, status: response.status });
          setErrorSms(data.detail || 'Credenciales inválidas. Por favor, inténtelo de nuevo.');
          setOpen(true);
        }
      } catch (error) {
        logError('Login API call failed', error);

        // Manejar error específico de servidor
        if (error.message === 'SERVER_ERROR') {
          logError('All servers unavailable', error);
          setServerErrorDialog(true);
        } else if (error.message === 'NETWORK_ERROR') {
          setErrorSms('Servidor principal no disponible. Por favor, inténtelo más tarde o contacte al administrador.');
          setOpen(true);
        } else {
          setErrorSms('Error de conexión. Por favor, verifique su conexión a internet.');
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    } else {
      logDebug('Validation failed');
    }
  };

  const validateInputs = () => {
    let isValid = true;

    if (!username || username.length < 3) {
      setUsernameError(true);
      setUsernameErrorMessage('Username must be at least 3 characters long.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  // Manejar reintentos de conexión
  const handleRetryConnection = async () => {
    try {
      const success = await apiConfig.retryConnection();
      if (success) {
        setServerErrorDialog(false);
        setShowErrorScreen(false);
        logSuccess('Connection restored');
      } else {
        logError('Retry failed, showing error screen');
        setServerErrorDialog(false);
        setShowErrorScreen(true);
      }
    } catch (error) {
      logError('Retry connection failed', error);
      setServerErrorDialog(false);
      setShowErrorScreen(true);
    }
  };

  // Manejar cancelación del diálogo de error
  const handleCancelConnection = () => {
    setServerErrorDialog(false);
    setShowErrorScreen(true);
    logError('User canceled connection retry');
  };

  // Mostrar pantalla de error completa si el usuario canceló
  if (showErrorScreen) {
    return (
      <ServerErrorScreen
        onRetry={handleRetryConnection}
        title="Lo sentimos mucho"
        message="Problemas con el servidor. Inténtelo en otro momento."
      />
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">

          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>

          <FormControl>
            <FormLabel htmlFor="username">Username/Nombre de Usuario</FormLabel>
            <TextField
              error={usernameError}
              helperText={usernameErrorMessage}
              id="username"
              type="username"
              name="username"
              placeholder="Your username/ Tu usuario"
              autoComplete="username"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={usernameError ? 'error' : 'primary'}
              sx={{ ariaLabel: 'username' }}
              onChange={(e) => { setUsername(e.target.value) }}
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <FormLabel htmlFor="password">Password/Contrasena</FormLabel>
              <Link
                component="button"
                type="button"
                onClick={handleClickOpen}
                variant="body2"
                sx={{ alignSelf: 'baseline' }}
              >
              </Link>
            </Box>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="current-password"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={passwordError ? 'error' : 'primary'}
              onChange={(e) => { setPassword(e.target.value) }}
            />
          </FormControl>
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />

          <Button
            type="button"
            fullWidth
            variant="contained"
            onClick={(e) => {
              console.log('Button clicked!'); // Debug log
              handleSubmit(e);
            }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Error Alert */}
          {open && (
            <Alert severity="error" onClose={handleClose}>
              {errorSms}
            </Alert>
          )}

        </Card>

        {/* Diálogo de error de servidor */}
        <ServerErrorHandler
          open={serverErrorDialog}
          onRetry={handleRetryConnection}
          onCancel={handleCancelConnection}
          title="Problemas con el servidor"
          message="No se pudo conectar con ningún servidor disponible. Por favor, inténtelo de nuevo."
        />

      </SignInContainer>
    </AppTheme>
  );
}