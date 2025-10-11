#!/usr/bin/env python3
"""
Test específico del endpoint /store/{seller}/items que estaba fallando con CORS
"""
import requests

BASE_URL = "https://cubaunify.uk"

def test_store_endpoint():
    """Test el endpoint público /store/{seller}/items"""
    print("🔍 Testing /store/claudia/items endpoint...")
    
    try:
        # Hacer petición al endpoint público (no requiere autenticación)
        response = requests.get(
            f"{BASE_URL}/store/claudia/items",
            headers={
                "Origin": "http://localhost:3000",  # Simular petición desde localhost
                "Content-Type": "application/json"
            }
        )
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📋 Response headers (CORS):")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data)} items")
            
            if data:
                print("📦 Sample item:")
                print(f"  Name: {data[0].get('name', 'N/A')}")
                print(f"  Price: {data[0].get('price', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error data: {error_data}")
            except:
                print(f"Error text: {response.text}")
                
    except Exception as e:
        print(f"❌ Error making request: {e}")

def test_options_request():
    """Test CORS preflight (OPTIONS) request"""
    print("\n🔍 Testing CORS preflight (OPTIONS)...")
    
    try:
        response = requests.options(
            f"{BASE_URL}/store/claudia/items",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        
        print(f"📥 OPTIONS response status: {response.status_code}")
        print(f"📋 CORS headers:")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
            
    except Exception as e:
        print(f"❌ Error with OPTIONS: {e}")

if __name__ == "__main__":
    test_store_endpoint()
    test_options_request()