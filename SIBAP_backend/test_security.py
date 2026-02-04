import requests

print("=== Test 1: Rate Limiting ===")
for i in range(6):
    r = requests.post('http://127.0.0.1:8000/auth/login', json={'email':'fake@example.com','password':'wrong'})
    print(f'Intento {i+1}: {r.status_code} - {r.json()}')

print("\n=== Test 2: Logout ===")
session = requests.Session()
r = session.post('http://127.0.0.1:8000/auth/login', json={'email':'newuser@example.com','password':'SecurePass123!'})
print(f'Login: {r.status_code}')
print(f'Cookie antes: {session.cookies.get_dict()}')

r = session.post('http://127.0.0.1:8000/auth/logout')
print(f'Logout: {r.status_code} - {r.json()}')
print(f'Cookie después: {session.cookies.get_dict()}')
