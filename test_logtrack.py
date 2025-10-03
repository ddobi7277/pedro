#!/usr/bin/env python3
"""
Script para probar el endpoint /logtrack del backend
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"

def test_logtrack_endpoint():
    """Prueba el endpoint /logtrack"""
    
    # Primero hacer login para obtener token de admin
    try:
        print("🔐 Probando login para obtener token de admin...")
        
        login_data = {
            "username": "pedro",
            "password": "Admin,1234"
        }
        
        response = requests.post(
            f"{BASE_URL}/token",
            data=login_data,
            timeout=10
        )
        
        print(f"📊 Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("✅ Login exitoso!")
            print(f"🔑 Token obtenido: {token[:50] if token else 'No token'}...")
            
            if token:
                # Probar endpoint /logtrack
                print("\n🚀 Probando endpoint /logtrack...")
                
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                log_response = requests.get(
                    f"{BASE_URL}/logtrack",
                    headers=headers,
                    timeout=10
                )
                
                print(f"📊 Logtrack Status Code: {log_response.status_code}")
                
                if log_response.status_code == 200:
                    log_data = log_response.json()
                    logs = log_data.get('logs', [])
                    print(f"✅ ¡Endpoint /logtrack funciona!")
                    print(f"📝 Total logs: {log_data.get('total', 0)}")
                    print(f"📝 Logs returned: {len(logs)}")
                    
                    # Mostrar algunos logs de ejemplo
                    if logs:
                        print("\n📄 Últimos 3 logs:")
                        for i, log in enumerate(logs[-3:]):
                            print(f"  {i+1}. [{log['date']} {log['time']}] {log['type']}: {log['log_msg'][:100]}...")
                    
                    return True
                else:
                    print(f"❌ Error en logtrack: {log_response.text}")
                    return False
            else:
                print("❌ No se obtuvo token del login")
                return False
        else:
            print(f"❌ Error en login: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión - verifica que el servidor esté ejecutándose")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de request: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Test del endpoint /logtrack")
    print("=" * 50)
    test_logtrack_endpoint()