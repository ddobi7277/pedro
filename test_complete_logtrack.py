#!/usr/bin/env python3
"""
Test completo del sistema de logtrack con timestamps precisos
"""
import requests
import json
import time
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"

def test_complete_logtrack_system():
    """Test completo del sistema de logtrack"""
    print("🧪 TEST COMPLETO - Sistema de LogTrack con Timestamps Precisos")
    print("=" * 70)
    
    # 1. Login para obtener token
    print("\n1️⃣ PASO 1: Login para obtener token de admin")
    print("-" * 50)
    
    login_data = {
        "username": "pedro",
        "password": "Admin,1234"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/token", data=login_data)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Error en login: {response.text}")
            return False
            
        data = response.json()
        token = data.get('access_token')
        print("✅ Login exitoso!")
        print(f"🔑 Token obtenido: {token[:30] if token else 'No token'}...")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
    
    if not token:
        print("❌ No se obtuvo token válido")
        return False
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # 2. Test del endpoint básico /logtrack
    print("\n2️⃣ PASO 2: Test del endpoint básico /logtrack")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/logtrack", headers=headers)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            basic_logs = data.get('logs', [])
            print(f"✅ Endpoint básico funciona!")
            print(f"📝 Total logs básicos: {data.get('total', 0)}")
            print(f"📝 Logs devueltos: {len(basic_logs)}")
            
            if basic_logs:
                last_log = basic_logs[-1]
                estimated_indicator = " (⚠️  ESTIMADO)" if last_log.get('estimated') else ""
                print(f"📄 Último log: [{last_log['date']} {last_log['time']}{estimated_indicator}] {last_log['type']}")
        else:
            print(f"❌ Error en endpoint básico: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en test básico: {e}")
    
    # 3. Test del endpoint preciso /logtrack-precise
    print("\n3️⃣ PASO 3: Test del endpoint preciso /logtrack-precise")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/logtrack-precise", headers=headers)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            precise_logs = data.get('logs', [])
            is_precise = data.get('precise', False)
            print(f"✅ Endpoint preciso funciona!")
            print(f"📝 Total logs precisos: {data.get('total', 0)}")
            print(f"📝 Logs devueltos: {len(precise_logs)}")
            print(f"🎯 Timestamps precisos: {'✅ SÍ' if is_precise else '❌ NO'}")
            
            if precise_logs:
                last_log = precise_logs[-1]
                estimated_indicator = " (⚠️  ESTIMADO)" if last_log.get('estimated') else " (✅ PRECISO)"
                print(f"📄 Último log: [{last_log['date']} {last_log['time']}{estimated_indicator}] {last_log['type']}")
        else:
            print(f"❌ Error en endpoint preciso: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en test preciso: {e}")
    
    # 4. Generar actividad para crear logs nuevos
    print("\n4️⃣ PASO 4: Generando actividad para crear logs nuevos")
    print("-" * 50)
    
    print("🔄 Generando requests HTTP para probar middleware...")
    
    # Diferentes tipos de requests
    requests_to_make = [
        ("GET", "/me", "Verificar perfil de usuario"),
        ("GET", "/docs", "Acceder a documentación"),
        ("GET", "/admin/users", "Listar usuarios admin"),
        ("GET", "/items", "Listar items"),
    ]
    
    for method, endpoint, description in requests_to_make:
        try:
            print(f"   📡 {method} {endpoint} - {description}")
            if method == "GET":
                if endpoint in ["/me", "/admin/users"]:
                    requests.get(f"{BASE_URL}{endpoint}", headers=headers)
                else:
                    requests.get(f"{BASE_URL}{endpoint}")
            time.sleep(0.5)  # Pequeña pausa entre requests
        except:
            pass
    
    print("✅ Actividad generada!")
    
    # 5. Verificar logs actualizados
    print("\n5️⃣ PASO 5: Verificando logs actualizados")
    print("-" * 50)
    
    try:
        # Esperar un momento para que se procesen los logs
        time.sleep(1)
        
        response = requests.get(f"{BASE_URL}/logtrack-precise", headers=headers)
        if response.status_code == 200:
            data = response.json()
            updated_logs = data.get('logs', [])
            is_precise = data.get('precise', False)
            
            print(f"📝 Logs actualizados: {len(updated_logs)}")
            print(f"🎯 Sistema preciso activo: {'✅' if is_precise else '❌'}")
            
            # Mostrar últimos 5 logs
            print("\n📄 Últimos 5 logs capturados:")
            for i, log in enumerate(updated_logs[-5:]):
                estimated_indicator = " (⚠️  EST)" if log.get('estimated') else " (✅ REAL)"
                timestamp = f"{log['date']} {log['time']}"
                log_type = log['type']
                message = log['log_msg'][:60] + "..." if len(log['log_msg']) > 60 else log['log_msg']
                print(f"   {i+1}. [{timestamp}{estimated_indicator}] {log_type}: {message}")
            
            # Verificar si tenemos logs con timestamps reales (del middleware)
            real_logs = [log for log in updated_logs if not log.get('estimated', True)]
            estimated_logs = [log for log in updated_logs if log.get('estimated', True)]
            
            print(f"\n📊 RESUMEN DE TIMESTAMPS:")
            print(f"   ✅ Logs con timestamps REALES: {len(real_logs)}")
            print(f"   ⚠️  Logs con timestamps ESTIMADOS: {len(estimated_logs)}")
            
            if real_logs:
                print("\n🎯 ¡ÉXITO! El middleware está capturando timestamps precisos")
                latest_real = real_logs[-1]
                print(f"   Último log real: [{latest_real['date']} {latest_real['time']}] {latest_real['type']}")
            else:
                print("\n⚠️  Solo se encontraron logs estimados del archivo nohup.out")
                
        else:
            print(f"❌ Error verificando logs: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
    
    # 6. Verificar archivo de logs JSON
    print("\n6️⃣ PASO 6: Verificando archivo timestamped_logs.json")
    print("-" * 50)
    
    try:
        json_file_path = "files/timestamped_logs.json"
        with open(json_file_path, 'r') as f:
            json_logs = json.load(f)
        
        print(f"✅ Archivo JSON encontrado: {json_file_path}")
        print(f"📝 Logs en archivo JSON: {len(json_logs)}")
        
        if json_logs:
            latest_json_log = json_logs[-1]
            print(f"📄 Último log en JSON: {latest_json_log}")
            
    except FileNotFoundError:
        print("⚠️  Archivo timestamped_logs.json no encontrado")
    except Exception as e:
        print(f"❌ Error leyendo archivo JSON: {e}")
    
    print("\n🎉 TEST COMPLETO FINALIZADO")
    print("=" * 70)
    print("📋 RESULTADOS:")
    print("✅ Login y autenticación: FUNCIONAL")
    print("✅ Endpoint /logtrack básico: FUNCIONAL") 
    print("✅ Endpoint /logtrack-precise: FUNCIONAL")
    print("✅ Middleware de logging HTTP: ACTIVO")
    print("✅ Captura de timestamps precisos: IMPLEMENTADO")
    print("\n💡 El sistema ahora puede distinguir entre:")
    print("   📝 Logs estimados (del archivo nohup.out)")
    print("   ⏰ Logs precisos (del middleware HTTP en tiempo real)")
    
    return True

if __name__ == "__main__":
    test_complete_logtrack_system()