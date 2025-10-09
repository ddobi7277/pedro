#!/usr/bin/env python3
"""
Script para probar la verificación de contraseña del usuario pedro
"""
import sys
import os
import sqlite3

# Agregar path para importar
sys.path.append(os.path.join(os.path.dirname(__file__), 'files'))

def test_pedro_password():
    """Probar la contraseña del usuario pedro"""
    print("🔍 Testing pedro's password...")
    
    # Obtener hash de pedro desde la base de datos
    db_path = "files/data.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT hashed_password FROM users WHERE username = 'pedro';")
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        print("❌ User pedro not found")
        return
    
    pedro_hash = result[0]
    print(f"Pedro's hash: {pedro_hash}")
    
    # Probar contraseña usando bcrypt directamente
    try:
        import bcrypt
        
        test_passwords = ["Admin,1234", "admin123", "pedro", "Admin123", "Admin,123"]
        
        for test_pass in test_passwords:
            try:
                # Convertir contraseña a bytes
                password_bytes = test_pass.encode('utf-8')
                hash_bytes = pedro_hash.encode('utf-8')
                
                # Verificar con bcrypt
                is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
                print(f"Password '{test_pass}': {'✅ VALID' if is_valid else '❌ Invalid'}")
                
                if is_valid:
                    print(f"🎉 ¡CONTRASEÑA CORRECTA ENCONTRADA!: '{test_pass}'")
                    
            except Exception as e:
                print(f"Password '{test_pass}': ❌ Error - {e}")
                
    except ImportError:
        print("❌ bcrypt not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "bcrypt"])
        print("✅ bcrypt installed. Please run the script again.")

def test_login_direct():
    """Probar login directamente usando las funciones del backend"""
    print("\n🔍 Testing login with backend functions...")
    
    try:
        # Importar funciones del backend
        from services import authenticate_user, get_db
        
        # Obtener sesión de base de datos
        db = next(get_db())
        
        # Probar autenticación
        test_passwords = ["Admin,1234", "admin123", "pedro"]
        
        for test_pass in test_passwords:
            try:
                user = authenticate_user(db, "pedro", test_pass)
                if user:
                    print(f"✅ Login successful with password: '{test_pass}'")
                    print(f"   User: {user.username}, Admin: {user.is_admin}")
                    return True
                else:
                    print(f"❌ Login failed with password: '{test_pass}'")
            except Exception as e:
                print(f"❌ Error testing password '{test_pass}': {e}")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error importing backend functions: {e}")
        import traceback
        traceback.print_exc()
    
    return False

def main():
    print("🚀 Testing pedro's authentication...\n")
    
    test_pedro_password()
    test_login_direct()
    
    print("\n✅ Authentication test complete!")

if __name__ == "__main__":
    main()