#!/bin/bash
# Script para verificar instalación de WordPress

echo "🔍 VERIFICANDO INSTALACIÓN DE WORDPRESS"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
total_checks=10

check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "📋 1. Verificando servicios básicos..."

# Check Apache
systemctl is-active --quiet apache2
check_status $? "Apache2 está corriendo"

# Check MySQL/MariaDB
systemctl is-active --quiet mariadb
check_status $? "MariaDB/MySQL está corriendo"

# Check PHP
php -v > /dev/null 2>&1
check_status $? "PHP está instalado y funcional"

echo ""
echo "📂 2. Verificando archivos de WordPress..."

# Check WordPress directory
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
    echo -e "${GREEN}✅ Directorio /var/www/html existe y tiene contenido${NC}"
    ((success_count++))
else
    echo -e "${RED}❌ Directorio /var/www/html vacío o no existe${NC}"
fi

# Check wp-config.php
if [ -f "/var/www/html/wp-config.php" ]; then
    echo -e "${GREEN}✅ wp-config.php existe${NC}"
    ((success_count++))
else
    echo -e "${RED}❌ wp-config.php no encontrado${NC}"
fi

# Check key WordPress files
wp_files=("wp-admin" "wp-content" "wp-includes" "index.php")
for file in "${wp_files[@]}"; do
    if [ -e "/var/www/html/$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ $file no encontrado${NC}"
    fi
done

echo ""
echo "🗄️ 3. Verificando base de datos..."

# Check database connection
DB_NAME="wordpress_db"
DB_USER="wp_user"
DB_PASSWORD="wp_secure_password_2025"

mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Conexión a base de datos exitosa${NC}"
    
    # Check if WordPress tables exist
    table_count=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | wc -l)
    if [ $table_count -gt 1 ]; then
        echo -e "${GREEN}✅ Tablas de WordPress encontradas ($((table_count-1)) tablas)${NC}"
        ((success_count++))
    else
        echo -e "${YELLOW}⚠️ Base de datos conecta pero sin tablas de WordPress${NC}"
        echo "   (Esto es normal si aún no has completado la instalación web)"
    fi
else
    echo -e "${RED}❌ No se puede conectar a la base de datos${NC}"
fi

echo ""
echo "🌐 4. Verificando acceso web..."

# Check localhost access
curl -s -o /dev/null -w "%{http_code}" http://localhost > /tmp/curl_result 2>/dev/null
http_code=$(cat /tmp/curl_result)

if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
    echo -e "${GREEN}✅ Servidor web responde en localhost (HTTP $http_code)${NC}"
    ((success_count++))
else
    echo -e "${RED}❌ Servidor web no responde en localhost (HTTP $http_code)${NC}"
fi

echo ""
echo "☁️ 5. Verificando CloudFlare Tunnel..."

# Check CloudFlare tunnel
if pgrep -f cloudflared > /dev/null; then
    echo -e "${GREEN}✅ CloudFlare Tunnel está corriendo${NC}"
    
    # Show tunnel configuration
    if [ -f ~/.cloudflared/config.yml ]; then
        echo -e "${GREEN}✅ Configuración de túnel encontrada${NC}"
        echo "📋 Configuración actual:"
        grep -E "(hostname|service)" ~/.cloudflared/config.yml | head -6
    fi
else
    echo -e "${RED}❌ CloudFlare Tunnel no está corriendo${NC}"
fi

echo ""
echo "🔌 6. Verificando puertos..."

# Check port 80
if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    echo -e "${GREEN}✅ Puerto 80 está en uso (Apache)${NC}"
else
    echo -e "${RED}❌ Puerto 80 no está en uso${NC}"
fi

# Check port 8000
if netstat -tlnp 2>/dev/null | grep -q ":8000 "; then
    echo -e "${GREEN}✅ Puerto 8000 está en uso (Tu API)${NC}"
else
    echo -e "${YELLOW}⚠️ Puerto 8000 no está en uso (Tu API no está corriendo)${NC}"
fi

echo ""
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "========================="
echo -e "Verificaciones exitosas: ${GREEN}$success_count/10${NC}"

if [ $success_count -ge 8 ]; then
    echo -e "${GREEN}🎉 WordPress parece estar instalado correctamente!${NC}"
    echo ""
    echo "🌐 Próximos pasos:"
    echo "1. Ve a: http://localhost/wp-admin/install.php"
    echo "2. O desde tu dominio: https://whimsy-mac.com/wp-admin/install.php"
    echo "3. Completa la instalación web de WordPress"
    echo "4. Instala WooCommerce desde Plugins > Add New"
    
elif [ $success_count -ge 5 ]; then
    echo -e "${YELLOW}⚠️ WordPress está parcialmente instalado${NC}"
    echo "Revisa los errores arriba y ejecuta los scripts faltantes"
    
else
    echo -e "${RED}❌ WordPress no está instalado correctamente${NC}"
    echo "Ejecuta: ./install_wordpress_complete.sh"
fi

echo ""
echo "🔧 Comandos útiles:"
echo "sudo systemctl restart apache2    # Reiniciar Apache"
echo "sudo systemctl restart mariadb    # Reiniciar MySQL"
echo "sudo systemctl status cloudflared # Ver estado del túnel"
echo ""
echo "📁 Archivos importantes:"
echo "/var/www/html/                    # Directorio de WordPress"
echo "/var/www/html/wp-config.php       # Configuración de WordPress"
echo "~/.cloudflared/config.yml         # Configuración del túnel"