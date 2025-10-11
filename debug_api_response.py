#!/usr/bin/env python3
"""
Debug de la respuesta de la API
"""
import requests
import json

BASE_URL = "https://cubaunify.uk"

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

if response.status_code == 200:
    token = response.json().get("access_token")
    print(f"Token: {token[:50]}...")
    
    # Probar lista de usuarios
    users_response = requests.get(
        f"{BASE_URL}/admin/users",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    print(f"\nUsers response status: {users_response.status_code}")
    print(f"Users response type: {type(users_response.json())}")
    print(f"Users response content: {users_response.json()}")
else:
    print("Login failed")