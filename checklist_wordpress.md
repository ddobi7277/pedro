# Lista de verificación ANTES de instalar WordPress

## 📋 Pre-requisitos:

### ✅ Hardware:
- [ ] Raspberry Pi 4 funcionando
- [ ] Al menos 8GB de espacio libre
- [ ] Conexión a internet estable

### ✅ Software actual:
- [ ] Backup de tu API actual en /home/pedro/files/
- [ ] Backup de la base de datos actual
- [ ] CloudFlare Tunnel funcionando

### ✅ Accesos:
- [ ] SSH a tu Raspberry Pi
- [ ] Acceso a CloudFlare Dashboard
- [ ] Dominio cubaunify.uk configurado

### ✅ Decisiones:
- [ ] Subdominio elegido (recomiendo: shop.cubaunify.uk)
- [ ] Mantener API actual en api.cubaunify.uk (opcional)
- [ ] Plan de migración de datos

## 🔄 Plan de migración sugerido:

1. **Fase 1:** Instalar WordPress en paralelo
2. **Fase 2:** Configurar WooCommerce
3. **Fase 3:** Migrar productos manualmente
4. **Fase 4:** Configurar pagos y envíos
5. **Fase 5:** Hacer switch del dominio principal

## ⚠️ Importante:
- Tu API actual seguirá funcionando en puerto 8000
- WordPress usará puerto 80 (Apache)
- Ambos pueden coexistir sin problemas