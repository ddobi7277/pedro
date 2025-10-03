#!/usr/bin/env python3
"""
Script para probar el endpoint /me del backend
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"  # Cambiar según sea necesario
# Necesitarás un token válido para probar
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwZWRybyIsImlzX2FkbWluIjp0cnVlLCJleHAiOjE3MzMzMTEyMTd9.example"  # Reemplazar con token real

def test_me_endpoint():
    """Prueba el endpoint /me"""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
    
    try:
        print("🚀 Probando endpoint /me...")
        print(f"📡 URL: {BASE_URL}/me")
        
        response = requests.get(
            f"{BASE_URL}/me",
            headers=headers,
            timeout=10
        )
         

        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ ¡Endpoint /me funciona correctamente!")
            print(f"📝 Usuario: {data.get('username')}")
            print(f"👑 Es Admin: {data.get('is_admin')}")
            return True
        elif response.status_code == 401:
            print("❌ Error de autorización - verifica el token")
            return False
        else:
            print(f"❌ Error inesperado: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión - verifica que el servidor esté ejecutándose")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de request: {e}")
        return False

def test_login_endpoint():
    """Prueba el endpoint de login para obtener un token válido"""
    
    try:
        print("🔐 Probando login para obtener token...")
        
        login_data = {
            "username": "pedro",
            "password": "Admin,1234"  # Contraseña correcta
        }
        
        response = requests.post(
            f"{BASE_URL}/token",
            data=login_data,
            timeout=10
        )
        
        print(f"📊 Login Status Code: {response.status_code}")
        print(f"📄 Login Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                token = data.get('access_token')
                print("✅ Login exitoso!")
                print(f"🔑 Token obtenido: {token[:50] if token else 'No token'}...")
                
                if token:
                    # Probar endpoint /me con el token obtenido
                    global TOKEN
                    TOKEN = token
                    return test_me_endpoint()
                else:
                    print("❌ No se obtuvo token del login")
                    return False
            except json.JSONDecodeError:
                print("❌ Respuesta de login no es JSON válido")
                return False
        else:
            print(f"❌ Error en login: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión - verifica que el servidor esté ejecutándose")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error en login: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Test del endpoint /me")
    print("=" * 50)
    
    # Primero intentar con login para obtener token válido
    if not test_login_endpoint():
        print("\n🔄 Login falló, probando con token predefinido...")
        test_me_endpoint()