#!/bin/bash
# Script para diagnosticar y solucionar problemas del túnel CloudFlare

echo "🔍 DIAGNÓSTICO DE PROBLEMAS DEL TÚNEL CLOUDFLARE"
echo "=============================================="

echo "📋 1. Verificando archivos de configuración..."

# Verificar config.yml
if [ -f ~/.cloudflared/config.yml ]; then
    echo "✅ config.yml encontrado"
    echo "Contenido:"
    cat ~/.cloudflared/config.yml
    echo ""
else
    echo "❌ config.yml no encontrado"
fi

# Verificar archivo de credenciales
CRED_FILE=$(find ~/.cloudflared/ -name "*.json" | head -1)
if [ -f "$CRED_FILE" ]; then
    echo "✅ Archivo de credenciales encontrado: $CRED_FILE"
else
    echo "❌ Archivo de credenciales no encontrado"
fi

echo ""
echo "🔌 2. Verificando servicios locales..."

# Verificar Apache en puerto 80
if curl -s http://localhost:80 > /dev/null; then
    echo "✅ Apache responde en puerto 80"
else
    echo "❌ Apache NO responde en puerto 80"
    echo "   Verificando estado de Apache..."
    sudo systemctl status apache2 --no-pager -l
fi

echo ""
echo "🔍 3. Verificando procesos cloudflared..."
if pgrep -f cloudflared > /dev/null; then
    echo "⚠️ Hay procesos cloudflared corriendo:"
    ps aux | grep cloudflared | grep -v grep
    echo ""
    echo "🛑 Matando procesos existentes..."
    sudo pkill -f cloudflared
    sleep 3
else
    echo "✅ No hay procesos cloudflared corriendo"
fi

echo ""
echo "🧪 4. Verificando conectividad de red..."
ping -c 2 1.1.1.1 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Conectividad a internet OK"
else
    echo "❌ Problema de conectividad a internet"
fi

echo ""
echo "🔧 5. Intentando iniciar túnel en modo debug..."
echo "Ejecutando: cloudflared tunnel --loglevel debug run 88711aa0-71c0-4ed9-9f53-aad6006fbc47"
echo ""

# Ejecutar en modo debug por 10 segundos
timeout 10s cloudflared tunnel --loglevel debug run 88711aa0-71c0-4ed9-9f53-aad6006fbc47 &
PID=$!

sleep 10

if kill -0 $PID 2>/dev/null; then
    echo "✅ Túnel iniciado correctamente en modo debug"
    kill $PID
else
    echo "❌ Túnel falló en modo debug"
fi

echo ""
echo "💡 POSIBLES SOLUCIONES:"
echo "======================"
echo "1. Recrear archivo de configuración limpio"
echo "2. Verificar que Apache esté corriendo"
echo "3. Comprobar firewall local"
echo "4. Reiniciar servicio de red"

echo ""
echo "🔧 ¿Quieres que intente una solución automática? (y/N)"
read -t 10 response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    echo ""
    echo "🚀 APLICANDO SOLUCIONES AUTOMÁTICAS..."
    
    # Reiniciar Apache
    echo "🔄 Reiniciando Apache..."
    sudo systemctl restart apache2
    
    # Limpiar configuración y recrear
    echo "🧹 Limpiando configuración..."
    cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup.$(date +%s)
    
    # Crear configuración mínima
    cat > ~/.cloudflared/config.yml << EOF
tunnel: 88711aa0-71c0-4ed9-9f53-aad6006fbc47
credentials-file: /home/pedro/.cloudflared/4f3f0a1f-8985-4c66-b5a9-65f624409595.json

ingress:
  - hostname: whimsy-mac.com
    service: http://localhost:80
  - hostname: www.whimsy-mac.com
    service: http://localhost:80
  - service: http_status:404
EOF
    
    echo "✅ Configuración simplificada creada"
    
    # Intentar de nuevo
    echo "🔄 Intentando túnel con configuración simplificada..."
    cloudflared tunnel run 88711aa0-71c0-4ed9-9f53-aad6006fbc47 &
    TUNNEL_PID=$!
    
    sleep 5
    
    if kill -0 $TUNNEL_PID 2>/dev/null; then
        echo "✅ ¡Túnel funcionando con configuración simplificada!"
        echo "🌐 Prueba acceder a: https://whimsy-mac.com"
    else
        echo "❌ Aún hay problemas"
        echo "💡 Intenta configuración manual paso a paso"
    fi
fi

echo ""
echo "📝 SIGUIENTE PASO:"
echo "Si el túnel funciona, configura DNS en CloudFlare:"
echo "Tipo: CNAME, Nombre: @, Contenido: 88711aa0-71c0-4ed9-9f53-aad6006fbc47.cfargotunnel.com"