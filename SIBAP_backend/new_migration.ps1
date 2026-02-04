# Uso: .\new_migration.ps1 -Message "descripción del cambio"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "`nCreando migración: $Message" -ForegroundColor Cyan
alembic revision --autogenerate -m "$Message"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError al crear la migración" -ForegroundColor Red
    exit 1
}

Write-Host "`nAplicando migración..." -ForegroundColor Cyan
alembic upgrade head

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError al aplicar la migración" -ForegroundColor Red
    exit 1
}

Write-Host "`nMigración completada exitosamente!" -ForegroundColor Green
Write-Host "`nEstado actual:" -ForegroundColor Yellow
alembic current
