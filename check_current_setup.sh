#!/bin/bash
# Script para verificar configuración actual de CloudFlare Tunnel

echo "🔍 VERIFICANDO CONFIGURACIÓN ACTUAL"
echo "=================================="

echo "📋 1. Verificando CloudFlare Tunnel..."

# Verificar si cloudflared está instalado
if command -v cloudflared &> /dev/null; then
    echo "✅ CloudFlared instalado"
    cloudflared --version
else
    echo "❌ CloudFlared no encontrado"
fi

echo ""
echo "🔍 2. Listando túneles existentes..."
cloudflared tunnel list

echo ""
echo "📂 3. Verificando archivo de configuración..."
if [ -f ~/.cloudflared/config.yml ]; then
    echo "✅ Archivo de configuración encontrado:"
    echo "Contenido de ~/.cloudflared/config.yml:"
    cat ~/.cloudflared/config.yml
else
    echo "❌ No se encontró archivo de configuración"
fi

echo ""
echo "🌐 4. Verificando proceso CloudFlare activo..."
if pgrep -f cloudflared > /dev/null; then
    echo "✅ CloudFlare Tunnel está corriendo"
    ps aux | grep cloudflared | grep -v grep
else
    echo "❌ CloudFlare Tunnel no está corriendo"
fi

echo ""
echo "🔌 5. Verificando puertos en uso..."
echo "Puerto 80 (HTTP):"
sudo netstat -tlnp | grep :80 || echo "Puerto 80 libre"

echo "Puerto 8000 (Tu API):"
sudo netstat -tlnp | grep :8000 || echo "Puerto 8000 libre"

echo ""
echo "📁 6. Verificando directorio web actual..."
if [ -d "/var/www/html" ]; then
    echo "✅ Directorio /var/www/html existe"
    ls -la /var/www/html/
else
    echo "❌ Directorio /var/www/html no existe"
fi

echo ""
echo "🔍 7. Verificando servicios web activos..."
if systemctl is-active --quiet apache2; then
    echo "✅ Apache2 está corriendo"
elif systemctl is-active --quiet nginx; then
    echo "✅ Nginx está corriendo"
else
    echo "❌ No hay servidor web corriendo"
fi

echo ""
echo "📊 RESUMEN:"
echo "==========="
echo "Domain actual: $(grep 'hostname:' ~/.cloudflared/config.yml 2>/dev/null | head -1 | awk '{print $3}' || echo 'No configurado')"
echo "Tunnel ID: $(grep 'tunnel:' ~/.cloudflared/config.yml 2>/dev/null | awk '{print $2}' || echo 'No encontrado')"
echo ""
echo "🎯 PLAN PARA whimsy-mac.com:"
echo "1. Mantener mismo tunnel ID"
echo "2. Cambiar hostname a whimsy-mac.com" 
echo "3. Instalar WordPress en puerto 80"
echo "4. Mover API actual a api.whimsy-mac.com:8000"