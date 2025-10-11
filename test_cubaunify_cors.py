#!/usr/bin/env python3

import requests
import json

def test_cubaunify_cors():
    """Test CORS headers for cubaunify.uk domain (without www)"""
    
    print("🔍 Testing /store/claudia/items endpoint with cubaunify.uk origin...")
    
    # Test the public store endpoint that's causing issues
    url = "https://cubaunify.uk/store/claudia/items"
    
    headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type'
    }
    
    try:
        # First, test a preflight request
        print("📡 Testing preflight OPTIONS request...")
        preflight_response = requests.options(url, headers=headers, timeout=10)
        print(f"📥 Preflight status: {preflight_response.status_code}")
        print("📋 Preflight CORS headers:")
        cors_headers = {k: v for k, v in preflight_response.headers.items() 
                       if k.lower().startswith('access-control')}
        for key, value in cors_headers.items():
            print(f"  {key}: {value}")
        
        # Then test the actual GET request
        print("\n📡 Testing actual GET request...")
        response = requests.get(url, headers={'Origin': 'http://localhost:3000'}, timeout=10)
        print(f"📥 Response status: {response.status_code}")
        
        print("📋 Response headers (CORS):")
        cors_headers = {k: v for k, v in response.headers.items() 
                       if k.lower().startswith('access-control')}
        for key, value in cors_headers.items():
            print(f"  {key}: {value}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                items = data if isinstance(data, list) else data.get('items', [])
                print(f"✅ Success! Found {len(items)} items")
                if items:
                    print("📦 Sample item:")
                    item = items[0]
                    print(f"  Name: {item.get('name', 'N/A')}")
                    print(f"  Price: {item.get('price', 'N/A')}")
            except json.JSONDecodeError:
                print("⚠️ Response was not JSON")
                print(f"Response content: {response.text[:200]}...")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

def test_direct_domain_access():
    """Test accessing cubaunify.uk directly vs with redirect"""
    
    print("\n🔍 Testing direct domain access...")
    
    # Test HTTP (should redirect to HTTPS)
    print("📡 Testing HTTP access (should redirect)...")
    try:
        http_response = requests.get("http://cubaunify.uk/store/claudia/items", 
                                   allow_redirects=False, timeout=10)
        print(f"📥 HTTP Response status: {http_response.status_code}")
        if 'location' in http_response.headers:
            print(f"🔀 Redirect to: {http_response.headers['location']}")
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP request failed: {e}")
    
    # Test HTTPS directly
    print("\n📡 Testing HTTPS access directly...")
    try:
        https_response = requests.get("https://cubaunify.uk/store/claudia/items", 
                                    headers={'Origin': 'http://localhost:3000'}, 
                                    timeout=10)
        print(f"📥 HTTPS Response status: {https_response.status_code}")
        
        print("📋 HTTPS CORS headers:")
        cors_headers = {k: v for k, v in https_response.headers.items() 
                       if k.lower().startswith('access-control')}
        for key, value in cors_headers.items():
            print(f"  {key}: {value}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTPS request failed: {e}")

if __name__ == "__main__":
    test_cubaunify_cors()
    test_direct_domain_access()