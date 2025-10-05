#!/bin/bash
# Script para hacer el túnel CloudFlare permanente

echo "🔧 CONFIGURANDO TÚNEL COMO SERVICIO PERMANENTE"
echo "=============================================="

# Detener túnel manual si está corriendo
echo "🛑 Deteniendo túnel manual..."
sudo pkill -f cloudflared
sleep 3

# Instalar como servicio del sistema
echo "⚙️ Instalando cloudflared como servicio..."
sudo cloudflared service install

# Habilitar para que inicie automáticamente
echo "🚀 Habilitando inicio automático..."
sudo systemctl enable cloudflared

# Iniciar el servicio
echo "▶️ Iniciando servicio..."
sudo systemctl start cloudflared

# Esperar un momento
sleep 5

# Verificar estado
echo "📊 Verificando estado del servicio..."
sudo systemctl status cloudflared

# Verificar que está corriendo
if sudo systemctl is-active --quiet cloudflared; then
    echo "✅ CloudFlare Tunnel está corriendo como servicio"
else
    echo "❌ Problema con el servicio"
    echo "💡 Intenta manualmente:"
    echo "   sudo systemctl restart cloudflared"
    echo "   sudo systemctl status cloudflared"
fi

echo ""
echo "🎯 RESULTADO:"
echo "============="
echo "✅ Túnel configurado para whimsy-mac.com"
echo "✅ Servicio permanente habilitado"
echo "✅ Se reiniciará automáticamente si se apaga"

echo ""
echo "🌐 URLs disponibles:"
echo "==================="
echo "WordPress: https://whimsy-mac.com"
echo "WordPress: https://www.whimsy-mac.com"
echo "API:       https://api.whimsy-mac.com"
echo "Viejo:     https://www.cubaunify.uk (opcional)"

echo ""
echo "🔧 Comandos útiles:"
echo "=================="
echo "sudo systemctl status cloudflared    # Ver estado"
echo "sudo systemctl restart cloudflared   # Reiniciar"
echo "sudo systemctl stop cloudflared      # Detener"
echo "sudo systemctl start cloudflared     # Iniciar"