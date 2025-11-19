# 📁 Archivos SQL - World Cup Hub

## 🚀 Orden de Ejecución

Para configurar completamente la base de datos del proyecto, ejecuta los archivos en este orden:

### 1️⃣ `00_DATABASE.sql` (7.2 KB)
**Crear estructura de base de datos**
- Crea la base de datos `BDM`
- Crea todas las tablas (8 tablas)
- Define claves primarias, foráneas y constraints
- Incluye columnas BLOB para imágenes y multimedia
- Incluye columna `vistas` para contador de visualizaciones

**Tablas creadas:**
- **Usuario** (con fotoBlob, fotoMimeType, fotoNombre)
- **Mundial**
- **Categoria**
- **Publicacion** (con multimediaBlob, multimediaMimeType, multimediaNombre, vistas)
- **Comentario**
- **Interaccion**
- **EstadisticaUsuario** (para tracking de actividad del usuario)
- **ReporteComentario** (sistema de reportes de comentarios)

---

### 2️⃣ `01_CREAR_USUARIO_ADMIN.sql` (1.35 KB)
**Crear usuario administrador**
- Email: `admin@worldcuphub.com`
- Contraseña: `admin123` (debes cambiarla después del primer login)
- Rol: `admin`

⚠️ **IMPORTANTE**: Después de ejecutar, debes hashear la contraseña correctamente con PHP:
```php
$password = password_hash('admin123', PASSWORD_DEFAULT);
```

---

### 3️⃣ `02_DATOS_PRUEBA.sql` (10.36 KB) *(OPCIONAL)*
**Insertar datos de ejemplo**
- 6 categorías (Noticias, Análisis, Jugadas, Entrevistas, Historia, Memes)
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

### 4️⃣ `03_STORED_PROCEDURES.sql` (130.96 KB)
**Crear 45 stored procedures**

**Categorías de SPs:**
- 🔐 **Autenticación y Usuarios**: login, registro, actualización de perfil, fotos BLOB
- 📝 **Publicaciones**: crear (normal + BLOB), obtener, aprobar, rechazar, actualizar, eliminar
- 💬 **Comentarios**: crear, editar, eliminar, obtener por publicación
- ❤️ **Interacciones**: crear, eliminar, obtener por usuario, contar
- 📂 **Categorías**: CRUD completo
- 🏆 **Mundiales**: CRUD completo
- 👁️ **Visualizaciones**: incrementar contador de vistas
- 📊 **Estadísticas**: estadísticas de usuario, contar interacciones
- 🔍 **Consultas**: publicaciones aprobadas, pendientes, por estado, por usuario

⚠️ **REQUISITO CRÍTICO**: Ningún SP usa `SELECT *`, todos listan columnas explícitamente.

**Lista completa de los 45 SPs:**
1. sp_actualizar_categoria
2. sp_actualizar_comentario
3. sp_actualizar_estado_publicacion
4. sp_actualizar_foto_perfil
5. sp_actualizar_mundial
6. sp_actualizar_perfil_usuario
7. sp_actualizar_publicacion
8. sp_aprobar_publicacion
9. sp_contar_interacciones
10. sp_crear_categoria
11. sp_crear_comentario
12. sp_crear_interaccion
13. sp_crear_mundial
14. sp_crear_publicacion
15. sp_crear_publicacion_blob
16. sp_eliminar_categoria
17. sp_eliminar_comentario
18. sp_eliminar_interaccion
19. sp_eliminar_mundial
20. sp_eliminar_publicacion
21. sp_incrementar_vistas_publicacion
22. sp_login
23. sp_obtener_categorias
24. sp_obtener_categoria_por_id
25. sp_obtener_comentarios
26. sp_obtener_comentarios_por_publicacion
27. sp_obtener_estadisticas_usuario
28. sp_obtener_foto_blob
29. sp_obtener_interaccion_usuario
30. sp_obtener_multimedia_blob
31. sp_obtener_mundiales
32. sp_obtener_mundial_por_id
33. sp_obtener_publicaciones_aprobadas
34. sp_obtener_publicaciones_pendientes
35. sp_obtener_publicaciones_por_estado
36. sp_obtener_publicaciones_usuario
37. sp_obtener_publicacion_por_id
38. sp_obtener_todos_comentarios
39. sp_obtener_todos_usuarios
40. sp_obtener_usuario_por_email
41. sp_obtener_usuario_por_id
42. sp_registrar_usuario
43. sp_subir_foto_blob
44. sp_subir_multimedia_blob
45. sp_verificar_blob_publicacion

