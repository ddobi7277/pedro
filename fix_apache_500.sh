#!/bin/bash
# Script para diagnosticar y arreglar Error 500 de Apache/WordPress

echo "🔧 DIAGNOSTICANDO ERROR 500 DE APACHE/WORDPRESS"
echo "=============================================="

echo "📋 1. Verificando logs de Apache..."
echo "Últimos errores de Apache:"
sudo tail -20 /var/log/apache2/error.log

echo ""
echo "📂 2. Verificando archivos de WordPress..."

# Verificar permisos del directorio web
echo "Permisos de /var/www/html:"
ls -la /var/www/html/ | head -10

# Verificar si wp-config.php es válido
echo ""
echo "📝 3. Verificando wp-config.php..."
if [ -f /var/www/html/wp-config.php ]; then
    echo "✅ wp-config.php existe"
    
    # Verificar sintaxis PHP
    php -l /var/www/html/wp-config.php
    if [ $? -eq 0 ]; then
        echo "✅ wp-config.php sintaxis correcta"
    else
        echo "❌ wp-config.php tiene errores de sintaxis"
    fi
else
    echo "❌ wp-config.php no existe"
fi

echo ""
echo "🐘 4. Verificando PHP..."

# Verificar versión de PHP
echo "Versión de PHP:"
php -v | head -1

# Verificar módulos PHP necesarios
echo ""
echo "Módulos PHP instalados:"
php -m | grep -E "(mysql|mysqli|apache|curl|gd|mbstring|xml|zip)" | sort

# Crear archivo de prueba PHP
echo "<?php phpinfo(); ?>" > /var/www/html/test.php

# Probar archivo PHP simple
echo ""
echo "🧪 5. Probando PHP básico..."
curl -s -I http://localhost/test.php | head -1

echo ""
echo "🗄️ 6. Verificando conexión a base de datos..."

# Probar conexión MySQL
mysql -u wp_user -p'wp_secure_password_2025' -e "USE wordpress_db; SHOW TABLES;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Conexión a base de datos OK"
    
    # Verificar si hay tablas de WordPress
    table_count=$(mysql -u wp_user -p'wp_secure_password_2025' -e "USE wordpress_db; SHOW TABLES;" 2>/dev/null | wc -l)
    echo "Tablas en base de datos: $((table_count-1))"
else
    echo "❌ Error conectando a base de datos"
fi

echo ""
echo "🔧 7. APLICANDO SOLUCIONES AUTOMÁTICAS..."

# Corregir permisos
echo "🔒 Corrigiendo permisos..."
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
sudo chmod 644 /var/www/html/wp-config.php 2>/dev/null || true

# Habilitar módulos PHP necesarios
echo "📦 Habilitando módulos PHP..."
sudo a2enmod rewrite
sudo a2enmod php8.2 2>/dev/null || sudo a2enmod php8.1 2>/dev/null || sudo a2enmod php8.0 2>/dev/null

# Verificar configuración de Apache para WordPress
echo "⚙️ Configurando Apache para WordPress..."

# Crear configuración para WordPress
sudo tee /etc/apache2/sites-available/wordpress.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/wordpress_error.log
    CustomLog ${APACHE_LOG_DIR}/wordpress_access.log combined
</VirtualHost>
EOF

# Habilitar sitio de WordPress
sudo a2ensite wordpress.conf
sudo a2dissite 000-default.conf 2>/dev/null || true

# Reiniciar Apache
echo "🔄 Reiniciando Apache..."
sudo systemctl restart apache2

# Esperar un momento
sleep 3

# Probar de nuevo
echo ""
echo "🧪 8. VERIFICANDO SOLUCIÓN..."

echo "Probando localhost después de los arreglos..."
RESPONSE=$(curl -s -I http://localhost | head -1)
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "200\|301\|302"; then
    echo "✅ ¡Apache/WordPress ahora funciona!"
    
    # Probar página de WordPress
    echo ""
    echo "🌐 Probando página de WordPress..."
    if curl -s http://localhost | grep -q "WordPress\|wp-\|installation"; then
        echo "✅ WordPress respondiendo correctamente"
        echo "🎯 Ve a: http://localhost/wp-admin/install.php"
    else
        echo "⚠️ Apache funciona pero WordPress no está completamente configurado"
    fi
    
elif echo "$RESPONSE" | grep -q "500"; then
    echo "❌ Aún hay Error 500"
    echo "📋 Últimos errores de Apache:"
    sudo tail -10 /var/log/apache2/error.log
    
    # Solución drástica: recrear wp-config.php
    echo ""
    echo "🔧 Recreando wp-config.php desde cero..."
    
    sudo cp /var/www/html/wp-config-sample.php /var/www/html/wp-config.php
    
    # Configurar base de datos
    sudo sed -i "s/database_name_here/wordpress_db/" /var/www/html/wp-config.php
    sudo sed -i "s/username_here/wp_user/" /var/www/html/wp-config.php
    sudo sed -i "s/password_here/wp_secure_password_2025/" /var/www/html/wp-config.php
    sudo sed -i "s/localhost/localhost/" /var/www/html/wp-config.php
    
    # Agregar claves de seguridad
    SALT=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
    sudo sed -i "/put your unique phrase here/c\\$SALT" /var/www/html/wp-config.php
    
    sudo chown www-data:www-data /var/www/html/wp-config.php
    sudo chmod 644 /var/www/html/wp-config.php
    
    echo "✅ wp-config.php recreado"
    
    # Probar de nuevo
    sleep 2
    echo "Probando después de recrear wp-config.php..."
    curl -s -I http://localhost | head -1
    
else
    echo "❌ Respuesta inesperada de Apache"
fi

# Limpiar archivo de prueba
rm -f /var/www/html/test.php

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "=================="
echo "1. Si Apache funciona, ejecuta: ./force_tunnel_working.sh"
echo "2. Luego ve a: https://whymsy-mac.com"
echo "3. O directo: https://whymsy-mac.com/wp-admin/install.php"