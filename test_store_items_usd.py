#!/usr/bin/env python3

import requests
import json

def test_store_items_usd():
    """Test the /store/{seller}/items endpoint to verify it returns USD prices"""
    
    print("🔍 Testing /store/claudia/items endpoint for USD prices...")
    
    # Test the public store endpoint
    url = "https://cubaunify.uk/store/claudia/items"
    
    headers = {
        'Origin': 'http://localhost:3000',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success! Found {len(data)} items")
                
                if data:
                    print("\n📦 Sample items with USD prices:")
                    for i, item in enumerate(data[:3]):  # Show first 3 items
                        print(f"  Item {i+1}:")
                        print(f"    ID: {item.get('id', 'N/A')}")
                        print(f"    Name: {item.get('name', 'N/A')}")
                        print(f"    Price (USD): ${item.get('price', 'N/A')}")
                        print(f"    Quantity: {item.get('cant', 'N/A')}")
                        print(f"    Category: {item.get('category', 'N/A')}")
                        print(f"    Image: {item.get('image', 'N/A')}")
                        print(f"    Details: {item.get('detalles', 'N/A')}")
                        print()
                        
                    # Verify the structure matches what was requested
                    expected_fields = ['id', 'name', 'price', 'cant', 'category', 'image', 'detalles']
                    first_item = data[0]
                    
                    print("🔍 Checking response structure:")
                    for field in expected_fields:
                        if field in first_item:
                            print(f"  ✅ {field}: present")
                        else:
                            print(f"  ❌ {field}: missing")
                    
                    # Check for unexpected fields
                    unexpected_fields = [field for field in first_item.keys() if field not in expected_fields]
                    if unexpected_fields:
                        print(f"  ⚠️  Unexpected fields: {unexpected_fields}")
                    else:
                        print("  ✅ No unexpected fields")
                        
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

def test_localhost_comparison():
    """Test the same endpoint on localhost to compare"""
    
    print("\n🔍 Testing localhost for comparison...")
    
    url = "http://localhost:8000/store/claudia/items"
    
    try:
        response = requests.get(url, timeout=5)
        print(f"📥 Localhost response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Localhost: Found {len(data)} items")
            
            if data:
                first_item = data[0]
                print(f"📦 First item on localhost:")
                print(f"  ID: {first_item.get('id', 'N/A')}")
                print(f"  Name: {first_item.get('name', 'N/A')}")
                print(f"  Price (USD): ${first_item.get('price', 'N/A')}")
                print(f"  Category: {first_item.get('category', 'N/A')}")
                
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Localhost not available: {e}")

if __name__ == "__main__":
    test_store_items_usd()
    test_localhost_comparison()