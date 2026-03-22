import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import (
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USERNAME,
    EMAIL_PASSWORD,
    EMAIL_FROM,
    EMAIL_FROM_NAME,
    EMAIL_USE_TLS,
    EMAIL_CONSOLE_MODE,
    FRONTEND_URL,
    RESET_TOKEN_EXPIRE_MINUTES
)

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    try:
        if EMAIL_CONSOLE_MODE:
            # Modo desarrollo: imprimir en consola
            print("\n" + "=" * 80)
            print("EMAIL (MODO DESARROLLO - NO SE ENVÍA REALMENTE)")
            print("=" * 80)
            print(f"Para: {to_email}")
            print(f"De: {EMAIL_FROM_NAME} <{EMAIL_FROM}>")
            print(f"Asunto: {subject}")
            print("-" * 80)
            print("Contenido HTML:")
            print(html_content)
            print("=" * 80 + "\n")
            return True
        else:
            # Modo producción: enviar vía SMTP
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
            msg['To'] = to_email
            
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                if EMAIL_USE_TLS:
                    server.starttls()
                server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email enviado exitosamente a {to_email}")
            return True
            
    except Exception as e:
        logger.error(f"Error al enviar email a {to_email}: {str(e)}")
        return False


def send_password_reset_email(email: str, reset_token: str) -> bool:
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    subject = "Recuperación de Contraseña - SIBAP"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .container {{
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .header h1 {{
                color: #2563eb;
                margin: 0;
                font-size: 24px;
            }}
            .content {{
                margin-bottom: 30px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background-color: #2563eb;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
            }}
            .button:hover {{
                background-color: #1d4ed8;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }}
            .warning {{
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .warning p {{
                margin: 0;
                color: #92400e;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            
            <div class="content">
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>SIBAP</strong>.</p>
                <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            </div>
            
            <div class="button-container">
                <a href="{reset_url}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Importante:</strong> Este enlace expirará en {RESET_TOKEN_EXPIRE_MINUTES} minutos por seguridad.</p>
            </div>
            
            <div class="content">
                <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #2563eb;">{reset_url}</p>
            </div>
            
            <div class="footer">
                <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
                <p style="margin-top: 10px;">© 2026 SIBAP - Sistema Inteligente de Banco de Preguntas</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Contenido de texto plano como alternativa
    text_content = f"""
    Recuperación de Contraseña - SIBAP
    
    Hola,
    
    Recibimos una solicitud para restablecer la contraseña de tu cuenta en SIBAP.
    
    Para crear una nueva contraseña, visita el siguiente enlace:
    {reset_url}
    
    ⚠️ Importante: Este enlace expirará en {RESET_TOKEN_EXPIRE_MINUTES} minutos por seguridad.
    
    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
    
    © 2026 SIBAP - Sistema Inteligente de Banco de Preguntas
    """
    
    return send_email(email, subject, html_content, text_content)