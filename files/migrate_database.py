#!/usr/bin/env python3
"""
Script para migrar la base de datos agregando la columna is_admin
sin perder los datos existentes
"""

import sqlite3
import os

def migrate_database():
    db_path = "data.db"
    
    if not os.path.exists(db_path):
        print("❌ Base de datos no encontrada")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si la columna ya existe
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_admin' in columns:
            print("✅ La columna 'is_admin' ya existe")
            # Verificar si el usuario pedro es admin
            cursor.execute("SELECT username, is_admin FROM users WHERE username = 'pedro'")
            pedro_data = cursor.fetchone()
            
            if pedro_data:
                username, is_admin = pedro_data
                if not is_admin:
                    print("🔄 Actualizando usuario 'pedro' para ser admin...")
                    cursor.execute("UPDATE users SET is_admin = 1 WHERE username = 'pedro'")
                    conn.commit()
                    print("✅ Usuario 'pedro' actualizado como administrador")
                else:
                    print("✅ Usuario 'pedro' ya es administrador")
            else:
                print("⚠️ Usuario 'pedro' no encontrado en la base de datos")
        else:
            print("🔄 Agregando columna 'is_admin' a la tabla users...")
            
            # Agregar la columna is_admin con valor por defecto False (0)
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            
            # Buscar si existe el usuario pedro y hacerlo admin
            cursor.execute("SELECT id FROM users WHERE username = 'pedro'")
            pedro_exists = cursor.fetchone()
            
            if pedro_exists:
                print("🔄 Actualizando usuario 'pedro' para ser admin...")
                cursor.execute("UPDATE users SET is_admin = 1 WHERE username = 'pedro'")
            
            conn.commit()
            print("✅ Migración completada exitosamente")
            
        # Mostrar todos los usuarios después de la migración
        print("\n📋 Usuarios en la base de datos:")
        cursor.execute("SELECT id, username, full_name, is_admin FROM users")
        users = cursor.fetchall()
        
        if users:
            print("ID | Username | Full Name | Is Admin")
            print("-" * 50)
            for user in users:
                user_id, username, full_name, is_admin = user
                admin_status = "✅ Admin" if is_admin else "👤 User"
                print(f"{user_id[:8]}... | {username} | {full_name} | {admin_status}")
        else:
            print("No hay usuarios en la base de datos")
            
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error de base de datos: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando migración de base de datos...")
    success = migrate_database()
    
    if success:
        print("\n✅ Migración completada. Puedes reiniciar el servidor ahora.")
    else:
        print("\n❌ Migración falló. Revisa los errores arriba.")