---

### 5️⃣ `04_TRIGGERS_VIEWS_FUNCTIONS.sql` (~25 KB)
**Crear triggers, vistas y funciones**

**6 Triggers:**
1. `trg_actualizar_likes_dislikes_insert` - Actualiza contadores al insertar interacción
2. `trg_actualizar_likes_dislikes_update` - Actualiza contadores al modificar interacción
3. `trg_actualizar_likes_dislikes_delete` - Actualiza contadores al eliminar interacción
4. `trg_validar_fechas_mundial` - Valida que fechaFin > fechaInicio
5. `trg_actualizar_estadisticas_usuario` - Actualiza EstadisticaUsuario al crear publicación
6. `trg_registrar_fecha_aprobacion` - Registra fechaAprobacion cuando se aprueba

**16 Views:**
1. `v_categorias_populares` - Categorías con más publicaciones
2. `v_comentarios_completos` - Comentarios con info de usuario y reportes
3. `v_estadisticas_usuario` - Estadísticas completas por usuario
4. `v_mundiales_con_publicaciones` - Mundiales con conteo de publicaciones
5. `v_publicaciones_completas` - Publicaciones con toda la información relacionada
6. `v_publicaciones_aprobadas` - Solo publicaciones aprobadas con score
7. `v_publicaciones_pendientes` - Publicaciones pendientes con días de espera
8. `v_usuarios_activos` - Usuarios con última actividad
9. `vw_comentarios_con_autores` - Comentarios con datos de autor
10. `vw_estadisticas_usuario` - Estadísticas simplificadas por usuario
11. `vw_interacciones_por_publicacion` - Conteo de likes/dislikes por publicación
12. `vw_publicaciones_completas` - Publicaciones con popularidad calculada
13. `vw_publicaciones_populares` - Top publicaciones ordenadas por popularidad
14. `vw_publicaciones_por_categoria` - Agrupación por categoría
15. `vw_publicaciones_por_mundial` - Agrupación por mundial
16. `vw_usuarios_activos` - Usuarios activos con conteos

**4 Functions:**
1. `fn_calcular_popularidad(idPublicacion)` - Retorna likes - dislikes
2. `fn_calcular_popularidad_post(idPublicacion)` - Score complejo con comentarios
3. `fn_validar_email(email)` - Valida formato de email con regex
4. `fn_verificar_interaccion_usuario(idUsuario, idPublicacion)` - Retorna 'like', 'dislike' o 'ninguna'

---

## 📋 Checklist de Instalación

```bash
# 1. Crear base de datos y tablas
mysql -u root < 00_DATABASE.sql

# 2. Crear usuario administrador
mysql -u root < 01_CREAR_USUARIO_ADMIN.sql

# 3. (OPCIONAL) Insertar datos de prueba
mysql -u root < 02_DATOS_PRUEBA.sql

# 4. Crear stored procedures
mysql -u root < 03_STORED_PROCEDURES.sql

# 5. Crear triggers, views y functions
mysql -u root < 04_TRIGGERS_VIEWS_FUNCTIONS.sql
```

---

## ✅ Verificación Post-Instalación

### Verificar Tablas (debe mostrar 8)
```sql
USE BDM;
SHOW TABLES;
```

### Verificar Stored Procedures (debe mostrar 45)
```sql
SELECT COUNT(*) as total FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'BDM' AND ROUTINE_TYPE = 'PROCEDURE';
```

