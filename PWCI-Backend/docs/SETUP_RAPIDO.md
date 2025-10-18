# 🚀 Configuración Rápida - 5 Minutos

## ⚡ Pasos Rápidos para tu Compañero

### 1. Instalar XAMPP (2 minutos)
- Descargar de: https://www.apachefriends.org/
- Instalar y abrir el Panel de Control
- **Iniciar Apache y MySQL** (botones Start)

### 2. Clonar Proyecto (1 minuto)
```bash
# Ir a la carpeta htdocs de XAMPP
cd C:\xampp\htdocs

# Clonar el proyecto
git clone [TU_REPOSITORIO_URL] PWCI-Backend
```

### 3. Crear Base de Datos (1 minuto)
- Ir a: http://localhost/phpmyadmin
- Crear base de datos: `BDM`
- Importar el archivo `database.sql`

### 4. Probar (1 minuto)
- Ir a: http://localhost/PWCI-Backend/test_connection.php
- Debe mostrar ✅ "Conexión exitosa"

## 🆘 Si Algo Falla

**MySQL no inicia:**
- Cambiar puerto a 3307 en XAMPP
- Reiniciar XAMPP como administrador

**Error 404:**
- Verificar que el proyecto esté en `C:\xampp\htdocs\PWCI-Backend`

**Error de conexión:**
- Verificar que MySQL esté en verde en XAMPP
- Revisar archivo `config/database.php`

## 📱 Contacto Rápido
- WhatsApp: [TU_NUMERO]
- Email: [TU_EMAIL]
- Discord: [TU_DISCORD]

**¡En 5 minutos debería estar funcionando!** ⏱️