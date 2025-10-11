#!/usr/bin/env python3
"""
Test CORS configuration
"""
import requests

BASE_URL = "https://cubaunify.uk"

def test_cors_origins():
    """Test if whimsy-mac.com is allowed in CORS"""
    print("🔍 Testing CORS configuration...")
    
    # Login para obtener token
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
        print("✅ Login successful")
        
        # Test endpoint para ver orígenes permitidos
        origins_response = requests.get(
            f"{BASE_URL}/admin/allowed-origins",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if origins_response.status_code == 200:
            data = origins_response.json()
            print("✅ CORS origins endpoint accessible")
            print("\n📋 Allowed origins:")
            for origin in data.get("allowed_origins", []):
                print(f"  - {origin}")
                
            # Check if whimsy-mac.com is in the list
            origins = data.get("allowed_origins", [])
            whimsy_origins = [o for o in origins if "whimsy-mac" in o]
            
            if whimsy_origins:
                print(f"\n✅ whimsy-mac.com domains found: {whimsy_origins}")
            else:
                print(f"\n❌ whimsy-mac.com domains NOT found")
                
        else:
            print(f"❌ Could not get origins: {origins_response.status_code}")
            print(f"Response: {origins_response.text}")
    else:
        print("❌ Login failed")

if __name__ == "__main__":
    test_cors_origins()