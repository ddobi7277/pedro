#!/usr/bin/env python3
"""
Script de prueba para verificar qué devuelve el endpoint get_seller_items
"""

import asyncio
import sys
import os

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import get_db, get_items_by_seller
from models import Item

async def test_get_items():
    # Obtener la sesión de base de datos
    db = next(get_db())
    
    # Probar obtener items del seller 'yuneisy'
    print("🔍 Probando get_items_by_seller para 'yuneisy'...")
    items = await get_items_by_seller('yuneisy', db)
    
    if items:
        print(f"📦 Encontrados {len(items)} items")
        
        # Mostrar el primer item en detalle
        first_item = items[0]
        print(f"\n📋 Primer item (tipo: {type(first_item)}):")
        print(f"  - ID: {first_item.id}")
        print(f"  - Name: {first_item.name}")
        print(f"  - Cost: {first_item.cost}")
        print(f"  - Price: {first_item.price}")
        print(f"  - Price_USD: {first_item.price_USD}")
        print(f"  - Cant: {first_item.cant}")
        print(f"  - Category: {first_item.category}")
        print(f"  - Seller: {first_item.seller}")
        
        # Lo más importante: verificar detalles
        try:
            detalles_value = first_item.detalles
            print(f"  - Detalles: {detalles_value}")
        except AttributeError as e:
            print(f"  - ❌ Error accediendo a detalles: {e}")
        
        # Verificar todos los atributos disponibles
        print(f"\n🔍 Todos los atributos del objeto:")
        for attr in dir(first_item):
            if not attr.startswith('_'):
                try:
                    value = getattr(first_item, attr)
                    if not callable(value):
                        print(f"    {attr}: {value}")
                except:
                    print(f"    {attr}: [error al acceder]")
                    
        # Convertir a dict como haría FastAPI
        print(f"\n🔄 Convertido a diccionario:")
        item_dict = {
            'id': first_item.id,
            'name': first_item.name,
            'cost': first_item.cost,
            'price': first_item.price,
            'tax': first_item.tax,
            'price_USD': first_item.price_USD,
            'cant': first_item.cant,
            'category': first_item.category,
            'seller': first_item.seller,
            'image': first_item.image,
            'detalles': getattr(first_item, 'detalles', 'ATTRIBUTE_NOT_FOUND')
        }
        print(item_dict)
        
    else:
        print("❌ No se encontraron items para 'yuneisy'")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_get_items())