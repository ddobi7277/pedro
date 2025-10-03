#!/usr/bin/env python3
"""
Script de prueba para el endpoint /creat/item
"""
import requests
import json

# Configuración
BASE_URL = "https://cubaunify.uk"  # Cambiar por localhost si es desarrollo local
TOKEN = "tu_token_aqui"  # Cambiar por un token válido

def test_create_item():
    """Prueba el endpoint de creación de productos sin imágenes"""
    
    # Datos de prueba
    item_data = {
        "name": "Producto de Prueba",
        "cost": 10.50,
        "price": 3150.00,  # 10.50 * 300 (tasa de cambio)
        "tax": 1.68,  # 10.50 * 0.16
        "price_USD": 10.50,
        "cant": 5,
        "category": "Electrónicos",
        "detalles": "Producto de prueba para verificar el endpoint sin imágenes",
        "seller": "seller",
        "images": []  # Array vacío de imágenes
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
    
    try:
        print("🚀 Enviando solicitud de creación de producto...")
        print(f"📡 URL: {BASE_URL}/creat/item")
        print(f"📦 Datos: {json.dumps(item_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/creat/item",
            headers=headers,
            json=item_data,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ ¡Producto creado exitosamente!")
            return True
        elif response.status_code == 401:
            print("❌ Error de autorización - verifica el token")
            return False
        elif response.status_code == 400:
            print("❌ Error en los datos - posiblemente el producto ya existe")
            return False
        else:
            print(f"❌ Error inesperado: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Test del endpoint /creat/item")
    print("=" * 50)
    print("⚠️  Nota: Asegúrate de actualizar el TOKEN antes de ejecutar")
    print("=" * 50)
    
    test_create_item()