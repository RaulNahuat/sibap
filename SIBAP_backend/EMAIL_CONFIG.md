# Configuración de Email - Instrucciones

## Para usar Gmail (recomendado para desarrollo y producción)

### 1. Crear una Contraseña de Aplicación de Google

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú izquierdo, selecciona "Seguridad"
3. En "Cómo inicias sesión en Google", activa la "Verificación en dos pasos" (si no la tienes)
4. Después de activar la verificación en dos pasos, busca "Contraseñas de aplicaciones"
5. Selecciona "Correo" y "Windows Computer" (o el dispositivo que uses)
6. Google generará una contraseña de 16 caracteres (ej: `abcd efgh ijkl mnop`)
7. Copia esta contraseña (sin espacios: `abcdefghijklmnop`)

### 2. Configurar el .env

Edita el archivo `.env` y reemplaza:

```env
EMAIL_USERNAME=tu-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=SIBAP
```

### 3. Cambiar a modo producción

Cuando quieras enviar emails reales (no solo imprimirlos en consola):

```env
EMAIL_CONSOLE_MODE=False
```

### 4. Para producción

Cuando despliegues a producción, actualiza:

```env
FRONTEND_URL=https://tu-dominio.com
EMAIL_CONSOLE_MODE=False
```

## Otros proveedores de email

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USERNAME=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USERNAME=tu-email@yahoo.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

### Servidor SMTP personalizado
```env
EMAIL_HOST=smtp.tu-servidor.com
EMAIL_PORT=587
EMAIL_USERNAME=tu-usuario
EMAIL_PASSWORD=tu-contraseña
```

## Verificar que funciona

1. Configura las variables en `.env`
2. Cambia `EMAIL_CONSOLE_MODE=False`
3. Reinicia uvicorn
4. Solicita un reset de contraseña con tu email real
5. Revisa tu bandeja de entrada

## Solución de problemas

**Error: "Authentication failed"**
- Verifica que usas una contraseña de aplicación, no tu contraseña normal
- Asegúrate de que la verificación en dos pasos está activada

**No recibo el email**
- Revisa la carpeta de spam
- Verifica que `EMAIL_FROM` sea el mismo que `EMAIL_USERNAME`
- Verifica que el puerto y host sean correctos

**Error de conexión**
- Verifica tu conexión a internet
- Algunos firewalls bloquean el puerto 587, intenta con el puerto 465 (SSL)
