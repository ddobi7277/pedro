#!/usr/bin/env python3
"""
Script para verificar la estructura de la base de datos
"""

import sqlite3
import os

def check_database_schema():
    db_path = "data.db"
    
    if not os.path.exists(db_path):
        print("❌ Base de datos no encontrada")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar estructura de la tabla items
        print("📋 Estructura de la tabla 'items':")
        cursor.execute("PRAGMA table_info(items)")
        columns = cursor.fetchall()
        
        for column in columns:
            print(f"  - {column[1]} ({column[2]}) - nullable: {not column[3]}")
        
        # Verificar si la columna detalles existe
        column_names = [column[1] for column in columns]
        
        if 'detalles' in column_names:
            print("✅ La columna 'detalles' existe")
            
            # Verificar algunos datos de ejemplo
            cursor.execute("SELECT id, name, detalles FROM items LIMIT 3")
            sample_data = cursor.fetchall()
            
            print("\n📋 Datos de ejemplo:")
            for row in sample_data:
                print(f"  - ID: {row[0][:8]}... | Name: {row[1]} | Detalles: {row[2] or 'NULL'}")
                
        else:
            print("❌ La columna 'detalles' NO existe")
            print("🔧 Necesitas ejecutar la migración")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    check_database_schema()