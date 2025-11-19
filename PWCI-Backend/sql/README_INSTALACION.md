# 📁 Archivos SQL - World Cup Hub

## 🚀 Orden de Ejecución

Para configurar completamente la base de datos del proyecto, ejecuta los archivos en este orden:

### 1️⃣ `00_DATABASE.sql`
**Crear estructura de base de datos**
- Crea la base de datos `BDM`
- Crea todas las tablas (8 tablas principales)
- Define claves primarias, foráneas y constraints
- Incluye columnas BLOB para imágenes
- Incluye columna `vistas` para contador de visualizaciones

**Tablas creadas:**
- Usuario
- Mundial
- Categoria
- Publicacion (con BLOB)
- Comentario
- Interaccion

---

### 2️⃣ `01_CREAR_USUARIO_ADMIN.sql`
**Crear usuario administrador**
- Email: `admin@worldcuphub.com`
- Contraseña: `admin123` (debes cambiarla después del primer login)
- Rol: `admin`

⚠️ **IMPORTANTE**: Después de ejecutar, debes hashear la contraseña correctamente con PHP:
```php
$password = password_hash('admin123', PASSWORD_DEFAULT);
```

---

### 3️⃣ `02_DATOS_PRUEBA.sql` *(OPCIONAL)*
**Insertar datos de ejemplo**
- 6 categorías (Noticias, Análisis, Jugadas, etc.)
- 5 mundiales (2026, 2022, 2018, 2014, 2010)
- 5 usuarios de prueba (contraseña: `password123`)
- 12 publicaciones (10 aprobadas, 2 pendientes)
- 6 comentarios de ejemplo
- 12 interacciones (likes/dislikes)

**Usuarios de prueba:**
- carlos@test.com
- maria@test.com
- john@test.com
- ana@test.com
- luis@test.com

---

### 4️⃣ `03_STORED_PROCEDURES.sql`
**Crear 40 stored procedures**

**Categorías de SPs:**
- 🔐 **Autenticación**: login, registro, actualización de perfil (8 SPs)
- 📝 **Publicaciones**: crear, obtener, aprobar, rechazar (12 SPs)
- 💬 **Comentarios**: crear, editar, eliminar, obtener (5 SPs)
- ❤️ **Interacciones**: likes, dislikes, eliminar (3 SPs)
- 📂 **Categorías**: CRUD completo (5 SPs)
- 🏆 **Mundiales**: CRUD completo (5 SPs)
- 👁️ **Visualizaciones**: incrementar contador (1 SP)
- 📊 **Auxiliares**: contar usuarios (1 SP)

⚠️ **REQUISITO CRÍTICO**: Ningún SP usa `SELECT *`, todos listan columnas explícitamente.

---

### 5️⃣ `04_TRIGGERS_VIEWS_FUNCTIONS.sql`
**Crear triggers, vistas y funciones**

**4 Triggers:**
1. `trg_actualizar_likes_dislikes_insert` - Actualiza contadores al insertar interacción
2. `trg_actualizar_likes_dislikes_delete` - Actualiza contadores al eliminar interacción
3. `trg_actualizar_likes_dislikes_update` - Actualiza contadores al cambiar interacción
4. `trg_log_cambio_estado_publicacion` - Registra cambios de estado

**8 Views:**
1. `vw_publicaciones_aprobadas` - Publicaciones visibles para feed
2. `vw_publicaciones_populares` - Top publicaciones por likes
3. `vw_estadisticas_usuario` - Contadores por usuario
4. `vw_comentarios_por_publicacion` - Comentarios con info de usuario
5. `vw_mundiales_activos` - Mundiales en curso o próximos
6. `vw_categorias_populares` - Categorías más usadas
7. `vw_interacciones_detalle` - Likes/dislikes con detalles
8. `vw_feed_completo` - Vista consolidada para feed

**2 Functions:**
1. `fn_calcular_edad()` - Calcula edad exacta desde fecha nacimiento
2. `fn_contar_comentarios_publicacion()` - Cuenta comentarios de una publicación

---

## 📋 Checklist de Instalación

```bash
# 1. Abrir MySQL desde terminal
mysql -u root -p

# 2. Ejecutar en orden:
source C:/xampp/htdocs/PWCI/PWCI-Backend/sql/00_DATABASE.sql
source C:/xampp/htdocs/PWCI/PWCI-Backend/sql/01_CREAR_USUARIO_ADMIN.sql
source C:/xampp/htdocs/PWCI/PWCI-Backend/sql/02_DATOS_PRUEBA.sql
source C:/xampp/htdocs/PWCI/PWCI-Backend/sql/03_STORED_PROCEDURES.sql
source C:/xampp/htdocs/PWCI/PWCI-Backend/sql/04_TRIGGERS_VIEWS_FUNCTIONS.sql

# 3. Verificar instalación
USE BDM;
SHOW TABLES;
SHOW PROCEDURE STATUS WHERE Db = 'BDM';
```

---

## ✅ Verificación de Requisitos Académicos

### Base de Datos:
- ✅ **Cero consultas SQL directas**: Solo stored procedures en código PHP
- ✅ **Prohibido SELECT ***: Todos los SPs listan columnas explícitamente
- ✅ **BLOB obligatorio**: Imágenes en `multimediaBlob LONGBLOB`
- ✅ **Normalización 3FN**: Todas las tablas normalizadas

### Objetos SQL:
| Objeto | Requerido | Implementado | Estado |
|--------|-----------|--------------|--------|
| Triggers | 2 | 4 | ✅ 200% |
| Views | 8 | 8 | ✅ 100% |
| Functions | 2 | 2 | ✅ 100% |
| Stored Procedures | - | 40 | ✅ Robusto |

### Arquitectura:
- ✅ **MVC**: Separación clara Modelo-Vista-Controlador
- ✅ **POO**: Todas las clases PHP con OOP
- ✅ **Clase DB dedicada**: `Database.php` exclusiva para conexión
- ✅ **Sin plantillas**: Diseño propio con Tailwind CSS

---

## 🔄 Reinstalación Rápida

Si necesitas limpiar y reinstalar:

```sql
DROP DATABASE IF EXISTS BDM;
```

Luego ejecuta los 5 archivos en orden nuevamente.

---

## 📱 Contacto y Soporte

- **Proyecto**: World Cup Hub
- **Versión**: 1.0.0
- **Fecha**: Noviembre 2025

---

## 📝 Notas Importantes

1. **Contraseñas hasheadas**: Todos los usuarios usan `password_hash()` de PHP
2. **BLOB implementado**: Sistema dual URL + BLOB para imágenes
3. **Validación de edad**: Mínimo 12 años (frontend, backend y trigger)
4. **Sistema de aprobación**: Publicaciones pendientes requieren aprobación del admin
5. **Contador de vistas**: Auto-incrementa al ver detalle de publicación

---

**✨ ¡Listo para producción!** ✨
