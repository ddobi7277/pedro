#!/usr/bin/env python3
"""
Script para verificar usuarios directamente con SQLite
"""
import sqlite3
import os

def check_users_direct():
    """Verificar usuarios directamente con SQLite"""
    print("🔍 Checking users directly with SQLite...")
    
    db_path = "files/data.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Obtener todos los usuarios
        cursor.execute("SELECT * FROM users;")
        users = cursor.fetchall()
        
        # Obtener nombres de columnas
        cursor.execute("PRAGMA table_info(users);")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        
        print(f"✅ Found {len(users)} users:")
        print(f"Columns: {column_names}")
        print()
        
        for user in users:
            print(f"User: {dict(zip(column_names, user))}")
            print()
        
        # Buscar específicamente usuario pedro
        cursor.execute("SELECT * FROM users WHERE username = 'pedro';")
        pedro = cursor.fetchone()
        
        if pedro:
            pedro_dict = dict(zip(column_names, pedro))
            print(f"✅ User 'pedro' found:")
            for key, value in pedro_dict.items():
                if key == 'hashed_password':
                    print(f"  {key}: {'*' * min(len(str(value)), 20)} (length: {len(str(value))})")
                else:
                    print(f"  {key}: {value}")
        else:
            print("❌ User 'pedro' not found")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def test_password_verification():
    """Probar verificación de contraseña manual"""
    print("\n🔍 Testing password verification...")
    
    # Importar las funciones de hashing
    try:
        import sys
        sys.path.append('files')
        from services import verify_password, get_password_hash
        
        # Probar crear un hash y verificarlo
        test_password = "Admin,1234"
        hashed = get_password_hash(test_password)
        print(f"Test password: {test_password}")
        print(f"Generated hash: {hashed}")
        
        # Verificar
        is_valid = verify_password(test_password, hashed)
        print(f"Verification result: {'✅ VALID' if is_valid else '❌ Invalid'}")
        
    except Exception as e:
        print(f"❌ Error testing password: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🚀 Starting direct database verification...\n")
    
    check_users_direct()
    test_password_verification()
    
    print("\n✅ Direct verification complete!")

if __name__ == "__main__":
    main()