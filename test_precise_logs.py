#!/usr/bin/env python3
"""
Script para probar el endpoint /logtrack-precise del backend
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"

def test_precise_logtrack():
    """Prueba el endpoint /logtrack-precise"""
    
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
                # Probar endpoint /logtrack-precise
                print("\n🚀 Probando endpoint /logtrack-precise...")
                
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                log_response = requests.get(
                    f"{BASE_URL}/logtrack-precise",
                    headers=headers,
                    timeout=10
                )
                
                print(f"📊 Precise Logtrack Status Code: {log_response.status_code}")
                
                if log_response.status_code == 200:
                    log_data = log_response.json()
                    logs = log_data.get('logs', [])
                    is_precise = log_data.get('precise', False)
                    print(f"✅ ¡Endpoint /logtrack-precise funciona!")
                    print(f"📝 Total logs: {log_data.get('total', 0)}")
                    print(f"📝 Logs returned: {len(logs)}")
                    print(f"🎯 Precise timestamps: {'✅ SÍ' if is_precise else '❌ NO'}")
                    
                    # Mostrar algunos logs de ejemplo
                    if logs:
                        print("\n📄 Últimos 5 logs con timestamps precisos:")
                        for i, log in enumerate(logs[-5:]):
                            estimated_indicator = "" if not log.get('estimated') else " (estimado)"
                            print(f"  {i+1}. [{log['date']} {log['time']}{estimated_indicator}] {log['type']}: {log['log_msg'][:80]}...")
                    
                    # Hacer algunas requests para generar logs
                    print("\n🔄 Generando algunos logs de prueba...")
                    requests.get(f"{BASE_URL}/me", headers=headers)
                    requests.get(f"{BASE_URL}/docs")
                    
                    # Probar de nuevo para ver logs nuevos
                    print("\n🔄 Probando nuevamente para ver logs actualizados...")
                    log_response2 = requests.get(f"{BASE_URL}/logtrack-precise", headers=headers)
                    if log_response2.status_code == 200:
                        log_data2 = log_response2.json()
                        logs2 = log_data2.get('logs', [])
                        print(f"📝 Nuevos logs: {len(logs2)}")
                        if logs2:
                            print("📄 Último log generado:")
                            last_log = logs2[-1]
                            print(f"   [{last_log['date']} {last_log['time']}] {last_log['type']}: {last_log['log_msg']}")
                    
                    return True
                else:
                    print(f"❌ Error en logtrack-precise: {log_response.text}")
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
    print("🧪 Test del endpoint /logtrack-precise")
    print("=" * 60)
    print("⚠️  Nota: El servidor debe haberse iniciado con el nuevo middleware")
    print("=" * 60)
    test_precise_logtrack()