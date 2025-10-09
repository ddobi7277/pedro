#!/usr/bin/env python3
"""
Script para diagnosticar problemas con las peticiones de usuarios
"""
import requests
import json
import sys

def test_backend_connectivity():
    """Probar conectividad básica del backend"""
    print("🔍 Testing backend connectivity...")
    
    try:
        response = requests.get("http://localhost:8000/docs")
        print(f"✅ Backend accessible - Status: {response.status_code}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend not accessible on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        return False

def test_register_endpoint():
    """Probar el endpoint de registro"""
    print("\n🔍 Testing register endpoint...")
    
    # Primero necesitamos un token válido
    # Intentar login como pedro
    login_data = {
        "username": "pedro",
        "password": "Admin,1234"  # credenciales correctas
    }
    
    try:
        # Login
        login_response = requests.post(
            "http://localhost:8000/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get("access_token")
            print(f"✅ Login successful, token obtained")
            
            # Test register
            test_user = {
                "username": "testuser123",
                "full_name": "Test User",
                "hashed_password": "testpass123"
            }
            
            register_response = requests.post(
                "http://localhost:8000/register",
                json=test_user,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"Register response status: {register_response.status_code}")
            try:
                print(f"Register response body: {register_response.json()}")
            except:
                print(f"Register response text: {register_response.text}")
                
        else:
            print(f"❌ Login failed - Status: {login_response.status_code}")
            try:
                print(f"Login error: {login_response.json()}")
            except:
                print(f"Login error text: {login_response.text}")
    
    except Exception as e:
        print(f"❌ Error testing register: {e}")

def test_user_update_endpoint():
    """Probar el endpoint de actualización de usuarios"""
    print("\n🔍 Testing user update endpoint...")
    
    # Login first
    login_data = {
        "username": "pedro",
        "password": "Admin,1234"
    }
    
    try:
        login_response = requests.post(
            "http://localhost:8000/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get("access_token")
            print(f"✅ Login successful for user update test")
            
            # Get users list first to get a valid user ID
            users_response = requests.get(
                "http://localhost:8000/admin/users",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            
            if users_response.status_code == 200:
                users = users_response.json()
                if users:
                    user_id = users[0]["id"]  # Get first user ID
                    print(f"✅ Found user ID for testing: {user_id}")
                    
                    # Test update
                    update_data = {
                        "full_name": "Updated Name Test",
                        "email": "updated@test.com"
                    }
                    
                    update_response = requests.put(
                        f"http://localhost:8000/admin/users/{user_id}",
                        json=update_data,
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json"
                        }
                    )
                    
                    print(f"Update response status: {update_response.status_code}")
                    try:
                        print(f"Update response body: {update_response.json()}")
                    except:
                        print(f"Update response text: {update_response.text}")
                else:
                    print("❌ No users found for testing")
            else:
                print(f"❌ Failed to get users list - Status: {users_response.status_code}")
        else:
            print(f"❌ Login failed for update test - Status: {login_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error testing user update: {e}")

def main():
    print("🚀 Starting user request diagnostics...\n")
    
    # Test connectivity
    if not test_backend_connectivity():
        print("❌ Cannot continue - backend not accessible")
        return
    
    # Test endpoints
    test_register_endpoint()
    test_user_update_endpoint()
    
    print("\n✅ Diagnostics complete!")

if __name__ == "__main__":
    main()