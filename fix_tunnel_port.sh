#!/bin/bash
# Script para corregir la configuración del túnel hacia puerto 80

echo "🔧 CORRIGIENDO CONFIGURACIÓN DEL TÚNEL"
echo "====================================="

echo "🛑 1. Deteniendo túnel actual..."
sudo pkill -f cloudflared
sleep 3

echo "📝 2. Verificando configuración actual..."
if [ -f ~/.cloudflared/config.yml ]; then
    echo "Configuración actual:"
    cat ~/.cloudflared/config.yml
    echo ""
else
    echo "❌ No hay archivo de configuración"
fi

echo "🔧 3. Corrigiendo configuración para puerto 80..."

# Crear backup de la configuración actual
cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup.$(date +%s) 2>/dev/null || true

# Crear configuración correcta apuntando al puerto 80
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: 88711aa0-71c0-4ed9-9f53-aad6006fbc47
credentials-file: /home/pedro/.cloudflared/4f3f0a1f-8985-4c66-b5a9-65f624409595.json

ingress:
  - hostname: whimsy-mac.com
    service: http://localhost:80
  - hostname: www.whimsy-mac.com
    service: http://localhost:80
  - service: http_status:404
EOF

echo "✅ Nueva configuración creada (puerto 80)"
echo ""
echo "📋 Nueva configuración:"
cat ~/.cloudflared/config.yml

echo ""
echo "🧪 4. Verificando que Apache funciona en puerto 80..."
APACHE_STATUS=$(curl -s -I http://localhost:80 | head -1)
echo "Apache respuesta: $APACHE_STATUS"

if echo "$APACHE_STATUS" | grep -q "200\|301\|302"; then
    echo "✅ Apache está funcionando en puerto 80"
else
    echo "❌ Apache no responde en puerto 80"
    echo "🔄 Reiniciando Apache..."
    sudo systemctl restart apache2
    sleep 3
    
    APACHE_STATUS_2=$(curl -s -I http://localhost:80 | head -1)
    echo "Apache después del reinicio: $APACHE_STATUS_2"
fi

echo ""
echo "🚀 5. Iniciando túnel con configuración corregida..."

# Iniciar túnel en background
nohup cloudflared tunnel run 88711aa0-71c0-4ed9-9f53-aad6006fbc47 > ~/tunnel-fixed.log 2>&1 &
TUNNEL_PID=$!

echo "Tunnel PID: $TUNNEL_PID"
sleep 10

# Verificar que está corriendo
if kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "✅ Túnel corriendo con nueva configuración"
    
    echo ""
    echo "📋 Últimas líneas del log:"
    tail -10 ~/tunnel-fixed.log
    
    echo ""
    echo "🌐 Probando acceso en 15 segundos..."
    sleep 15
    
    # Probar acceso público
    echo "Probando https://whimsy-mac.com..."
    PUBLIC_STATUS=$(curl -s -I https://whimsy-mac.com | head -1 2>/dev/null || echo "Error de conexión")
    echo "Respuesta pública: $PUBLIC_STATUS"
    
    if echo "$PUBLIC_STATUS" | grep -q "200\|301\|302"; then
        echo "🎉 ¡whimsy-mac.com está funcionando!"
        echo ""
        echo "🌐 Ve a: https://whimsy-mac.com"
        echo "📝 Instalación: https://whimsy-mac.com/wp-admin/install.php"
    else
        echo "⚠️ Aún propagando... Espera 2-3 minutos más"
    fi
    
else
    echo "❌ Error iniciando el túnel"
    echo "📋 Log de error:"
    cat ~/tunnel-fixed.log
fi

echo ""
echo "🔧 Comandos útiles:"
echo "==================="
echo "tail -f ~/tunnel-fixed.log          # Ver log en tiempo real"
echo "kill $TUNNEL_PID                    # Detener túnel"
echo "curl -I http://localhost:80         # Probar Apache local"
echo "curl -I https://whimsy-mac.com      # Probar acceso público"

echo ""
echo "📊 Estado:"
echo "=========="
echo "Túnel PID: $TUNNEL_PID"
echo "Log: ~/tunnel-fixed.log"
echo "Puerto correcto: 80 (Apache/WordPress)"