#!/usr/bin/env python3
"""
Test específico para edición de usuarios
"""
import requests
import json

BASE_URL = "https://cubaunify.uk"

def test_user_edit():
    print("🔍 Testing user edit functionality...")
    
    # Login
    login_data = {
        "username": "pedro",
        "password": "Admin,1234"
    }
    
    response = requests.post(
        f"{BASE_URL}/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = response.json().get("access_token")
    print("✅ Login successful")
    
    # Obtener lista de usuarios
    users_response = requests.get(
        f"{BASE_URL}/admin/users",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if users_response.status_code != 200:
        print("❌ Failed to get users")
        return
    
    users_data = users_response.json()
    users = users_data.get('users', [])
    
    print(f"✅ Found {len(users)} users")
    
    # Buscar un usuario que no sea pedro para editar
    target_user = None
    for user in users:
        if user['username'] != 'pedro':
            target_user = user
            break
    
    if not target_user:
        print("❌ No non-admin user found for testing")
        return
    
    user_id = target_user['id']
    print(f"📝 Testing edit on user: {target_user['username']} (ID: {user_id})")
    
    # Datos de actualización - exactamente lo que enviaría el frontend
    update_data = {
        "username": target_user['username'],  # Mantenemos el mismo username
        "full_name": f"EDITED - {target_user['full_name']}",
        "email": "edited@test.com",
        "store_name": "Edited Store Name",
        "is_admin": target_user.get('is_admin', False)
    }
    
    print(f"📤 Sending update data: {json.dumps(update_data, indent=2)}")
    
    # Hacer la petición de actualización
    update_response = requests.put(
        f"{BASE_URL}/admin/users/{user_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    print(f"📥 Update response status: {update_response.status_code}")
    
    if update_response.status_code == 200:
        result = update_response.json()
        print("✅ User update successful!")
        print(f"📋 Updated user data: {json.dumps(result, indent=2)}")
        
        # Verificar que los cambios se guardaron
        verify_response = requests.get(
            f"{BASE_URL}/admin/users/{user_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if verify_response.status_code == 200:
            verified_user = verify_response.json()
            print("✅ Verification successful!")
            print(f"📋 Verified user data: {json.dumps(verified_user, indent=2)}")
        else:
            print("⚠️ Could not verify changes")
    else:
        print("❌ User update failed")
        try:
            error_data = update_response.json()
            print(f"Error: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error text: {update_response.text}")

if __name__ == "__main__":
    test_user_edit()