#!/bin/bash
# Script para instalar WordPress en Raspberry Pi

echo "📝 Instalando WordPress..."
echo "=========================="

# Crear directorio temporal
cd /tmp

# Descargar WordPress
echo "⬇️ Descargando WordPress..."
wget https://wordpress.org/latest.tar.gz

# Extraer WordPress
echo "📂 Extrayendo WordPress..."
tar xzf latest.tar.gz

# Mover WordPress al directorio web
echo "📁 Moviendo WordPress a /var/www/html..."
sudo rm -rf /var/www/html/*
sudo mv wordpress/* /var/www/html/

# Configurar permisos
echo "🔧 Configurando permisos..."
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# Crear archivo de configuración
echo "⚙️ Preparando configuración..."
sudo cp /var/www/html/wp-config-sample.php /var/www/html/wp-config.php

echo "✅ WordPress instalado en /var/www/html/"
echo ""
echo "🔑 PRÓXIMO PASO: Configurar base de datos MySQL"