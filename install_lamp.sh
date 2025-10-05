#!/bin/bash
# Script para instalar LAMP stack en Raspberry Pi para WordPress

echo "🚀 Instalando LAMP Stack para WordPress en Raspberry Pi..."
echo "==============================================="

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Apache
echo "🌐 Instalando Apache..."
sudo apt install apache2 -y

# Habilitar Apache al inicio
sudo systemctl enable apache2
sudo systemctl start apache2

# Instalar MySQL
echo "🗄️ Instalando MySQL..."
sudo apt install mariadb-server mariadb-client -y

# Habilitar MySQL al inicio
sudo systemctl enable mariadb
sudo systemctl start mariadb

# Instalar PHP y extensiones necesarias para WordPress
echo "🐘 Instalando PHP y extensiones..."
sudo apt install php php-apache2 php-mysql php-curl php-gd php-mbstring php-xml php-xmlrpc php-soap php-intl php-zip -y

# Reiniciar Apache para cargar PHP
sudo systemctl restart apache2

# Verificar instalaciones
echo "✅ Verificando instalaciones..."
echo "Apache version:"
apache2 -v

echo "MySQL version:"
mysql --version

echo "PHP version:"
php -v

# Configurar permisos para Apache
echo "🔧 Configurando permisos..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "✅ LAMP Stack instalado correctamente!"
echo "Apache está corriendo en: http://localhost"
echo "Directorio web: /var/www/html/"

echo ""
echo "🔑 IMPORTANTE: Ejecuta mysql_secure_installation para configurar MySQL:"
echo "sudo mysql_secure_installation"