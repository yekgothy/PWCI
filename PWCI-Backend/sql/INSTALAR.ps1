# =====================================================
# Script de Instalación Automática - World Cup Hub (Windows)
# Ejecuta todos los archivos SQL en orden correcto
# =====================================================

Write-Host "`n🚀 Instalación de World Cup Hub - Base de Datos" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Configuración
$DB_USER = "root"
$DB_NAME = "BDM"
$MYSQL_PATH = "C:\xampp\mysql\bin\mysql.exe"
$SQL_DIR = "C:\xampp\htdocs\PWCI\PWCI-Backend\sql"

Write-Host "📌 Configuración:" -ForegroundColor Blue
Write-Host "   Usuario MySQL: $DB_USER"
Write-Host "   Base de Datos: $DB_NAME"
Write-Host "   Directorio SQL: $SQL_DIR`n"

# Función para ejecutar archivo SQL
function Execute-SQL {
    param(
        [string]$File,
        [string]$Description
    )
    
    Write-Host "▶ Ejecutando: $File" -ForegroundColor Blue
    Write-Host "   $Description"
    
    $FilePath = Join-Path $SQL_DIR $File
    
    try {
        & $MYSQL_PATH -u $DB_USER $DB_NAME -e "source $FilePath" 2>&1 | Out-Null
        Write-Host "✅ $File ejecutado correctamente`n" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Error ejecutando $File" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Inicio de instalación
Write-Host "Iniciando instalación...`n" -ForegroundColor Green

# Paso 1: Crear base de datos
if (-not (Execute-SQL "00_DATABASE.sql" "Creando estructura de base de datos y tablas")) {
    exit 1
}

# Paso 2: Crear usuario admin
if (-not (Execute-SQL "01_CREAR_USUARIO_ADMIN.sql" "Creando usuario administrador")) {
    exit 1
}

# Paso 3: Datos de prueba (opcional)
$insertData = Read-Host "¿Deseas insertar datos de prueba? (s/n)"
if ($insertData -eq "s" -or $insertData -eq "S") {
    if (-not (Execute-SQL "02_DATOS_PRUEBA.sql" "Insertando datos de prueba")) {
        exit 1
    }
}

# Paso 4: Stored Procedures
if (-not (Execute-SQL "03_STORED_PROCEDURES.sql" "Creando 40 stored procedures")) {
    exit 1
}

# Paso 5: Triggers, Views y Functions
if (-not (Execute-SQL "04_TRIGGERS_VIEWS_FUNCTIONS.sql" "Creando triggers, vistas y funciones")) {
    exit 1
}

# Resumen final
Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "✅ Instalación completada exitosamente" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Cyan

Write-Host "📊 Resumen:"
Write-Host "   • Base de datos: BDM"
Write-Host "   • Tablas: 8"
Write-Host "   • Stored Procedures: 40"
Write-Host "   • Triggers: 4"
Write-Host "   • Views: 8"
Write-Host "   • Functions: 2`n"

Write-Host "🔐 Credenciales de Admin:" -ForegroundColor Yellow
Write-Host "   Email: admin@worldcuphub.com"
Write-Host "   Password: admin123`n"

Write-Host "💡 Siguiente paso:" -ForegroundColor Cyan
Write-Host "   Inicia XAMPP y abre http://localhost/PWCI/PWCI-Front/pages/login.html`n"

pause
