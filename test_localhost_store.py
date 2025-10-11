#!/usr/bin/env python3

import requests
import json

def test_localhost_store_items():
    """Test the local /store/{seller}/items endpoint to verify category is included"""
    
    print("🔍 Testing localhost /store/claudia/items endpoint for category...")
    
    url = "http://localhost:8000/store/claudia/items"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success! Found {len(data)} items")
                
                if data:
                    print("\n📦 Items with categories:")
                    for i, item in enumerate(data):
                        print(f"  Item {i+1}:")
                        print(f"    Name: {item.get('name', 'N/A')}")
                        print(f"    Price (USD): ${item.get('price', 'N/A')}")
                        print(f"    Quantity: {item.get('cant', 'N/A')}")
                        print(f"    Category: {item.get('category', 'N/A')}")
                        print(f"    Image: {item.get('image', 'N/A')}")
                        print(f"    Details: {item.get('detalles', 'N/A')}")
                        print()
                        
                    # Verify the structure
                    expected_fields = ['name', 'price', 'cant', 'category', 'image', 'detalles']
                    first_item = data[0]
                    
                    print("🔍 Checking response structure:")
                    for field in expected_fields:
                        if field in first_item:
                            print(f"  ✅ {field}: present ({first_item[field]})")
                        else:
                            print(f"  ❌ {field}: missing")
                    
                    # Show the complete JSON structure
                    print(f"\n📋 Complete JSON response:")
                    print(json.dumps(data, indent=2))
                        
                else:
                    print("⚠️ No items found for this seller")
                    
            except json.JSONDecodeError:
                print("❌ Response was not valid JSON")
                print(f"Response content: {response.text[:200]}...")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_localhost_store_items()