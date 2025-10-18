# 🏆 BDM Backend - Sistema de Base de Datos Mundial

Backend desarrollado en PHP con MySQL para gestionar información de mundiales de fútbol, usuarios, publicaciones y comentarios.

## 📁 Estructura del Proyecto

```
PWCI-Backend/
├── 📁 config/              # Configuración de la aplicación
│   └── database.php        # Configuración de base de datos
├── 📁 docs/               # Documentación
│   └── SETUP_RAPIDO.md    # Guía de instalación rápida
├── 📁 sql/                # Scripts de base de datos
│   └── database.sql       # Script de creación de BD
├── 📁 assets/             # Recursos estáticos
│   └── MODELO E-R.jpg     # Diagrama de base de datos
├── 📁 utils/              # Herramientas de utilidad
│   └── test_connection.php # Prueba de conexión
├── 📄 index.php           # Página principal de la API
├── 📄 api.php             # API REST principal
├── 📄 .htaccess           # Configuración Apache
├── 📄 .gitignore          # Archivos a ignorar en Git
└── 📄 README.md           # Esta documentación
```

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **XAMPP** (incluye Apache, MySQL y PHP)
- **Git** (para clonar el repositorio)
- **Navegador web** (Chrome, Firefox, Edge, etc.)

## 🚀 Instalación Paso a Paso

### 1. Descargar e Instalar XAMPP

