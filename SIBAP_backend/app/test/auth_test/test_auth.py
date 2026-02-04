"""
Script para probar los endpoints de autenticación
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_register():
    """Prueba el endpoint de registro"""
    print("\n" + "="*50)
    print("🔹 PROBANDO REGISTRO DE USUARIO")
    print("="*50)
    
    url = f"{BASE_URL}/auth/register"
    data = {
        "name" : "test",
        "last_name" : "test_name",       "email": "test@example.com",
        "password": "password123"
    }
    
    print(f"POST {url}")
    print(f"Datos: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data)
    
    print(f"\nRespuesta: {response.status_code}")
    print(f"Body: {json.dumps(response.json(), indent=2)}")
    
    return response

def test_login():
    """Prueba el endpoint de login"""
    print("\n" + "="*50)
    print("🔹 PROBANDO LOGIN")
    print("="*50)
    
    url = f"{BASE_URL}/auth/login"
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    print(f"POST {url}")
    print(f"Datos: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data)
    
    print(f"\nRespuesta: {response.status_code}")
    print(f"Body: {json.dumps(response.json(), indent=2)}")
    
    # Mostrar cookies
    if response.cookies:
        print(f"\nCookies recibidas:")
        for cookie_name, cookie_value in response.cookies.items():
            print(f"   {cookie_name}: {cookie_value[:50]}..." if len(cookie_value) > 50 else f"   {cookie_name}: {cookie_value}")
    
    return response

def test_login_wrong_password():
    """Prueba el login con contraseña incorrecta"""
    print("\n" + "="*50)
    print("🔹 PROBANDO LOGIN CON CONTRASEÑA INCORRECTA")
    print("="*50)
    
    url = f"{BASE_URL}/auth/login"
    data = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    
    print(f"POST {url}")
    print(f"Datos: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data)
    
    print(f"\nRespuesta: {response.status_code}")
    print(f"Body: {json.dumps(response.json(), indent=2)}")
    
    return response

def test_root():
    """Prueba el endpoint raíz"""
    print("\n" + "="*50)
    print("🔹 PROBANDO ENDPOINT RAÍZ")
    print("="*50)
    
    url = f"{BASE_URL}/"
    
    print(f"GET {url}")
    
    response = requests.get(url)
    
    print(f"\nRespuesta: {response.status_code}")
    print(f"Body: {json.dumps(response.json(), indent=2)}")
    
    return response

if __name__ == "__main__":
    print("\n" + " INICIANDO PRUEBAS DE AUTENTICACIÓN" + "\n")
    
    try:
        # Probar endpoint raíz
        test_root()
        
        # Probar registro
        test_register()
        
        # Probar login exitoso
        test_login()
        
        # Probar login fallido
        test_login_wrong_password()
        
        print("\n" + "="*50)
        print("PRUEBAS COMPLETADAS")
        print("="*50 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\nERROR: No se pudo conectar al servidor.")
        print("Asegúrate de que el servidor esté corriendo en http://127.0.0.1:8000")
    except Exception as e:
        print(f"\nERROR: {e}")