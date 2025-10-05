#!/bin/bash
# Script para diagnosticar y corregir Apache/WordPress

echo "🔍 DIAGNÓSTICO APACHE Y WORDPRESS"
echo "=================================="

echo "📊 1. Estado de Apache..."
echo "Apache status:"
sudo systemctl status apache2 --no-pager -l

echo ""
echo "🌐 2. Probando conexión local puerto 80..."
LOCAL_RESPONSE=$(curl -s -I http://localhost:80 2>&1)
echo "Respuesta local: $LOCAL_RESPONSE"

if echo "$LOCAL_RESPONSE" | grep -q "200\|301\|302"; then
    echo "✅ Apache responde localmente"
else
    echo "❌ Apache no responde en puerto 80"
    
    echo ""
    echo "🔄 3. Reiniciando Apache..."
    sudo systemctl restart apache2
    sleep 5
    
    echo "Estado después del reinicio:"
    sudo systemctl status apache2 --no-pager -l
    
    LOCAL_RESPONSE_2=$(curl -s -I http://localhost:80 2>&1)
    echo "Nueva respuesta: $LOCAL_RESPONSE_2"
fi

echo ""
echo "📂 4. Verificando archivos WordPress..."
if [ -f /var/www/html/wp-config.php ]; then
    echo "✅ wp-config.php existe"
else
    echo "❌ wp-config.php NO existe"
fi

if [ -f /var/www/html/index.php ]; then
    echo "✅ index.php existe"
    echo "Primeras líneas de index.php:"
    head -5 /var/www/html/index.php
else
    echo "❌ index.php NO existe"
fi

echo ""
echo "🔍 5. Contenido directorio web..."
ls -la /var/www/html/

echo ""
echo "📋 6. Logs de Apache (últimas 20 líneas)..."
echo "Error log:"
sudo tail -20 /var/log/apache2/error.log 2>/dev/null || echo "No hay error.log"

echo ""
echo "Access log:"
sudo tail -10 /var/log/apache2/access.log 2>/dev/null || echo "No hay access.log"

echo ""
echo "🔧 7. Verificando permisos..."
echo "Propietario de /var/www/html:"
ls -ld /var/www/html

echo ""
echo "🌐 8. Configuración de sitios Apache..."
echo "Sitios habilitados:"
ls -la /etc/apache2/sites-enabled/

echo ""
echo "🔍 9. Verificando puerto 80 ocupado..."
sudo netstat -tlnp | grep :80 || echo "Puerto 80 no está en uso"

echo ""
echo "🚀 10. Reiniciando túnel para probar..."
echo "Deteniendo túnel actual..."
sudo pkill -f cloudflared
sleep 3

echo "Iniciando túnel..."
nohup cloudflared tunnel run 88711aa0-71c0-4ed9-9f53-aad6006fbc47 > ~/tunnel-diagnostic.log 2>&1 &
TUNNEL_PID=$!

echo "Tunnel PID: $TUNNEL_PID"
sleep 10

echo ""
echo "📋 Log del túnel (últimas líneas):"
tail -15 ~/tunnel-diagnostic.log

echo ""
echo "🧪 11. Probando acceso público..."
sleep 5
PUBLIC_TEST=$(curl -s -I https://whimsy-mac.com 2>&1)
echo "Respuesta pública: $PUBLIC_TEST"

echo ""
echo "📊 RESUMEN:"
echo "==========="
echo "Apache local: $(curl -s -I http://localhost:80 | head -1 2>/dev/null || echo 'No responde')"
echo "Sitio público: $(curl -s -I https://whimsy-mac.com | head -1 2>/dev/null || echo 'No responde')"
echo "Tunnel PID: $TUNNEL_PID"
echo ""
echo "🔧 Si hay problemas, ejecutar:"
echo "sudo systemctl restart apache2"
echo "sudo chown -R www-data:www-data /var/www/html"
echo "sudo chmod -R 755 /var/www/html"