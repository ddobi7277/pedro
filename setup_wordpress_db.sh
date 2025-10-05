#!/bin/bash
# Script para configurar base de datos MySQL para WordPress

echo "🗄️ Configurando Base de Datos MySQL para WordPress..."
echo "=================================================="

# Variables (puedes cambiar estos valores)
DB_NAME="wordpress_db"
DB_USER="wp_user"
DB_PASSWORD="wp_secure_password_2025"

echo "📋 Configuración:"
echo "Base de datos: $DB_NAME"
echo "Usuario: $DB_USER"
echo "Contraseña: $DB_PASSWORD"
echo ""

echo "🔐 Creando base de datos y usuario..."

# Crear base de datos y usuario
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "✅ Base de datos configurada correctamente!"
echo ""
echo "📝 Detalles para wp-config.php:"
echo "DB_NAME: $DB_NAME"
echo "DB_USER: $DB_USER"
echo "DB_PASSWORD: $DB_PASSWORD"
echo "DB_HOST: localhost"

# Configurar wp-config.php automáticamente
echo "⚙️ Configurando wp-config.php..."

# Backup del archivo original
sudo cp /var/www/html/wp-config.php /var/www/html/wp-config.php.backup

# Configurar base de datos en wp-config.php
sudo sed -i "s/database_name_here/$DB_NAME/" /var/www/html/wp-config.php
sudo sed -i "s/username_here/$DB_USER/" /var/www/html/wp-config.php
sudo sed -i "s/password_here/$DB_PASSWORD/" /var/www/html/wp-config.php
sudo sed -i "s/localhost/localhost/" /var/www/html/wp-config.php

# Generar claves de seguridad
echo "🔐 Configurando claves de seguridad..."
SALT=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
sudo sed -i "/put your unique phrase here/c\\$SALT" /var/www/html/wp-config.php

echo "✅ wp-config.php configurado correctamente!"
echo ""
echo "🌐 WordPress está listo en: http://tu-raspberry-pi/wp-admin/install.php"