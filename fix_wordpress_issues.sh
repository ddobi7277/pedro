#!/bin/bash
# Script para arreglar los problemas menores detectados

echo "🔧 ARREGLANDO PROBLEMAS MENORES"
echo "==============================="

echo "🐘 1. Solucionando problema de PHP..."

# Verificar versión de PHP instalada
echo "Versiones de PHP instaladas:"
dpkg -l | grep php | grep -E "php[0-9]" | head -5

# Instalar módulos PHP faltantes para Apache
echo "Instalando módulos PHP para Apache..."
sudo apt update
sudo apt install -y libapache2-mod-php php-cli php-fpm

# Habilitar módulo PHP en Apache
sudo a2enmod php8.2 2>/dev/null || sudo a2enmod php8.1 2>/dev/null || sudo a2enmod php8.0 2>/dev/null || sudo a2enmod php7.4

# Reiniciar Apache
echo "Reiniciando Apache..."
sudo systemctl restart apache2

# Verificar PHP
echo "Verificando PHP..."
php -v
if [ $? -eq 0 ]; then
    echo "✅ PHP ahora funciona correctamente"
else
    echo "❌ PHP aún tiene problemas"
fi

echo ""
echo "☁️ 2. Reiniciando CloudFlare Tunnel..."

# Verificar si existe configuración de túnel
if [ -f ~/.cloudflared/config.yml ]; then
    echo "✅ Configuración de túnel encontrada"
    
    # Mostrar configuración actual
    echo "📋 Configuración actual:"
    cat ~/.cloudflared/config.yml
    
    # Iniciar túnel
    echo "🚀 Iniciando CloudFlare Tunnel..."
    cloudflared tunnel run &
    
    # Esperar un momento
    sleep 5
    
    # Verificar si está corriendo
    if pgrep -f cloudflared > /dev/null; then
        echo "✅ CloudFlare Tunnel iniciado correctamente"
    else
        echo "❌ Problema iniciando el túnel"
    fi
else
    echo "⚠️ No se encontró configuración de túnel"
    echo "Ejecuta: ./setup_cloudflare_wordpress.sh"
fi

echo ""
echo "🔌 3. Reiniciando tu API en puerto 8000 (opcional)..."
echo "Si quieres mantener tu API corriendo:"
echo "cd /home/pedro/files && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &"

echo ""
echo "✅ Problemas solucionados!"
echo "🌐 Ahora puedes acceder a WordPress en:"
echo "   - Local: http://localhost/wp-admin/install.php"
echo "   - Público: https://whimsy-mac.com/wp-admin/install.php"