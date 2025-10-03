0#!/usr/bin/env python3
"""
Script de prueba directo para verificar la base de datos
"""

import sqlite3
import json

def test_items_direct():
    # Conectar directamente a la base de datos
    conn = sqlite3.connect('data.db')
    conn.row_factory = sqlite3.Row  # Para acceder por nombre de columna
    cursor = conn.cursor()
    
    # Buscar items de yuneisy
    print("🔍 Consultando items de yuneisy directamente en la BD...")
    cursor.execute("""
        SELECT id, name, cost, price, tax, price_USD, cant, category, seller, image, detalles 
        FROM items 
        WHERE seller = ? 
        ORDER BY category 
        LIMIT 3
    """, ('yuneisy',))
    
    items = cursor.fetchall()
    
    if items:
        print(f"📦 Encontrados {len(items)} items")
        
        for i, item in enumerate(items):
            print(f"\n📋 Item {i+1}:")
            # Convertir Row a dict
            item_dict = dict(item)
            print(json.dumps(item_dict, indent=2, ensure_ascii=False))
    else:
        print("❌ No se encontraron items para yuneisy")
    
    # Verificar si hay detalles no nulos
    cursor.execute("""
        SELECT COUNT(*) as total,
               COUNT(detalles) as with_detalles,
               COUNT(CASE WHEN detalles IS NOT NULL AND detalles != '' THEN 1 END) as non_empty_detalles
        FROM items 
        WHERE seller = ?
    """, ('yuneisy',))
    
    stats = cursor.fetchone()
    print(f"\n📊 Estadísticas:")
    print(f"  - Total items: {stats['total']}")
    print(f"  - Con campo detalles: {stats['with_detalles']}")
    print(f"  - Con detalles no vacíos: {stats['non_empty_detalles']}")
    
    conn.close()

if __name__ == "__main__":
    test_items_direct()