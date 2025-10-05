#!/bin/bash
# Script maestro para instalar WordPress + WooCommerce en Raspberry Pi

echo "🎯 INSTALACIÓN COMPLETA: WordPress + WooCommerce en Raspberry Pi"
echo "=============================================================="
echo ""

read -p "¿Estás listo para comenzar la instalación? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Instalación cancelada."
    exit 0
fi

echo ""
echo "📋 PLAN DE INSTALACIÓN:"
echo "1. ✅ Instalar LAMP Stack (Apache + MySQL + PHP)"
echo "2. ✅ Instalar WordPress"
echo "3. ✅ Configurar base de datos MySQL"
echo "4. ✅ Configurar CloudFlare Tunnel"
echo "5. ✅ Instalar WooCommerce"
echo ""

# Paso 1: LAMP Stack
echo "🚀 PASO 1: Instalando LAMP Stack..."
chmod +x install_lamp.sh
./install_lamp.sh

echo ""
read -p "LAMP instalado. Presiona Enter para continuar con MySQL seguro..."
echo "🔒 Configurando MySQL (usa contraseña fuerte):"
sudo mysql_secure_installation

# Paso 2: WordPress
echo ""
echo "🚀 PASO 2: Instalando WordPress..."
chmod +x install_wordpress.sh
./install_wordpress.sh

# Paso 3: Base de datos
echo ""
echo "🚀 PASO 3: Configurando base de datos..."
chmod +x setup_wordpress_db.sh
./setup_wordpress_db.sh

# Paso 4: CloudFlare
echo ""
echo "🚀 PASO 4: Configurando CloudFlare Tunnel..."
chmod +x setup_cloudflare_wordpress.sh
./setup_cloudflare_wordpress.sh

echo ""
echo "🎉 ¡INSTALACIÓN BÁSICA COMPLETADA!"
echo "=================================="
echo ""
echo "🌐 Próximos pasos:"
echo "1. Configura DNS en CloudFlare (revisa las instrucciones arriba)"
echo "2. Ve a: https://whimsy-mac.com/wp-admin/install.php"
echo "3. Completa la instalación de WordPress"
echo "4. Instala WooCommerce desde el panel de WordPress"
echo "5. Tu API actual estará en: https://api.whimsy-mac.com"
echo ""
echo "📝 Credenciales de base de datos:"
echo "   Nombre: wordpress_db"
echo "   Usuario: wp_user"
echo "   Contraseña: wp_secure_password_2025"
echo ""
echo "🔧 Para reiniciar servicios:"
echo "   sudo systemctl restart apache2"
echo "   sudo systemctl restart mariadb"
echo "   sudo systemctl restart cloudflared"