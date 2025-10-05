#!/bin/bash
# Script para forzar el túnel a mantenerse activo

echo "🔧 SOLUCIONANDO PROBLEMA DE 'context canceled'"
echo "============================================="

# Matar cualquier proceso existente
echo "🛑 Limpiando procesos existentes..."
sudo pkill -f cloudflared
sleep 3

# Verificar que Apache funciona
echo "🌐 Verificando Apache..."
curl -s -I http://localhost | head -1

# Crear configuración ultra-simple
echo "📝 Creando configuración mínima..."
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: 88711aa0-71c0-4ed9-9f53-aad6006fbc47
credentials-file: /home/pedro/.cloudflared/4f3f0a1f-8985-4c66-b5a9-65f624409595.json

ingress:
  - hostname: whimsy-mac.com
    service: http://localhost:80
  - service: http_status:404
EOF

echo "✅ Configuración creada"

# Método 1: Usar nohup para ejecutar en background
echo ""
echo "🚀 MÉTODO 1: Ejecutando túnel con nohup..."
nohup cloudflared tunnel run 88711aa0-71c0-4ed9-9f53-aad6006fbc47 > ~/tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "PID del túnel: $TUNNEL_PID"
sleep 5

# Verificar si está corriendo
if kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "✅ ¡Túnel corriendo con nohup!"
    echo "📋 Últimas líneas del log:"
    tail -10 ~/tunnel.log
    
    echo ""
    echo "🌐 Probando acceso público..."
    sleep 10
    
    # Probar acceso desde afuera
    if curl -s -I https://whimsy-mac.com | head -1 | grep -q "200\|301\|302"; then
        echo "✅ ¡whimsy-mac.com está respondiendo!"
        echo "🎉 ¡Túnel funcionando correctamente!"
        echo ""
        echo "🌐 Ve a: https://whimsy-mac.com/wp-admin/install.php"
    else
        echo "⚠️ Aún propagando DNS... Espera 5 minutos más"
        echo "💡 O prueba: curl -I https://whimsy-mac.com"
    fi
    
    echo ""
    echo "📊 Estado del túnel:"
    echo "==================="
    echo "PID: $TUNNEL_PID"
    echo "Log: ~/tunnel.log"
    echo "Configuración: ~/.cloudflared/config.yml"
    
    echo ""
    echo "🔧 Comandos útiles:"
    echo "tail -f ~/tunnel.log                    # Ver log en tiempo real"
    echo "kill $TUNNEL_PID                       # Detener túnel"
    echo "ps aux | grep cloudflared              # Ver proceso"
    
else
    echo "❌ Túnel falló con nohup"
    echo "📋 Log de error:"
    cat ~/tunnel.log
    
    echo ""
    echo "🔧 MÉTODO 2: Intentando con systemd..."
    
    # Crear archivo de servicio systemd
    sudo tee /etc/systemd/system/cloudflared-tunnel.service > /dev/null << EOF
[Unit]
Description=CloudFlare Tunnel
After=network.target

[Service]
Type=simple
User=pedro
WorkingDirectory=/home/pedro
ExecStart=/usr/local/bin/cloudflared tunnel run 88711aa0-71c0-4ed9-9f53-aad6006fbc47
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Recargar systemd y arrancar servicio
    sudo systemctl daemon-reload
    sudo systemctl enable cloudflared-tunnel
    sudo systemctl start cloudflared-tunnel
    
    sleep 5
    
    # Verificar estado del servicio
    if sudo systemctl is-active --quiet cloudflared-tunnel; then
        echo "✅ ¡Túnel corriendo como servicio systemd!"
        sudo systemctl status cloudflared-tunnel --no-pager
    else
        echo "❌ Servicio systemd también falló"
        sudo systemctl status cloudflared-tunnel --no-pager
    fi
fi

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "=================="
echo "1. Si el túnel funciona, ve a: https://whimsy-mac.com"
echo "2. Deberías ver la página de WordPress"
echo "3. Luego ve a: https://whimsy-mac.com/wp-admin/install.php"
echo "4. Completa la instalación de WordPress"