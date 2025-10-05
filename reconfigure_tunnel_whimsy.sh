#!/bin/bash
# Script para reconfigurar el túnel existente para whimsy-mac.com

echo "🔄 RECONFIGURANDO TUNNEL EXISTENTE PARA whimsy-mac.com"
echo "===================================================="

echo "🔍 1. Verificando configuración actual..."

# Mostrar configuración actual
if [ -f ~/.cloudflared/config.yml ]; then
    echo "📋 Configuración actual encontrada:"
    echo "======================================"
    cat ~/.cloudflared/config.yml
    echo "======================================"
    echo ""
else
    echo "❌ No se encontró archivo de configuración"
    exit 1
fi

# Hacer backup de la configuración actual
echo "💾 2. Creando backup de configuración actual..."
cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado"

# Obtener tunnel ID actual
TUNNEL_ID=$(grep "tunnel:" ~/.cloudflared/config.yml | awk '{print $2}')
echo "🆔 Tunnel ID encontrado: $TUNNEL_ID"

# Buscar archivo de credenciales
CRED_FILE=$(find ~/.cloudflared/ -name "*.json" | head -1)
echo "🔑 Archivo de credenciales: $CRED_FILE"

echo ""
echo "⚙️ 3. Creando nueva configuración para whimsy-mac.com..."

# Crear nueva configuración
cat > ~/.cloudflared/config.yml << EOF
# CloudFlare Tunnel Configuration for whimsy-mac.com
tunnel: $TUNNEL_ID
credentials-file: $CRED_FILE

ingress:
  # WordPress principal en whimsy-mac.com
  - hostname: whimsy-mac.com
    service: http://localhost:80
  
  # WordPress con www
  - hostname: www.whimsy-mac.com
    service: http://localhost:80
    
  # API actual en subdominio
  - hostname: api.whimsy-mac.com
    service: http://localhost:8000
    
  # Mantener cubaunify.uk funcionando (opcional)
  - hostname: www.cubaunify.uk
    service: http://localhost:80
    
  # Regla catch-all
  - service: http_status:404

EOF

echo "✅ Nueva configuración creada"
echo ""
echo "📋 Nueva configuración:"
echo "======================="
cat ~/.cloudflared/config.yml
echo "======================="

echo ""
echo "🔄 4. Reiniciando túnel con nueva configuración..."

# Detener túnel actual si está corriendo
echo "🛑 Deteniendo túnel actual..."
pkill cloudflared

# Esperar un momento
sleep 3

# Iniciar túnel con nueva configuración
echo "🚀 Iniciando túnel con nueva configuración..."
cloudflared tunnel run $TUNNEL_ID &

# Esperar a que inicie
sleep 5

# Verificar que está corriendo
if pgrep -f cloudflared > /dev/null; then
    echo "✅ Túnel reiniciado correctamente"
else
    echo "❌ Error reiniciando el túnel"
    echo "Intenta manualmente: cloudflared tunnel run $TUNNEL_ID"
fi

echo ""
echo "☁️ 5. CONFIGURACIÓN DNS REQUERIDA EN CLOUDFLARE"
echo "=============================================="
echo ""
echo "🌐 Para whimsy-mac.com, configura estos registros DNS:"
echo ""
echo "Tipo: CNAME"
echo "Nombre: @"
echo "Contenido: $TUNNEL_ID.cfargotunnel.com"
echo "Proxy: ✅ Habilitado (naranja)"
echo ""
echo "Tipo: CNAME"
echo "Nombre: www"
echo "Contenido: $TUNNEL_ID.cfargotunnel.com"
echo "Proxy: ✅ Habilitado (naranja)"
echo ""
echo "Tipo: CNAME"
echo "Nombre: api"
echo "Contenido: $TUNNEL_ID.cfargotunnel.com"
echo "Proxy: ✅ Habilitado (naranja)"

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "=================="
echo "1. Configura DNS en CloudFlare (arriba)"
echo "2. Espera 5-10 minutos para propagación DNS"
echo "3. Ve a: https://whimsy-mac.com/wp-admin/install.php"
echo "4. Completa instalación de WordPress"
echo ""
echo "📝 NOTA: cubaunify.uk seguirá funcionando si quieres mantenerlo"

echo ""
echo "🔧 Para hacer el túnel permanente:"
echo "sudo cloudflared service install"
echo "sudo systemctl enable cloudflared"
echo "sudo systemctl start cloudflared"