1. Ve a [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Descarga XAMPP para tu sistema operativo
3. Instala XAMPP (recomendado en `C:\xampp` en Windows o `/Applications/XAMPP` en Mac)
4. Abre el **Panel de Control de XAMPP**
5. **Inicia los servicios:**
   - ✅ **Apache** (botón Start)
   - ✅ **MySQL** (botón Start)

> ⚠️ **Importante:** Asegúrate de que ambos servicios muestren "Running" en verde.

### 2. Clonar el Repositorio

```bash
# Clonar en la carpeta htdocs de XAMPP
cd C:\xampp\htdocs          # Windows
cd /Applications/XAMPP/htdocs   # Mac
cd /opt/lampp/htdocs        # Linux

# Clonar el proyecto
git clone [URL_DE_TU_REPOSITORIO] PWCI-Backend
cd PWCI-Backend
```

### 3. Configurar la Base de Datos

#### Opción A: Usando phpMyAdmin (Recomendado)
1. Abre tu navegador y ve a: `http://localhost/phpmyadmin`
2. Haz clic en **"Nueva"** en el panel izquierdo
3. Crea una base de datos llamada: `BDM`
4. Selecciona la base de datos `BDM`
5. Ve a la pestaña **"Importar"**
6. Haz clic en **"Seleccionar archivo"** y escoge el archivo `sql/database.sql`
7. Haz clic en **"Continuar"**

#### Opción B: Línea de Comandos
```bash
# Windows (desde el directorio del proyecto)
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE BDM;"
C:\xampp\mysql\bin\mysql.exe -u root BDM < sql/database.sql

### 4. Verificar la Instalación

1. **Probar la conexión:**
   - Ve a: `http://localhost/PWCI-Backend/` (página principal)
   - O directamente: `http://localhost/PWCI-Backend/utils/test_connection.php`
   - Deberías ver una página verde confirmando la conexión exitosa

2. **Probar la API:**
   - Ve a: `http://localhost/PWCI-Backend/api.php/status`
   - Deberías recibir una respuesta JSON como:
   ```json
   {
     "status": 200,
     "message": "API funcionando correctamente",
     "data": {
       "api": "BDM API",
       "version": "1.0",
       "database": "connected"
     }
   }
   ```

### 5. Datos de Prueba (Opcional)

Para insertar un usuario de prueba, tienes varias opciones:

#### Opción A: Usando phpMyAdmin
1. Ve a: `http://localhost/phpmyadmin`
2. Selecciona la base de datos `BDM`
3. Haz clic en la tabla `Usuario`
4. Clic en "Insertar" y llena los campos requeridos

#### Opción B: Usando la API (recomendado)
Haz una petición POST a `http://localhost/PWCI-Backend/api.php/usuarios` con datos JSON:

```javascript
fetch('http://localhost/PWCI-Backend/api.php/usuarios', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nombreCompleto: 'Juan Pérez',
    correoElectronico: 'juan@ejemplo.com',
    contrasena: 'password123',
    fechaNacimiento: '1990-05-15',
    genero: 'Masculino',
    paisNacimiento: 'México',
    nacionalidad: 'Mexicana'
  })
});
```

#### Opción C: SQL Directo
```sql
INSERT INTO Usuario (nombreCompleto, correoElectronico, contrasena, fechaNacimiento, genero, paisNacimiento, nacionalidad) 
VALUES ('María García', 'maria@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1988-08-22', 'Femenino', 'España', 'Española');
```

**Verificar:** Ve a `http://localhost/PWCI-Backend/api.php/usuarios` para ver los usuarios creados.

## 🌐 URLs Importantes

Una vez configurado, estas URLs deberían funcionar:

| Función | URL | Descripción |
|---------|-----|-------------|
| **Página Principal** | `http://localhost/PWCI-Backend/` | Dashboard de la API |
| **Prueba de Conexión** | `http://localhost/PWCI-Backend/utils/test_connection.php` | Verifica que todo funcione |
| **Estado de API** | `http://localhost/PWCI-Backend/api.php/status` | Estado de la API |
| **Usuarios** | `http://localhost/PWCI-Backend/api.php/usuarios` | Lista de usuarios |
| **Publicaciones** | `http://localhost/PWCI-Backend/api.php/publicaciones` | Lista de publicaciones |
| **Categorías** | `http://localhost/PWCI-Backend/api.php/categorias` | Lista de categorías |
| **Mundiales** | `http://localhost/PWCI-Backend/api.php/mundiales` | Lista de mundiales |

## 🔧 Configuración Avanzada

### Cambiar Credenciales de Base de Datos

Si tu XAMPP tiene contraseña para MySQL o usas configuración diferente:

1. Edita el archivo `config/database.php`
2. Modifica estas líneas:
```php
define('DB_HOST', 'localhost');      // Servidor MySQL
define('DB_NAME', 'BDM');           // Nombre de la base de datos
define('DB_USER', 'root');          // Usuario MySQL
define('DB_PASS', '');              // Contraseña MySQL (vacía por defecto)
```

### Cambiar Puerto de MySQL

Si MySQL corre en un puerto diferente al 3306:
```php
define('DB_HOST', 'localhost:3307'); // Ejemplo para puerto 3307
```

## 🐛 Solución de Problemas Comunes

### Error: "Conexión rechazada"
- ✅ Verifica que XAMPP esté ejecutándose
- ✅ Asegúrate de que MySQL esté iniciado (verde en el panel)
- ✅ Verifica que no haya otro programa usando el puerto 3306

### Error: "Base de datos no encontrada"
- ✅ Confirma que creaste la base de datos `BDM`
- ✅ Verifica que ejecutaste el archivo `database.sql`
- ✅ Revisa las credenciales en `config/database.php`

### Error 404: "Página no encontrada"
- ✅ Verifica que clonaste en la carpeta `htdocs`
- ✅ Confirma que Apache esté ejecutándose
- ✅ Revisa que la URL sea correcta: `http://localhost/PWCI-Backend/`

### Error 500: "Internal Server Error"
- ✅ Revisa los logs de Apache: `xampp/apache/logs/error.log`
- ✅ Verifica que PHP esté funcionando
- ✅ Confirma que no hay errores de sintaxis en los archivos PHP

## 📱 Uso desde Frontend

Para conectar tu aplicación frontend con esta API:

```javascript
// Obtener usuarios
fetch('http://localhost/PWCI-Backend/api.php/usuarios')
  .then(response => response.json())
  .then(data => console.log(data));

// Crear usuario
fetch('http://localhost/PWCI-Backend/api.php/usuarios', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nombreCompleto: 'Nuevo Usuario',
    correoElectronico: 'usuario@ejemplo.com',
    contrasena: 'password123'
  })
});
```

## 📊 Estructura de la Base de Datos

El sistema incluye las siguientes tablas:

- **Usuario** - Gestión de usuarios
- **Mundial** - Información de mundiales
- **Categoria** - Categorías de publicaciones
- **Publicacion** - Publicaciones de usuarios
- **Comentario** - Comentarios en publicaciones
- **Interaccion** - Likes/Dislikes
- **EstadisticaUsuario** - Estadísticas de actividad
- **ReporteComentario** - Sistema de reportes

---
