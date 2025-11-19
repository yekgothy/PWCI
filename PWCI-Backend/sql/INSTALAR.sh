#!/bin/bash
# =====================================================
# Script de Instalación Automática - World Cup Hub
# Ejecuta todos los archivos SQL en orden correcto
# =====================================================

echo "🚀 Instalación de World Cup Hub - Base de Datos"
echo "=============================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración de MySQL
DB_USER="root"
DB_PASS=""
DB_NAME="BDM"
SQL_DIR="C:/xampp/htdocs/PWCI/PWCI-Backend/sql"

echo -e "${BLUE}📌 Configuración:${NC}"
echo "   Usuario MySQL: $DB_USER"
echo "   Base de Datos: $DB_NAME"
echo "   Directorio SQL: $SQL_DIR"
echo ""

# Función para ejecutar archivo SQL
execute_sql() {
    local file=$1
    local desc=$2
    echo -e "${BLUE}▶ Ejecutando: ${file}${NC}"
    echo "   $desc"
    
    mysql -u $DB_USER -p$DB_PASS < "$SQL_DIR/$file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $file ejecutado correctamente${NC}"
    else
        echo -e "${RED}❌ Error ejecutando $file${NC}"
        exit 1
    fi
    echo ""
}

# Inicio de instalación
echo -e "${GREEN}Iniciando instalación...${NC}"
echo ""

# Paso 1: Crear base de datos
execute_sql "00_DATABASE.sql" "Creando estructura de base de datos y tablas"

# Paso 2: Crear usuario admin
execute_sql "01_CREAR_USUARIO_ADMIN.sql" "Creando usuario administrador"

# Paso 3: Datos de prueba (opcional)
read -p "¿Deseas insertar datos de prueba? (s/n): " insert_data
if [ "$insert_data" = "s" ] || [ "$insert_data" = "S" ]; then
    execute_sql "02_DATOS_PRUEBA.sql" "Insertando datos de prueba"
fi

# Paso 4: Stored Procedures
execute_sql "03_STORED_PROCEDURES.sql" "Creando 40 stored procedures"

# Paso 5: Triggers, Views y Functions
execute_sql "04_TRIGGERS_VIEWS_FUNCTIONS.sql" "Creando triggers, vistas y funciones"

# Resumen final
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Instalación completada exitosamente${NC}"
echo "=============================================="
echo ""
echo "📊 Resumen:"
echo "   • Base de datos: BDM"
echo "   • Tablas: 8"
echo "   • Stored Procedures: 40"
echo "   • Triggers: 4"
echo "   • Views: 8"
echo "   • Functions: 2"
echo ""
echo "🔐 Credenciales de Admin:"
echo "   Email: admin@worldcuphub.com"
echo "   Password: admin123"
echo ""
echo "💡 Siguiente paso:"
echo "   Inicia XAMPP y abre http://localhost/PWCI/PWCI-Front/pages/login.html"
echo ""
