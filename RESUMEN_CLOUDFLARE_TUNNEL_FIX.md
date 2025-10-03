# Fix para Túnel CloudFlare y Estado del Servidor (Raspberry Pi)

## Problema Identificado
- El usuario reportó errores CORS/502 al intentar acceder a `https://cubaunify.uk/docs` después del reinicio del servidor
- El script de reinicio ejecutaba cloudflared en primer plano, bloqueando el proceso
- **IMPORTANTE**: El servidor corre en una Raspberry Pi y usa túnel CloudFlare para acceso público
- No había verificación adecuada del estado del túnel (se intentaba verificar localhost incorrectamente)

## Arquitectura del Sistema
```
Internet → cubaunify.uk → CloudFlare Tunnel → Raspberry Pi (uvicorn server)
```

## Soluciones Implementadas

### 1. Script de Reinicio Mejorado (`main.py`)
```bash
# ANTES (problemático):
cloudflared tunnel run mytunnel

# DESPUÉS (corregido):
nohup cloudflared tunnel run mytunnel > /tmp/cloudflared.log 2>&1 &
```

**Cambios principales:**
- Eliminación de procesos existentes de cloudflared antes del reinicio
- Ejecución de cloudflared en background con `nohup`
- Logging del túnel hacia `/tmp/cloudflared.log`
- Captura del PID del túnel para monitoreo
- Verificación de que ambos procesos (uvicorn y cloudflared) se ejecuten correctamente

### 2. Endpoint de Verificación Corregido (`/admin/server-status`)

**CORRECCIÓN IMPORTANTE**: Eliminado el request a localhost:5000 que no tenía sentido

**Nuevas características:**
- ✅ Verificación SOLO del túnel público (`https://cubaunify.uk`)
- ✅ Estado de procesos (uvicorn y cloudflared) en la Raspberry Pi
- ✅ Información detallada con timestamps
- ✅ Estados: `online`, `offline`, `partial`, `timeout`
- ❌ **ELIMINADO**: Verificación de localhost (no aplicable en este setup)

**Respuesta del endpoint:**
```json
{
    "status": "online|offline|partial",
    "message": "Mensaje descriptivo sobre el túnel CloudFlare",
    "details": {
        "timestamp": "2025-01-16 15:30:45",
        "public_tunnel": "online|offline|timeout|error", 
        "processes": {
            "uvicorn": "running|stopped",
            "cloudflared": "running|stopped"
        }
    }
}
```

### 3. UI del Admin Panel Actualizado

**Cambios reflejando la arquitectura real:**
- 🏠 Título cambiado a "Raspberry Pi Server Management"
- 🌐 Enfoque en el túnel CloudFlare (cubaunify.uk → Raspberry Pi)
- ❌ **ELIMINADO**: Referencias a "servidor local"
- 📊 Procesos mostrados como "en Raspberry Pi"
- 🎨 Iconos y descripción actualizados

**Pantalla del estado actualizada:**
```
🌐 CloudFlare Tunnel: ✅ Online
(cubaunify.uk → Raspberry Pi)
📊 Processes on Raspberry Pi:
  • Uvicorn Server: ✅ running
  • CloudFlare Daemon: ✅ running
```

## Flujo de Trabajo Corregido

### Reinicio del Servidor:
1. Usuario hace clic en "Restart Server" desde cualquier ubicación
2. Request va a `https://cubaunify.uk/admin/restart-server`
3. Sistema en Raspberry Pi ejecuta script bash:
   - Mata procesos existentes de uvicorn y cloudflared
   - Inicia uvicorn en background
   - Inicia cloudflared en background
   - Verifica que ambos procesos se ejecuten
4. Frontend espera 2 minutos y verifica estado del túnel
5. Si estado es "parcial", reintenta cada 30 segundos

### Verificación de Estado:
1. **SOLO** verifica `https://cubaunify.uk/docs` (túnel público)
2. Verifica procesos en Raspberry Pi con `pgrep`
3. Determina estado general basado en túnel CloudFlare
4. Timeout extendido a 15 segundos para requests al túnel

## Archivos Modificados

### Backend:
- `files/main.py`: 
  - Script de reinicio con cloudflared en background
  - Endpoint de estado enfocado SOLO en túnel CloudFlare
  - Eliminada verificación de localhost incorrecta

### Frontend:
- `Front-end/store-app/src/components/AdminPanel.js`: 
  - UI actualizado para reflejar arquitectura Raspberry Pi
  - Eliminadas referencias a "servidor local"
  - Enfoque en túnel CloudFlare y procesos remotos

## Resolución del Problema Original

**Antes:**
- ❌ cloudflared se ejecutaba en primer plano
- ❌ Verificación incorrecta de localhost
- ❌ No reflejaba la arquitectura real (Raspberry Pi + túnel)
- ❌ Errores CORS/502 sin diagnóstico adecuado

**Después:**
- ✅ cloudflared se ejecuta en background en Raspberry Pi
- ✅ Verificación correcta SOLO del túnel público
- ✅ UI que refleja la arquitectura real del sistema
- ✅ Diagnóstico específico para el túnel CloudFlare
- ✅ Timeout adecuado para requests remotos

## Arquitectura Final Clarificada

```
[Cliente Web] 
    ↓ (requests)
[https://cubaunify.uk] 
    ↓ (CloudFlare Tunnel)
[Raspberry Pi]
    ├── uvicorn server (puerto interno)
    └── cloudflared daemon
```

**Punto de verificación**: `https://cubaunify.uk/docs`
**Procesos monitoreados**: uvicorn y cloudflared en Raspberry Pi
**No se verifica**: localhost (porque no aplica en este setup)