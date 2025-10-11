#!/usr/bin/env python3
"""
Debug específico para ver qué devuelve la API /admin/users
"""
import requests
import json

BASE_URL = "https://cubaunify.uk"

def debug_admin_users():
    print("🔍 Debugging /admin/users response...")
    
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
    
    print(f"📥 Response status: {users_response.status_code}")
    
    if users_response.status_code == 200:
        data = users_response.json()
        print(f"📋 Full response structure:")
        print(json.dumps(data, indent=2))
        
        users = data.get('users', [])
        print(f"\n👥 Found {len(users)} users:")
        
        for i, user in enumerate(users):
            print(f"\n  User {i+1}:")
            print(f"    ID: {user.get('id')}")
            print(f"    Username: {user.get('username')}")
            print(f"    Full Name: {user.get('full_name')}")
            print(f"    Email: {repr(user.get('email'))}")  # repr para ver None vs ''
            print(f"    Store Name: {repr(user.get('store_name'))}")
            print(f"    Is Admin: {user.get('is_admin')}")
    else:
        print("❌ Failed to get users")
        try:
            error_data = users_response.json()
            print(f"Error: {error_data}")
        except:
            print(f"Error text: {users_response.text}")

if __name__ == "__main__":
    debug_admin_users()