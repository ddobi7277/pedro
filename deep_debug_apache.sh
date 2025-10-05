#!/bin/bash
# Script para diagnóstico profundo del Error 500

echo "🔍 DIAGNÓSTICO PROFUNDO DEL ERROR 500"
echo "==================================="

echo "📋 1. Verificando logs detallados de PHP y Apache..."

# Habilitar logging detallado de PHP
echo "🐘 Habilitando logs detallados de PHP..."
sudo tee /etc/php/8.2/apache2/conf.d/99-debug.ini > /dev/null << 'EOF'
log_errors = On
error_log = /var/log/php_errors.log
display_errors = Off
error_reporting = E_ALL
EOF

# Reiniciar Apache para aplicar cambios
sudo systemctl restart apache2
sleep 2

echo "📂 2. Verificando estructura de WordPress..."
echo "Archivos principales de WordPress:"
ls -la /var/www/html/ | grep -E "(index|wp-config|wp-admin|wp-content|wp-includes)"

echo ""
echo "📝 3. Creando wp-config.php limpio manualmente..."

# Crear wp-config.php completamente nuevo
sudo tee /var/www/html/wp-config.php > /dev/null << 'EOF'
<?php
/**
 * WordPress configuration file.
 */

// ** MySQL settings ** //
define( 'DB_NAME', 'wordpress_db' );
define( 'DB_USER', 'wp_user' );
define( 'DB_PASSWORD', 'wp_secure_password_2025' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

// Security keys
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');

// WordPress Database Table prefix
$table_prefix = 'wp_';

// Debug settings
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
EOF

# Configurar permisos correctos
sudo chown www-data:www-data /var/www/html/wp-config.php
sudo chmod 644 /var/www/html/wp-config.php

echo "✅ wp-config.php recreado con configuración básica"

echo ""
echo "🧪 4. Creando archivo de prueba PHP simple..."
sudo tee /var/www/html/test-simple.php > /dev/null << 'EOF'
<?php
echo "PHP funcionando correctamente";
phpinfo();
?>
EOF

sudo chown www-data:www-data /var/www/html/test-simple.php

echo ""
echo "🔌 5. Probando PHP básico..."
RESPONSE=$(curl -s -I http://localhost/test-simple.php | head -1)
echo "Respuesta PHP simple: $RESPONSE"

echo ""
echo "🌐 6. Probando WordPress directamente..."
echo "Probando index.php de WordPress..."
RESPONSE_WP=$(curl -s -I http://localhost/index.php | head -1)
echo "Respuesta WordPress: $RESPONSE_WP"

echo ""
echo "📋 7. Verificando logs después de las pruebas..."
echo "Errores de PHP:"
if [ -f /var/log/php_errors.log ]; then
    sudo tail -10 /var/log/php_errors.log
else
    echo "No hay archivo de log de PHP"
fi

echo ""
echo "Errores de Apache (últimos 5):"
sudo tail -5 /var/log/apache2/error.log

echo ""
echo "🔧 8. SOLUCION ALTERNATIVA: WordPress limpio..."
read -p "¿Quieres que reinstale WordPress desde cero? (y/N): " reinstall

if [[ "$reinstall" == "y" || "$reinstall" == "Y" ]]; then
    echo "🗑️ Respaldando y limpiando WordPress actual..."
    
    # Backup
    sudo mv /var/www/html /var/www/html.backup.$(date +%s) 2>/dev/null || true
    sudo mkdir -p /var/www/html
    
    # Descargar WordPress limpio
    echo "⬇️ Descargando WordPress limpio..."
    cd /tmp
    wget -q https://wordpress.org/latest.tar.gz
    tar xzf latest.tar.gz
    
    # Mover archivos
    sudo mv wordpress/* /var/www/html/
    sudo rm -rf wordpress latest.tar.gz
    
    # Copiar el wp-config.php que creamos
    sudo cp /var/www/html.backup.*/wp-config.php /var/www/html/ 2>/dev/null || true
    
    # Configurar permisos
    sudo chown -R www-data:www-data /var/www/html/
    sudo chmod -R 755 /var/www/html/
    
    echo "✅ WordPress reinstalado"
    
    # Probar
    sleep 2
    echo "🧪 Probando WordPress limpio..."
    FINAL_RESPONSE=$(curl -s -I http://localhost | head -1)
    echo "Respuesta final: $FINAL_RESPONSE"
    
    if echo "$FINAL_RESPONSE" | grep -q "200\|301\|302"; then
        echo "🎉 ¡WordPress funcionando! HTTP 200/300"
        
        # Verificar contenido
        if curl -s http://localhost | grep -q "WordPress\|installation\|wp-"; then
            echo "✅ WordPress respondiendo correctamente"
            echo "🌐 Ve a: http://localhost/wp-admin/install.php"
        fi
    else
        echo "❌ Aún hay problemas"
    fi
fi

echo ""
echo "🎯 RESUMEN:"
echo "==========="
echo "Si ves HTTP 200/300 arriba, ejecuta:"
echo "./force_tunnel_working.sh"
echo ""
echo "Si aún hay Error 500, el problema puede ser:"
echo "1. Módulos PHP faltantes"
echo "2. Configuración de Apache"
echo "3. Permisos del sistema de archivos"
echo "4. Memoria PHP insuficiente"