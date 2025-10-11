#!/usr/bin/env python3
"""
Verificar estructura de la base de datos
"""
import sqlite3

def check_database_structure():
    print("🔍 Checking database structure...")
    
    try:
        conn = sqlite3.connect('files/data.db')
        cursor = conn.cursor()
        
        # Obtener estructura de la tabla users
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("\n📋 Current 'users' table structure:")
        print("ID | Name          | Type    | NotNull | Default | PK")
        print("-" * 55)
        for col in columns:
            cid, name, dtype, notnull, default_val, pk = col
            print(f"{cid:2} | {name:13} | {dtype:7} | {notnull:7} | {str(default_val):7} | {pk}")
        
        # Verificar datos de usuarios existentes
        cursor.execute("SELECT * FROM users LIMIT 3")
        users = cursor.fetchall()
        
        print(f"\n👥 Sample users (showing first 3):")
        for user in users:
            print(f"  {user}")
            
        # Verificar si existen los campos email y store_name
        column_names = [col[1] for col in columns]
        print(f"\n🔍 Available columns: {column_names}")
        
        missing_fields = []
        if 'email' not in column_names:
            missing_fields.append('email')
        if 'store_name' not in column_names:
            missing_fields.append('store_name')
            
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
        else:
            print("✅ All required fields are present")
            
        conn.close()
        return missing_fields
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return None

if __name__ == "__main__":
    missing_fields = check_database_structure()
    
    if missing_fields:
        print(f"\n💡 Need to add these fields to the database: {missing_fields}")
        print("Run a migration to add them.")
    else:
        print(f"\n✅ Database structure looks good!")