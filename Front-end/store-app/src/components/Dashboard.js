import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListItems from './ListItems';
import AdminPanel from './AdminPanel';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import { getApiUrl, apiConfig } from '../config/apiConfig';
import { logDebug, logAuth, logAPI, logError, logSuccess, logNav, logData } from '../utils/logger';
import ServerErrorHandler, { ServerErrorScreen } from './ServerErrorHandler';

export default function Dashboard() {
  logDebug('Dashboard component rendering');
  const navigate = useNavigate();
  const [data, setData] = useState([]);

  const [token,] = useState(localStorage.getItem('token'));
  const [isLoaded, setIsLoaded] = useState(false);
  const [item, setItem] = useState({})
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [cant, setCant] = useState({})
  const [gender, setGender] = useState('Masculino')
  const [edit, setEdit] = useState(false)
  const [categoryList, setCategoryList] = useState(() => ['Aseo', 'Electrodomesticos']);
  const [username, setUsername] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Estados para manejo de errores de servidor
  const [serverError, setServerError] = useState(false);
  const [serverErrorDialog, setServerErrorDialog] = useState(false);
  const [showErrorScreen, setShowErrorScreen] = useState(false);


  const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '90%',
    height: '90%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
      maxWidth: '1120px',
    },
    boxShadow:
      'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
      boxShadow:
        'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
  }));

  // const [promptShown, setPromptShown] = useState(false);
  const verifiToken = async () => {
    try {
      // Usar fetchWithFallback para manejo automático de errores de servidor
      const response = await apiConfig.fetchWithFallback(`verify-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
      });

      if (response.ok) {
        const data1 = await response.json()
        const statusMessage = data1["Authentication Status"];

        // Extraer el nombre después de "by "
        let username = '';
        if (statusMessage.includes("by ")) {
          username = statusMessage.split("by ")[1].trim();
        }
        logAuth(`User authenticated: ${username}`);

        // Verificar si es admin basándose en el username primero (para compatibilidad)
        if (username === 'pedro') {
          setIsAdmin(true); // Establecer como admin inmediatamente

          // Intentar verificar con el endpoint admin solo si está disponible
          try {
            const adminResponse = await apiConfig.fetchWithFallback('admin/status', {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
              }
            });

            if (adminResponse.ok) {
              const adminData = await adminResponse.json();
              setIsAdmin(adminData.is_admin);
              logDebug('Admin status verified from server', adminData);
            } else {
              logDebug('Admin endpoint not available, using username-based verification');
            }
          } catch (error) {
            logDebug('Admin endpoint error, using fallback', error);
          }
        } else {
          setIsAdmin(false);
        }

        // Obtener items del usuario
        logAPI('GET', 'get_seller_items', 'Fetching user items');
        const seller_iitem = await apiConfig.fetchWithFallback('get_seller_items', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
        });

        const seller_items = await seller_iitem.json();
        logData('User items loaded', seller_items);
        setData(seller_items);
        setIsLoaded(true);
        setUsername(username);

        // Guardar username en localStorage para verificaciones de admin
        localStorage.setItem('username', username);

        logData('User data loaded', { username, isAdmin: username === 'pedro' });
      } else {
        logAuth('Token verification failed - redirecting to login');
        // Solo remover token si es un error de autenticación real (401 con servidor funcionando)
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
        }
        logNav('Redirecting to login due to invalid token');
        navigate('/');
      }
    } catch (error) {
      logError('Token verification error', error);

      // Manejar error específico de servidor
      if (error.message === 'SERVER_ERROR') {
        logError('All servers unavailable during token verification', error);
        setServerErrorDialog(true);
      } else if (error.message === 'NETWORK_ERROR') {
        logError('Network error during token verification', error);
        setServerErrorDialog(true);
      } else {
        // Solo remover token en errores no relacionados con conectividad
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        logNav('Redirecting to login due to authentication error');
        navigate('/');
      }
    }
  };

  // Manejar reintentos de conexión
  const handleRetryConnection = async () => {
    try {
      const success = await apiConfig.retryConnection();
      if (success) {
        setServerErrorDialog(false);
        setShowErrorScreen(false);
        logSuccess('Connection restored');
        // Reintentar verificación de token
        await verifiToken();
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

  logData('Items loaded', data)
  useEffect(() => {
    (async () => {
      await verifiToken()
      // Verificar estado de servidores después del login
      if (apiConfig.isUserAdmin()) {
        await apiConfig.checkAllServersStatus();
      }
    })();
    logDebug('Dashboard useEffect data', data)

    // Escuchar cambios de servidor para recargar datos
    const handleServerChange = (event) => {
      console.log('🔄 Server changed in Dashboard, reloading data...', event.detail);
      // Recargar datos cuando cambie el servidor
      verifiToken();
    };

    window.addEventListener('serverChanged', handleServerChange);
    window.addEventListener('serverSwitched', handleServerChange);

    return () => {
      window.removeEventListener('serverChanged', handleServerChange);
      window.removeEventListener('serverSwitched', handleServerChange);
    };
  }, [token]);

  /*     useEffect(() => {
          const timer = setTimeout(() => {
              if (!tasaCambio && !promptShown) {
                const tasaCambioInput = parseInt(prompt('Introduzca la taza de cambio del USD'));
                setTazaCambio(tasaCambioInput);
                setPromptShown(true);
              }
            }, 1000); // 1-second delay
           return () => clearTimeout(timer);
            
          
        }, [tasaCambio, promptShown]);
        
        */


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
    <div className="container">
      {isAdmin ? (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
              <Tab label="My Store" />
              <Tab label="Admin Panel" />
            </Tabs>
          </Box>

          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <ListItems items={data} setItem={setItem} setEdit={setEdit} username={username} />
            )}
            {activeTab === 1 && (
              <AdminPanel />
            )}
          </Box>
        </Box>
      ) : (
        <ListItems items={data} setItem={setItem} setEdit={setEdit} username={username} />
      )}

      {/* Diálogo de error de servidor */}
      <ServerErrorHandler
        open={serverErrorDialog}
        onRetry={handleRetryConnection}
        onCancel={handleCancelConnection}
        title="Problemas con el servidor"
        message="No se pudo conectar con ningún servidor disponible. Por favor, inténtelo de nuevo."
      />
    </div>
  );
}