#!/usr/bin/env python3

import requests
import json

def test_production_structure():
    """Test the production endpoint to see current structure"""
    
    print("🔍 Testing production /store/claudia/items endpoint...")
    
    url = "https://cubaunify.uk/store/claudia/items"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success! Found {len(data)} items")
                
                if data:
                    first_item = data[0]
                    print(f"\n📦 First item structure:")
                    for key, value in first_item.items():
                        print(f"  {key}: {value}")
                    
                    print(f"\n📋 Complete JSON response:")
                    print(json.dumps(data, indent=2))
                        
                else:
                    print("⚠️ No items found")
                    
            except json.JSONDecodeError:
                print("❌ Response was not valid JSON")
                print(f"Response content: {response.text[:500]}...")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_production_structure()