### Verificar Functions (debe mostrar 4)
```sql
SELECT COUNT(*) as total FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'BDM' AND ROUTINE_TYPE = 'FUNCTION';
```

### Verificar Triggers (debe mostrar 6)
```sql
SELECT COUNT(*) as total FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'BDM';
```

### Verificar Views (debe mostrar 16)
```sql
SELECT COUNT(*) as total FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = 'BDM';
```

### Verificar Usuario Admin
```sql
SELECT idUsuario, nombreCompleto, correoElectronico, rol 
FROM Usuario WHERE rol = 'admin';
```

---

## 🎓 Cumplimiento de Requisitos Académicos

| Requisito | Mínimo | Implementado | Estado |
|-----------|---------|--------------|---------|
| **Stored Procedures** | 40 | 45 | ✅ 112% |
| **Triggers** | 2 | 6 | ✅ 300% |
| **Views** | 8 | 16 | ✅ 200% |
| **Functions** | 2 | 4 | ✅ 200% |
| **Tablas** | 6 | 8 | ✅ 133% |
| **SELECT sin *** | Ninguno | 0 | ✅ 100% |
| **BLOB Storage** | 1 | 2 | ✅ 200% |

---

## 🔧 Reinstalación Rápida

Si necesitas reinstalar completamente:

```bash
# Eliminar base de datos existente
mysql -u root -e "DROP DATABASE IF EXISTS BDM;"

# Ejecutar todos los archivos en orden
mysql -u root < 00_DATABASE.sql
mysql -u root < 01_CREAR_USUARIO_ADMIN.sql
mysql -u root < 02_DATOS_PRUEBA.sql
mysql -u root < 03_STORED_PROCEDURES.sql
mysql -u root < 04_TRIGGERS_VIEWS_FUNCTIONS.sql
```

---

## 📝 Notas Importantes

1. **Contraseñas**: Las contraseñas de prueba están en texto plano. En producción, usar `password_hash()` de PHP.

2. **BLOB Storage**: 
   - Usuario: fotoBlob (LONGBLOB)
   - Publicacion: multimediaBlob (LONGBLOB)

3. **Validaciones**: 
   - Los triggers validan automáticamente fechas y actualizan contadores
   - Las functions permiten validar emails y calcular popularidad

4. **Performance**: 
   - Todas las tablas usan InnoDB
   - Claves foráneas con ON DELETE CASCADE donde corresponde
   - Índices en todas las foreign keys

---

## 📚 Estructura de Tablas

### Usuario (8 columnas BLOB)
- Almacena foto de perfil como BLOB
- Tracking de actividad con rol admin/usuario

### Publicacion (10 columnas multimedia)
- Almacena imágenes/videos como BLOB
- Contador de vistas, likes, dislikes
- Estado: pendiente, aprobada, rechazada

### EstadisticaUsuario
- Publicaciones totales por usuario
- Comentarios totales
- Interacciones totales
- Actualización automática vía trigger

### ReporteComentario
- Sistema de reportes de comentarios
- Motivos: spam, lenguaje_ofensivo, acoso, contenido_inapropiado, otro
- Estados: pendiente, revisado, accion_tomada

---

## 🐛 Solución de Problemas

### Error: "Table already exists"
```sql
DROP DATABASE IF EXISTS BDM;
-- Luego ejecuta los archivos desde el inicio
```

### Error: "BLOB/TEXT column used in key specification without key length"
- Ya está resuelto en 00_DATABASE.sql
- Las columnas BLOB no tienen índices directos

### Error: "Duplicate entry for key"
- Si ejecutaste 02_DATOS_PRUEBA.sql dos veces
- Ejecuta `DELETE FROM <tabla>;` antes de reinsertar

---

**Fecha de Exportación**: 18 de Noviembre de 2025  
**Versión Base de Datos**: MariaDB 10.4.32  
**Charset**: utf8mb4  
**Collation**: utf8mb4_general_ci
