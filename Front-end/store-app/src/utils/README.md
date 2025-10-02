# Sistema de Logging Inteligente

## 📋 Descripción

Este sistema de logging está diseñado para mostrar información relevante según el entorno:

- **🏠 Localhost (Desarrollo)**: Muestra TODOS los logs detallados
- **🧪 Modo Test**: Muestra logs detallados independientemente del entorno  
- **🌐 Producción**: Solo muestra logs importantes (errores, éxitos, autenticación)

## 🔧 Funciones Disponibles

### Logs Importantes (Siempre se muestran)
- `logInfo()` - Información general importante
- `logError()` - Errores del sistema
- `logSuccess()` - Operaciones exitosas
- `logWarn()` - Advertencias importantes

### Logs de Desarrollo (Solo localhost/test)
- `logDebug()` - Información de depuración
- `logAPI()` - Llamadas a la API
- `logNav()` - Navegación entre páginas
- `logData()` - Datos cargados (muestra cantidad en producción)

### Logs Especiales
- `logAuth()` - Autenticación (filtrado en producción)
- `logStatus()` - Estado del sistema

## 📊 Ejemplos de Uso

```javascript
import { logInfo, logDebug, logError, logAPI, logData } from '../utils/logger';

// Siempre se muestra
logInfo('Aplicación iniciada');
logError('Error de conexión', error);
logSuccess('Usuario creado correctamente');

// Solo en desarrollo/test
logDebug('Validando formulario', formData);
logAPI('POST', '/api/users', userData);
logData('Usuarios cargados', users);
```

## 🌟 Beneficios

✅ **Producción limpia**: Solo logs esenciales
✅ **Desarrollo completo**: Información detallada para debug
✅ **Modo test flexible**: Control manual de los logs
✅ **Categorización clara**: Diferentes tipos de logs con iconos
✅ **Datos protegidos**: Información sensible filtrada en producción

## 🎯 Resultado

### En Desarrollo (localhost:3000)
```
🔍 [DEBUG] Login attempt started {username: "pedro"}
🌐 [API] POST http://localhost:8000/token Login credentials
✅ Login successful
🔐 Authentication: Token received for user: pedro
🧭 [NAV] Redirecting to Dashboard
📊 [DATA] User items loaded (8 items)
```

### En Producción (cubaunify.uk)
```
✅ Login successful
🔐 Authentication: Token received
📊 User items loaded: 8 items loaded
```