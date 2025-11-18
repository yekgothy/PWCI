# ============================================
# SCRIPT DE REPARACIÓN MYSQL - XAMPP
# ============================================
# Este script repara MySQL corrompido reiniciando
# la carpeta data y restaurando base de datos

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  REPARACIÓN MYSQL - XAMPP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Debes ejecutar este script como Administrador" -ForegroundColor Red
    Write-Host "Clic derecho en PowerShell -> Ejecutar como administrador" -ForegroundColor Yellow
    pause
    exit
}

# Timestamp para backup
$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')

Write-Host "[1/6] Verificando rutas..." -ForegroundColor Yellow

# Verificar rutas
$mysqlData = "C:\xampp\mysql\data"
$mysqlBackup = "C:\xampp\mysql\backup"
$projectPath = "C:\xampp\htdocs\PWCI\PWCI-Backend\sql"

if (-not (Test-Path $mysqlData)) {
    Write-Host "ERROR: No se encuentra la carpeta $mysqlData" -ForegroundColor Red
    pause
    exit
}

if (-not (Test-Path $mysqlBackup)) {
    Write-Host "ERROR: No se encuentra la carpeta $mysqlBackup" -ForegroundColor Red
    pause
    exit
}

Write-Host "  ✓ Rutas verificadas" -ForegroundColor Green
Write-Host ""

Write-Host "[2/6] Creando backup de la carpeta data corrupta..." -ForegroundColor Yellow

# Crear backup de la carpeta corrupta
$backupPath = "C:\xampp\mysql\data_corrupted_$timestamp"
try {
    Rename-Item -Path $mysqlData -NewName "data_corrupted_$timestamp" -ErrorAction Stop
    Write-Host "  ✓ Backup creado en: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo renombrar la carpeta data" -ForegroundColor Red
    Write-Host "Asegúrate de que MySQL esté DETENIDO en XAMPP" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""

Write-Host "[3/6] Restaurando carpeta data limpia desde backup..." -ForegroundColor Yellow

# Copiar carpeta backup limpia
try {
    Copy-Item -Path $mysqlBackup -Destination $mysqlData -Recurse -Force -ErrorAction Stop
    Write-Host "  ✓ Carpeta data restaurada" -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo copiar la carpeta backup" -ForegroundColor Red
    Write-Host $_.Exception.Message
    pause
    exit
}

Write-Host ""
Write-Host "[4/6] Esperando a que inicies MySQL en XAMPP..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  >> Abre XAMPP Control Panel" -ForegroundColor Cyan
Write-Host "  >> Haz clic en START en MySQL" -ForegroundColor Cyan
Write-Host "  >> Espera a que diga 'Running'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona ENTER cuando MySQL esté corriendo..." -ForegroundColor Yellow
pause

Write-Host ""
Write-Host "[5/6] Importando base de datos..." -ForegroundColor Yellow

$mysqlBin = "C:\xampp\mysql\bin\mysql.exe"

# Verificar que mysql.exe existe
if (-not (Test-Path $mysqlBin)) {
    Write-Host "ERROR: No se encuentra mysql.exe en $mysqlBin" -ForegroundColor Red
    pause
    exit
}

# Importar database.sql
Write-Host "  → Creando estructura de base de datos..." -ForegroundColor Cyan
try {
    & $mysqlBin -u root -e "SOURCE $projectPath/database.sql;" 2>&1 | Out-Null
    Write-Host "  ✓ Estructura creada (database.sql)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Error al importar database.sql" -ForegroundColor Red
}

# Importar datos de prueba
Write-Host "  → Insertando datos de prueba..." -ForegroundColor Cyan
try {
    & $mysqlBin -u root BDM -e "SOURCE $projectPath/insertar_datos_prueba.sql;" 2>&1 | Out-Null
    Write-Host "  ✓ Datos insertados (insertar_datos_prueba.sql)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Error al insertar datos de prueba" -ForegroundColor Red
}

Write-Host ""
Write-Host "[6/6] Verificando datos..." -ForegroundColor Yellow

# Verificar que hay datos
$result = & $mysqlBin -u root -e "SELECT COUNT(*) as total FROM BDM.Publicacion;" --batch --skip-column-names 2>$null

if ($result -match '\d+') {
    Write-Host "  ✓ Base de datos funcionando correctamente" -ForegroundColor Green
    Write-Host "  ✓ Total de publicaciones: $result" -ForegroundColor Green
} else {
    Write-Host "  ⚠ No se pudieron verificar los datos" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✓ REPARACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes:" -ForegroundColor Cyan
Write-Host "  1. Abrir phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor White
Write-Host "  2. Iniciar sesión en: http://localhost/PWCI/PWCI-Front/pages/login.html" -ForegroundColor White
Write-Host "     Usuario: carlos@test.com" -ForegroundColor White
Write-Host "     Password: password" -ForegroundColor White
Write-Host ""
Write-Host "La carpeta corrupta está en:" -ForegroundColor Yellow
Write-Host "  $backupPath" -ForegroundColor White
Write-Host ""

pause
