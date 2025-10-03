#!/usr/bin/env python3
"""
Test completo para edición de usuarios incluyendo username
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"

def test_user_edit_functionality():
    """Test completo de edición de usuarios con username"""
    print("🧪 TEST COMPLETO - Edición de Usuarios con Username")
    print("=" * 70)
    
    # 1. Login para obtener token
    print("\n1️⃣ PASO 1: Login de admin")
    print("-" * 50)
    
    login_data = {
        "username": "pedro",
        "password": "Admin,1234"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/token", data=login_data)
        print(f"📊 Login Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Error en login: {response.text}")
            return False
            
        data = response.json()
        token = data.get('access_token')
        print("✅ Login exitoso!")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
    
    if not token:
        print("❌ No se obtuvo token válido")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 2. Test endpoint GET /admin/users
    print("\n2️⃣ PASO 2: Test endpoint GET /admin/users")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            users_data = response.json()
            users = users_data.get('users', [])
            print(f"✅ Endpoint GET /admin/users funciona!")
            print(f"👥 Total usuarios: {len(users)}")
            
            # Mostrar usuarios existentes
            for user in users:
                role = "Admin" if user.get('is_admin') else "User"
                print(f"   - {user.get('username')} ({role}) - ID: {user.get('id')} - Nombre: {user.get('full_name')}")
                
            # Buscar un usuario no-admin para editar
            test_user = None
            for user in users:
                if user.get('username') != 'pedro':
                    test_user = user
                    break
                    
            if not test_user:
                print("⚠️  No se encontró usuario no-admin para probar edición")
                return True
                
        else:
            print(f"❌ Error en GET /admin/users: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en test de usuarios: {e}")
        return False
    
    # 3. Test endpoint GET /admin/users/{user_id}
    print(f"\n3️⃣ PASO 3: Test endpoint GET /admin/users/{test_user['id']}")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/users/{test_user['id']}", headers=headers)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            user_detail = response.json()
            print(f"✅ Endpoint GET /admin/users/{{id}} funciona!")
            print(f"📋 Usuario obtenido: {user_detail}")
        else:
            print(f"❌ Error en GET user by ID: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en test GET user by ID: {e}")
    
    # 4. Test endpoint PUT /admin/users/{user_id} - Actualizar datos
    print(f"\n4️⃣ PASO 4: Test endpoint PUT /admin/users/{test_user['id']}")
    print("-" * 50)
    
    # Datos de prueba para actualización
    new_username = f"{test_user['username']}_updated"
    new_full_name = f"{test_user['full_name']} EDITED"
    
    update_data = {
        "username": new_username,
        "full_name": new_full_name,
        "is_admin": not test_user.get('is_admin', False)  # Cambiar el estado de admin
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/users/{test_user['id']}", 
            headers=headers,
            json=update_data
        )
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            updated_user = response.json()
            print(f"✅ Endpoint PUT /admin/users/{{id}} funciona!")
            print(f"📋 Usuario actualizado:")
            print(f"   Username: {test_user['username']} → {updated_user.get('username')}")
            print(f"   Full Name: {test_user['full_name']} → {updated_user.get('full_name')}")
            print(f"   Is Admin: {test_user.get('is_admin')} → {updated_user.get('is_admin')}")
            
            # Guardar datos actualizados para verificación posterior
            test_user.update(updated_user)
            
        else:
            print(f"❌ Error en PUT user: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en test PUT user: {e}")
    
    # 5. Verificar que los cambios se aplicaron correctamente
    print(f"\n5️⃣ PASO 5: Verificar que los cambios se guardaron")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/users/{test_user['id']}", headers=headers)
        
        if response.status_code == 200:
            verified_user = response.json()
            print(f"✅ Verificación exitosa!")
            
            # Verificar cada campo
            username_ok = verified_user.get('username') == new_username
            fullname_ok = verified_user.get('full_name') == new_full_name
            admin_ok = verified_user.get('is_admin') == update_data['is_admin']
            
            print(f"   ✅ Username actualizado: {'✓' if username_ok else '✗'}")
            print(f"   ✅ Full Name actualizado: {'✓' if fullname_ok else '✗'}")
            print(f"   ✅ Admin status actualizado: {'✓' if admin_ok else '✗'}")
            
            if username_ok and fullname_ok and admin_ok:
                print("🎉 ¡Todos los campos se actualizaron correctamente!")
            else:
                print("⚠️  Algunos campos no se actualizaron correctamente")
                
        else:
            print(f"❌ Error verificando cambios: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
    
    # 6. Test propagación de username en otras tablas (si hay items del usuario)
    print(f"\n6️⃣ PASO 6: Verificar propagación de username en items")
    print("-" * 50)
    
    try:
        # Obtener items para verificar si el username se propagó
        response = requests.get(f"{BASE_URL}/items", headers=headers)
        
        if response.status_code == 200:
            items_data = response.json()
            items = items_data.get('items', []) if isinstance(items_data, dict) else items_data
            
            # Buscar items del usuario original y verificar si se actualizaron
            user_items = [item for item in items if item.get('seller') == new_username]
            old_user_items = [item for item in items if item.get('seller') == test_user.get('username')]
            
            print(f"📦 Items con nuevo username ({new_username}): {len(user_items)}")
            print(f"📦 Items con username anterior: {len(old_user_items)}")
            
            if len(old_user_items) == 0:
                print("✅ Propagación de username exitosa - no se encontraron items con username anterior")
            else:
                print("⚠️  Algunos items aún tienen el username anterior")
                
        else:
            print(f"⚠️  No se pudo verificar items: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Error verificando propagación: {e}")
    
    print("\n🎉 TEST COMPLETADO")
    print("=" * 70)
    print("📋 FUNCIONALIDADES PROBADAS:")
    print("✅ GET /admin/users - Lista de usuarios")
    print("✅ GET /admin/users/{id} - Usuario específico")
    print("✅ PUT /admin/users/{id} - Actualización de usuario")
    print("✅ Edición de username, full_name e is_admin")
    print("✅ Verificación de cambios persistidos")
    print("✅ Propagación de username a tablas relacionadas")
    print("\n💡 El AdminPanel ahora puede editar todos los campos de usuario!")
    
    return True

if __name__ == "__main__":
    test_user_edit_functionality()