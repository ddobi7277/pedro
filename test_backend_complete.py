#!/usr/bin/env python3
"""
Test completo para verificar que el backend funcione correctamente
"""
import requests
import json
import sys

# URL del backend (cubaunify.uk en lugar de localhost)
BASE_URL = "https://cubaunify.uk"

def test_login():
    """Probar login con credenciales correctas"""
    print("🔍 Testing login with correct credentials...")
    
    login_data = {
        "username": "pedro",
        "password": "Admin,1234"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            print(f"✅ Login successful! Token obtained: {token[:50]}...")
            return token
        else:
            print(f"❌ Login failed")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
            return None
    
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_user_creation(token):
    """Probar creación de usuario"""
    print("\n🔍 Testing user creation...")
    
    if not token:
        print("❌ No token available for user creation test")
        return
    
    import time
    test_user = {
        "username": f"testuser{int(time.time()) % 10000}",
        "full_name": "Test User Auto Generated",
        "email": "test@example.com",
        "store_name": "Test Store Auto",
        "hashed_password": "testpass123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/register",
            json=test_user,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        print(f"Register status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User creation successful!")
            print(f"User ID: {result.get('id')}")
            return result.get('id')
        else:
            print(f"❌ User creation failed")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
            return None
    
    except Exception as e:
        print(f"❌ User creation error: {e}")
        return None

def test_user_list(token):
    """Probar listado de usuarios"""
    print("\n🔍 Testing user list...")
    
    if not token:
        print("❌ No token available for user list test")
        return []
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/users",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        print(f"User list status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', []) if isinstance(data, dict) else data
            print(f"✅ User list successful! Found {len(users)} users")
            for user in users:
                print(f"  - {user.get('username', 'N/A')} ({user.get('full_name', 'N/A')}) - Admin: {user.get('is_admin', False)}")
            return users
        else:
            print(f"❌ User list failed")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
            return []
    
    except Exception as e:
        print(f"❌ User list error: {e}")
        return []

def test_user_update(token, users):
    """Probar actualización de usuario"""
    print("\n🔍 Testing user update...")
    
    if not token:
        print("❌ No token available for user update test")
        return
    
    if not users:
        print("❌ No users available for update test")
        return
    
    # Buscar un usuario que no sea pedro para actualizar
    test_user = None
    for user in users:
        if user['username'] != 'pedro':
            test_user = user
            break
    
    if not test_user:
        print("❌ No non-admin user found for update test")
        return
    
    user_id = test_user['id']
    print(f"Testing update on user: {test_user['username']} (ID: {user_id})")
    
    update_data = {
        "full_name": f"Updated {test_user['full_name']}",
        "email": "updated@test.com",
        "store_name": "Updated Store Name"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/users/{user_id}",
            json=update_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        print(f"User update status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User update successful!")
            print(f"Updated user: {result}")
        else:
            print(f"❌ User update failed")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
    
    except Exception as e:
        print(f"❌ User update error: {e}")

def main():
    print("🚀 Starting comprehensive backend test...\n")
    
    # Test connectivity first
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Backend is accessible\n")
        else:
            print("❌ Backend not accessible")
            return
    except:
        print(f"❌ Backend not accessible - make sure it's running on {BASE_URL}")
        return
    
    # Test login
    token = test_login()
    
    # Test user list
    users = test_user_list(token)
    
    # Test user creation
    new_user_id = test_user_creation(token)
    
    # Test user update
    test_user_update(token, users)
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main()