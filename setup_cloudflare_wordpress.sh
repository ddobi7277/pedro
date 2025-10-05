#!/bin/bash
# Script para configurar CloudFlare Tunnel para WordPress

echo "☁️ Configurando CloudFlare Tunnel para WordPress..."
echo "=============================================="

# Variables
DOMAIN="whimsy-mac.com"
SUBDOMAIN="www"  # Para www.whimsy-mac.com
FULL_DOMAIN="$DOMAIN"  # Dominio principal

echo "🌐 Configurando túnel para: $FULL_DOMAIN y www.$DOMAIN"
echo ""

# Crear archivo de configuración para el túnel
echo "📝 Creando configuración del túnel..."

# Backup de configuración actual si existe
if [ -f ~/.cloudflared/config.yml ]; then
    cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup
fi

# Crear nueva configuración
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << EOF
# CloudFlare Tunnel Configuration for WordPress
tunnel: $(cloudflared tunnel list | grep -o '[a-f0-9-]\{36\}' | head -1)
credentials-file: ~/.cloudflared/$(cloudflared tunnel list | grep -o '[a-f0-9-]\{36\}' | head -1).json

ingress:
  # WordPress/WooCommerce en whimsy-mac.com (puerto 80)
  - hostname: $FULL_DOMAIN
    service: http://localhost:80
  
  # WordPress con www
  - hostname: www.$DOMAIN
    service: http://localhost:80
    
  # API actual en subdominio
  - hostname: api.$DOMAIN
    service: http://localhost:8000
    
  # Regla catch-all
  - service: http_status:404

EOF

echo "✅ Configuración creada en ~/.cloudflared/config.yml"
echo ""

echo "🔧 Comandos para configurar DNS en CloudFlare:"
echo "1. Ve a CloudFlare Dashboard > DNS para whimsy-mac.com"
echo "2. Agrega estos registros CNAME:"
echo ""
echo "   Tipo: CNAME"
echo "   Nombre: @ (o whimsy-mac.com)"
echo "   Contenido: $(cloudflared tunnel list | grep -o '[a-f0-9-]\{36\}' | head -1).cfargotunnel.com"
echo "   Proxy: ✅ Habilitado (naranja)"
echo ""
echo "   Tipo: CNAME"
echo "   Nombre: www"
echo "   Contenido: $(cloudflared tunnel list | grep -o '[a-f0-9-]\{36\}' | head -1).cfargotunnel.com"
echo "   Proxy: ✅ Habilitado (naranja)"
echo ""
echo "   Tipo: CNAME"
echo "   Nombre: api"
echo "   Contenido: $(cloudflared tunnel list | grep -o '[a-f0-9-]\{36\}' | head -1).cfargotunnel.com"
echo "   Proxy: ✅ Habilitado (naranja)"
echo ""

echo "🚀 Para iniciar el túnel:"
echo "cloudflared tunnel run"
echo ""
echo "📝 Para hacer el túnel permanente:"
echo "sudo cloudflared service install"
echo "sudo systemctl enable cloudflared"
echo "sudo systemctl start cloudflared"