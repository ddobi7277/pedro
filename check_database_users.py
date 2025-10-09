#!/usr/bin/env python3
"""
Script para verificar usuarios en la base de datos
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'files'))

from services import get_db, verify_password
from models import User
import sqlite3

def check_database_connection():
    """Verificar conexión a la base de datos"""
    print("🔍 Checking database connection...")
    
    try:
        # Verificar si el archivo de base de datos existe
        db_path = "files/data.db"
        if os.path.exists(db_path):
            print(f"✅ Database file exists: {db_path}")
        else:
            print(f"❌ Database file not found: {db_path}")
            return False
            
        # Conectar directamente con sqlite3 para verificar
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si la tabla users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if cursor.fetchone():
            print("✅ Users table exists")
        else:
            print("❌ Users table does not exist")
            conn.close()
            return False
            
        # Contar usuarios
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        print(f"✅ Found {user_count} users in database")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def check_users():
    """Verificar usuarios en la base de datos usando SQLAlchemy"""
    print("\n🔍 Checking users with SQLAlchemy...")
    
    try:
        # Obtener sesión de base de datos
        db = next(get_db())
        
        # Obtener todos los usuarios
        users = db.query(User).all()
        print(f"✅ Found {len(users)} users:")
        
        for user in users:
            print(f"  - ID: {user.id}")
            print(f"    Username: {user.username}")
            print(f"    Full name: {user.full_name}")
            print(f"    Email: {user.email}")
            print(f"    Store name: {user.store_name}")
            print(f"    Is admin: {user.is_admin}")
            print(f"    Hashed password length: {len(user.hashed_password) if user.hashed_password else 0}")
            print()
        
        # Verificar específicamente el usuario pedro
        pedro = db.query(User).filter(User.username == "pedro").first()
        if pedro:
            print(f"✅ User 'pedro' found:")
            print(f"  - ID: {pedro.id}")
            print(f"  - Is admin: {pedro.is_admin}")
            print(f"  - Has password: {bool(pedro.hashed_password)}")
            
            # Probar verificación de contraseña
            test_passwords = ["Admin,1234", "admin123", "pedro", "Admin123", "Admin,123"]
            for test_pass in test_passwords:
                try:
                    is_valid = verify_password(test_pass, pedro.hashed_password)
                    print(f"  - Password '{test_pass}': {'✅ VALID' if is_valid else '❌ Invalid'}")
                except Exception as e:
                    print(f"  - Password '{test_pass}': ❌ Error - {e}")
        else:
            print("❌ User 'pedro' not found")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Error checking users: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🚀 Starting database user verification...\n")
    
    # Check database connection
    if not check_database_connection():
        print("❌ Cannot continue - database issues")
        return
    
    # Check users
    check_users()
    
    print("\n✅ Database verification complete!")

if __name__ == "__main__":
    main()