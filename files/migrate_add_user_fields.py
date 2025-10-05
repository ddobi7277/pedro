#!/usr/bin/env python3
"""
Migration script to add email and store_name columns to users table
"""

import sqlite3
import os

def migrate_database():
    """Add email and store_name columns to users table if they don't exist"""
    
    # Ruta a la base de datos
    db_path = "data.db"
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si las columnas ya existen
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print(f"Current columns in users table: {columns}")
        
        # Agregar columna email si no existe
        if 'email' not in columns:
            print("Adding email column...")
            cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR")
            print("✅ Email column added successfully")
        else:
            print("⚠️ Email column already exists")
        
        # Agregar columna store_name si no existe
        if 'store_name' not in columns:
            print("Adding store_name column...")
            cursor.execute("ALTER TABLE users ADD COLUMN store_name VARCHAR")
            print("✅ Store_name column added successfully")
        else:
            print("⚠️ Store_name column already exists")
        
        # Confirmar cambios
        conn.commit()
        
        # Verificar la estructura final
        cursor.execute("PRAGMA table_info(users)")
        new_columns = [column[1] for column in cursor.fetchall()]
        print(f"Final columns in users table: {new_columns}")
        
        conn.close()
        print("🎉 Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🔄 Starting database migration...")
    print("Adding email and store_name columns to users table")
    print("-" * 50)
    
    success = migrate_database()
    
    if success:
        print("-" * 50)
        print("✅ Migration completed successfully!")
        print("You can now restart your server to use the new fields.")
    else:
        print("-" * 50)
        print("❌ Migration failed!")
        print("Please check the error messages above.")