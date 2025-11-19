# 📚 DICCIONARIO DE DATOS - WORLD CUP HUB

## Base de Datos: BDM (Base de Datos Mundiales)

Sistema de gestión de publicaciones sobre Copas del Mundo FIFA con registro de usuarios, categorías, comentarios e interacciones.

---

## 📋 ÍNDICE DE TABLAS

1. [Usuario](#tabla-usuario)
2. [Publicacion](#tabla-publicacion)
3. [Comentario](#tabla-comentario)
4. [Interaccion](#tabla-interaccion)
5. [Categoria](#tabla-categoria)
6. [Mundial](#tabla-mundial)
7. [EstadisticaUsuario](#tabla-estadisticausuario)
8. [ReporteComentario](#tabla-reportecomentario)

---

## 🗂️ TABLAS PRINCIPALES

### Tabla: USUARIO

**Descripción**: Almacena información de usuarios registrados en el sistema (usuarios normales y administradores).

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idUsuario` | INT(11) | NO | PRI (AI) | - | Identificador único del usuario |
| `nombreCompleto` | VARCHAR(100) | NO | - | - | Nombre y apellido(s) del usuario |
| `correoElectronico` | VARCHAR(100) | NO | UNI | - | Email único del usuario (usado para login) |
| `contrasena` | VARCHAR(255) | NO | - | - | Contraseña hasheada con password_hash() |
| `fechaNacimiento` | DATE | NO | - | - | Fecha de nacimiento (validación: mayor a 12 años) |
| `foto` | VARCHAR(255) | YES | - | NULL | URL o ruta de foto de perfil del usuario |
| `rol` | ENUM('usuario','admin') | YES | - | 'usuario' | Rol del usuario en el sistema |
| `activo` | TINYINT(1) | YES | - | 1 | Estado del usuario (1=activo, 0=inactivo) |
| `fechaRegistro` | DATETIME | YES | - | CURRENT_TIMESTAMP | Fecha y hora de registro en el sistema |

**Restricciones**:
- PRIMARY KEY: `idUsuario`
- UNIQUE KEY: `correoElectronico`
- La edad debe ser mayor o igual a 12 años (validado en backend)
- El rol por defecto es 'usuario'
- La contraseña debe hashearse con `PASSWORD_DEFAULT` de PHP

**Relaciones**:
- Uno a muchos con `Publicacion` (un usuario puede crear muchas publicaciones)
- Uno a muchos con `Comentario` (un usuario puede hacer muchos comentarios)
- Uno a muchos con `Interaccion` (un usuario puede interactuar con muchas publicaciones)
- Uno a uno con `EstadisticaUsuario` (estadísticas del usuario)

---

### Tabla: PUBLICACION

**Descripción**: Almacena las publicaciones creadas por usuarios sobre Copas del Mundo. Incluye soporte para imágenes BLOB.

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idPublicacion` | INT(11) | NO | PRI (AI) | - | Identificador único de la publicación |
| `idUsuario` | INT(11) | NO | FOR | - | ID del usuario autor de la publicación |
| `idMundial` | INT(11) | NO | FOR | - | ID del mundial al que pertenece |
| `idCategoria` | INT(11) | NO | FOR | - | ID de la categoría de la publicación |
| `titulo` | VARCHAR(150) | NO | - | - | Título de la publicación (máx 150 caracteres) |
| `contenido` | TEXT | NO | - | - | Contenido/cuerpo de la publicación |
| `urlMultimedia` | VARCHAR(255) | YES | - | NULL | URL de imagen/video externa (opcional) |
| `multimediaBlob` | LONGBLOB | YES | - | NULL | Imagen almacenada como BLOB binario |
| `multimediaMimeType` | VARCHAR(50) | YES | - | NULL | Tipo MIME de la imagen BLOB (ej: image/jpeg) |
| `multimediaNombre` | VARCHAR(255) | YES | - | NULL | Nombre original del archivo BLOB |
| `fechaPublicacion` | DATETIME | YES | - | CURRENT_TIMESTAMP | Fecha y hora de creación |
| `fechaAprobacion` | DATETIME | YES | - | NULL | Fecha y hora de aprobación por admin |
| `estado` | ENUM('pendiente','aprobada','rechazada') | YES | - | 'pendiente' | Estado de moderación |
| `motivoRechazo` | TEXT | YES | - | NULL | Razón de rechazo si `estado='rechazada'` |
| `likes` | INT(11) | YES | - | 0 | Contador de likes (calculado dinámicamente) |
| `dislikes` | INT(11) | YES | - | 0 | Contador de dislikes (calculado dinámicamente) |
| `vistas` | INT(11) | YES | - | 0 | Contador de visualizaciones de la publicación |

**Restricciones**:
- PRIMARY KEY: `idPublicacion`
- FOREIGN KEY: `idUsuario` → `Usuario(idUsuario)` ON DELETE CASCADE
- FOREIGN KEY: `idMundial` → `Mundial(idMundial)` ON DELETE CASCADE
- FOREIGN KEY: `idCategoria` → `Categoria(idCategoria)` ON DELETE CASCADE
- Una publicación puede tener imagen BLOB O URL, no ambas
- Todas las publicaciones inician en estado 'pendiente'
- Solo publicaciones 'aprobadas' se muestran en el feed público

**Relaciones**:
- Muchos a uno con `Usuario` (muchas publicaciones pertenecen a un usuario)
- Muchos a uno con `Mundial` (muchas publicaciones pertenecen a un mundial)
- Muchos a uno con `Categoria` (muchas publicaciones pertenecen a una categoría)
- Uno a muchos con `Comentario` (una publicación puede tener muchos comentarios)
- Uno a muchos con `Interaccion` (una publicación puede tener muchas interacciones)

---

### Tabla: COMENTARIO

**Descripción**: Almacena comentarios realizados por usuarios en publicaciones específicas.

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idComentario` | INT(11) | NO | PRI (AI) | - | Identificador único del comentario |
| `idPublicacion` | INT(11) | NO | FOR | - | ID de la publicación comentada |
| `idUsuario` | INT(11) | NO | FOR | - | ID del usuario que comentó |
| `contenido` | TEXT | NO | - | - | Texto del comentario |
| `fechaComentario` | DATETIME | YES | - | CURRENT_TIMESTAMP | Fecha y hora del comentario |
| `activo` | TINYINT(1) | YES | - | 1 | Estado del comentario (1=visible, 0=eliminado) |

**Restricciones**:
- PRIMARY KEY: `idComentario`
- FOREIGN KEY: `idPublicacion` → `Publicacion(idPublicacion)` ON DELETE CASCADE
- FOREIGN KEY: `idUsuario` → `Usuario(idUsuario)` ON DELETE CASCADE
- Los comentarios marcados como `activo=0` no se muestran pero se conservan
- El contenido no puede estar vacío

**Relaciones**:
- Muchos a uno con `Publicacion` (muchos comentarios pertenecen a una publicación)
- Muchos a uno con `Usuario` (muchos comentarios pertenecen a un usuario)
- Uno a muchos con `ReporteComentario` (un comentario puede tener varios reportes)

---

### Tabla: INTERACCION

**Descripción**: Registra las interacciones de los usuarios con las publicaciones (likes y dislikes).

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idInteraccion` | INT(11) | NO | PRI (AI) | - | Identificador único de la interacción |
| `idUsuario` | INT(11) | NO | FOR | - | ID del usuario que interactuó |
| `idPublicacion` | INT(11) | NO | FOR | - | ID de la publicación con la que interactuó |
| `tipo` | ENUM('like','dislike') | NO | - | - | Tipo de interacción |
| `fecha` | DATETIME | YES | - | CURRENT_TIMESTAMP | Fecha y hora de la interacción |

**Restricciones**:
- PRIMARY KEY: `idInteraccion`
- FOREIGN KEY: `idUsuario` → `Usuario(idUsuario)` ON DELETE CASCADE
- FOREIGN KEY: `idPublicacion` → `Publicacion(idPublicacion)` ON DELETE CASCADE
- UNIQUE KEY: Combinación (`idUsuario`, `idPublicacion`) - un usuario solo puede tener UNA interacción por publicación
- Si un usuario cambia de 'like' a 'dislike', se elimina el registro anterior y se crea uno nuevo

**Relaciones**:
- Muchos a uno con `Usuario` (muchas interacciones pertenecen a un usuario)
- Muchos a uno con `Publicacion` (muchas interacciones pertenecen a una publicación)

---

### Tabla: CATEGORIA

**Descripción**: Catálogo de categorías para clasificar publicaciones (Jugadas, Entrevistas, Noticias, etc.).

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idCategoria` | INT(11) | NO | PRI (AI) | - | Identificador único de la categoría |
| `nombre` | VARCHAR(50) | NO | UNI | - | Nombre de la categoría |
| `descripcion` | TEXT | YES | - | NULL | Descripción detallada de la categoría |
| `color` | VARCHAR(20) | YES | - | '#000000' | Color en hexadecimal para UI |
| `activo` | TINYINT(1) | YES | - | 1 | Estado de la categoría (1=activa, 0=inactiva) |
| `fechaCreacion` | DATETIME | YES | - | CURRENT_TIMESTAMP | Fecha de creación de la categoría |

**Restricciones**:
- PRIMARY KEY: `idCategoria`
- UNIQUE KEY: `nombre`
- Solo categorías activas se muestran al crear publicaciones
- El color debe ser un valor hexadecimal válido (ej: #FF5733)

**Relaciones**:
- Uno a muchos con `Publicacion` (una categoría puede tener muchas publicaciones)

---

### Tabla: MUNDIAL

**Descripción**: Catálogo de Copas del Mundo FIFA con información histórica.

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idMundial` | INT(11) | NO | PRI (AI) | - | Identificador único del mundial |
| `anio` | INT(4) | NO | UNI | - | Año de realización del mundial |
| `paisSede` | VARCHAR(100) | NO | - | - | País o países sede |
| `campeón` | VARCHAR(100) | YES | - | NULL | País ganador del mundial |
| `subcampeon` | VARCHAR(100) | YES | - | NULL | País subcampeón |
| `descripcion` | TEXT | YES | - | NULL | Descripción o reseña del mundial |
| `fechaInicio` | DATE | YES | - | NULL | Fecha de inicio del torneo |
| `fechaFin` | DATE | YES | - | NULL | Fecha de finalización del torneo |
| `numeroEquipos` | INT(11) | YES | - | 32 | Cantidad de equipos participantes |
| `estado` | VARCHAR(20) | YES | - | 'finalizado' | Estado del mundial (próximo/en curso/finalizado) |
| `logo` | VARCHAR(255) | YES | - | NULL | URL del logo oficial del mundial |

**Restricciones**:
- PRIMARY KEY: `idMundial`
- UNIQUE KEY: `anio`
- El año debe ser válido y mayor a 1930 (primer mundial)
- `fechaInicio` debe ser anterior a `fechaFin`

**Relaciones**:
- Uno a muchos con `Publicacion` (un mundial puede tener muchas publicaciones)

---

### Tabla: ESTADISTICAUSUARIO

**Descripción**: Almacena estadísticas agregadas de actividad de cada usuario.

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idEstadistica` | INT(11) | NO | PRI (AI) | - | Identificador único de la estadística |
| `idUsuario` | INT(11) | NO | FOR | - | ID del usuario al que pertenecen las estadísticas |
| `totalPublicaciones` | INT(11) | YES | - | 0 | Total de publicaciones creadas |
| `totalComentarios` | INT(11) | YES | - | 0 | Total de comentarios realizados |
| `totalLikesRecibidos` | INT(11) | YES | - | 0 | Suma de likes en todas sus publicaciones |
| `totalDislikesRecibidos` | INT(11) | YES | - | 0 | Suma de dislikes en todas sus publicaciones |
| `ultimaActividad` | DATETIME | YES | - | CURRENT_TIMESTAMP | Última fecha de actividad del usuario |

**Restricciones**:
- PRIMARY KEY: `idEstadistica`
- FOREIGN KEY: `idUsuario` → `Usuario(idUsuario)` ON DELETE CASCADE
- UNIQUE KEY: `idUsuario` (un usuario solo tiene un registro de estadísticas)
- Los contadores se actualizan mediante triggers o stored procedures

**Relaciones**:
- Uno a uno con `Usuario` (cada usuario tiene un registro de estadísticas)

---

### Tabla: REPORTECOMENTARIO

**Descripción**: Almacena reportes de usuarios sobre comentarios inapropiados.

| Campo | Tipo de Dato | Nulo | Clave | Default | Descripción |
|-------|--------------|------|-------|---------|-------------|
| `idReporte` | INT(11) | NO | PRI (AI) | - | Identificador único del reporte |
| `idComentario` | INT(11) | NO | FOR | - | ID del comentario reportado |
| `idUsuario` | INT(11) | NO | FOR | - | ID del usuario que realizó el reporte |
| `motivo` | TEXT | NO | - | - | Razón del reporte |
| `fechaReporte` | DATETIME | YES | - | CURRENT_TIMESTAMP | Fecha y hora del reporte |
| `estado` | ENUM('pendiente','revisado','rechazado') | YES | - | 'pendiente' | Estado del reporte |

**Restricciones**:
- PRIMARY KEY: `idReporte`
- FOREIGN KEY: `idComentario` → `Comentario(idComentario)` ON DELETE CASCADE
- FOREIGN KEY: `idUsuario` → `Usuario(idUsuario)` ON DELETE CASCADE
- Un usuario puede reportar el mismo comentario solo una vez

**Relaciones**:
- Muchos a uno con `Comentario` (muchos reportes pueden pertenecer a un comentario)
- Muchos a uno con `Usuario` (muchos reportes pueden ser creados por un usuario)

---

## 🔍 VISTAS (VIEWS)

### 1. vw_publicaciones_completas
**Descripción**: Vista con información completa de publicaciones incluyendo datos de autor, categoría y mundial.

### 2. vw_estadisticas_usuario
**Descripción**: Vista con estadísticas calculadas de cada usuario (publicaciones, comentarios, likes).

### 3. vw_comentarios_con_autores
**Descripción**: Vista de comentarios con información del autor y la publicación comentada.

### 4. vw_interacciones_por_publicacion
**Descripción**: Vista que agrupa interacciones (likes/dislikes) por publicación.

### 5. vw_publicaciones_por_categoria
**Descripción**: Vista de publicaciones agrupadas por categoría con contadores.

### 6. vw_publicaciones_por_mundial
**Descripción**: Vista de publicaciones agrupadas por mundial con contadores.

### 7. vw_usuarios_activos
**Descripción**: Vista de usuarios que han estado activos en los últimos 30 días.

### 8. vw_publicaciones_populares
**Descripción**: Vista de publicaciones ordenadas por popularidad (likes + comentarios + vistas).

---

## ⚡ TRIGGERS

### 1. trg_actualizar_likes_dislikes_insert
**Evento**: AFTER INSERT en `Interaccion`
**Descripción**: Actualiza los contadores de likes/dislikes en `Publicacion` cuando se crea una interacción.

### 2. trg_actualizar_likes_dislikes_delete
**Evento**: AFTER DELETE en `Interaccion`
**Descripción**: Actualiza los contadores de likes/dislikes en `Publicacion` cuando se elimina una interacción.

### 3. trg_actualizar_likes_dislikes_update
**Evento**: AFTER UPDATE en `Interaccion`
**Descripción**: Actualiza los contadores cuando un usuario cambia su interacción (like ↔ dislike).

### 4. trg_validar_fechas_mundial
**Evento**: BEFORE INSERT/UPDATE en `Mundial`
**Descripción**: Valida que `fechaInicio` sea anterior a `fechaFin` antes de insertar o actualizar un mundial.

---

## 🔧 FUNCIONES (FUNCTIONS)

### 1. fn_calcular_popularidad(idPublicacion INT)
**Retorna**: DECIMAL(10,2)
**Descripción**: Calcula un índice de popularidad basado en likes, comentarios y vistas de una publicación.

### 2. fn_verificar_interaccion_usuario(idUsuario INT, idPublicacion INT)
**Retorna**: VARCHAR(10)
**Descripción**: Retorna el tipo de interacción ('like', 'dislike' o NULL) que tiene un usuario en una publicación.

---

## 📌 STORED PROCEDURES (39 Total)

### Autenticación y Usuarios (7 SPs)
1. `sp_login(correoElectronico, contrasena)` - Autenticación de usuario
2. `sp_registrar_usuario(...)` - Registro de nuevo usuario
3. `sp_obtener_usuario_por_id(idUsuario)` - Obtener datos de usuario
4. `sp_obtener_usuario_por_email(correoElectronico)` - Buscar usuario por email
5. `sp_actualizar_perfil_usuario(...)` - Actualizar datos de perfil
6. `sp_actualizar_foto_perfil(idUsuario, foto)` - Cambiar foto de perfil
7. `sp_obtener_estadisticas_usuario(idUsuario)` - Obtener estadísticas del usuario

### Publicaciones (9 SPs)
8. `sp_obtener_publicaciones_aprobadas()` - Feed de publicaciones aprobadas
9. `sp_obtener_publicacion_por_id(idPublicacion)` - Detalle de una publicación
10. `sp_crear_publicacion(...)` - Crear nueva publicación
11. `sp_actualizar_publicacion(...)` - Editar publicación existente
12. `sp_eliminar_publicacion(idPublicacion)` - Borrar publicación
13. `sp_aprobar_publicacion(idPublicacion)` - Aprobar publicación (admin)
14. `sp_rechazar_publicacion(idPublicacion, motivo)` - Rechazar publicación (admin)
15. `sp_obtener_publicaciones_usuario(idUsuario)` - Publicaciones de un usuario
16. `sp_obtener_publicaciones_por_estado(estado)` - Filtrar por estado (pendiente/aprobada/rechazada)

### Comentarios (4 SPs)
17. `sp_obtener_comentarios_por_publicacion(idPublicacion)` - Comentarios de una publicación
18. `sp_crear_comentario(idPublicacion, idUsuario, contenido)` - Crear comentario
19. `sp_actualizar_comentario(idComentario, contenido)` - Editar comentario
20. `sp_eliminar_comentario(idComentario)` - Eliminar comentario

### Interacciones (4 SPs)
21. `sp_crear_interaccion(tipo, idUsuario, idPublicacion)` - Crear like/dislike
22. `sp_eliminar_interaccion(idUsuario, idPublicacion)` - Eliminar interacción
23. `sp_obtener_interaccion_usuario(idUsuario, idPublicacion)` - Verificar interacción actual
24. `sp_contar_interacciones(idPublicacion)` - Contar likes y dislikes

### Categorías (5 SPs)
25. `sp_obtener_categorias()` - Listar todas las categorías
26. `sp_obtener_categoria_por_id(idCategoria)` - Obtener una categoría
27. `sp_crear_categoria(nombre, descripcion, color)` - Crear categoría
28. `sp_actualizar_categoria(...)` - Editar categoría
29. `sp_eliminar_categoria(idCategoria)` - Eliminar categoría

### Mundiales (5 SPs)
30. `sp_obtener_mundiales()` - Listar todos los mundiales
31. `sp_obtener_mundial_por_id(idMundial)` - Obtener un mundial
32. `sp_crear_mundial(...)` - Crear nuevo mundial
33. `sp_actualizar_mundial(...)` - Editar mundial
34. `sp_eliminar_mundial(idMundial)` - Eliminar mundial

### Administración (3 SPs)
35. `sp_obtener_publicaciones_pendientes()` - Publicaciones para moderar
36. `sp_obtener_todos_comentarios()` - Todos los comentarios (admin)
37. `sp_obtener_todos_usuarios()` - Lista de usuarios (admin)

### Contador de Vistas (1 SP)
38. `sp_incrementar_vistas_publicacion(idPublicacion)` - Incrementar visualizaciones

### Estado de Publicaciones (1 SP)
39. `sp_actualizar_estado_publicacion(idPublicacion, estado, motivo)` - Cambiar estado de publicación

---

## 🔐 NORMALIZACIÓN

La base de datos cumple con la **3ª Forma Normal (3FN)**:

### 1FN (Primera Forma Normal)
✅ Todos los campos contienen valores atómicos
✅ No hay grupos repetitivos
✅ Cada tabla tiene una clave primaria única

### 2FN (Segunda Forma Normal)
✅ Cumple con 1FN
✅ Todos los atributos no clave dependen completamente de la clave primaria
✅ No hay dependencias parciales

### 3FN (Tercera Forma Normal)
✅ Cumple con 2FN
✅ No hay dependencias transitivas
✅ Los atributos no clave no dependen de otros atributos no clave

**Ejemplo de normalización aplicada**:
- Información de categoría se separó en tabla `Categoria` (no redundante en `Publicacion`)
- Información de mundial se separó en tabla `Mundial` (no redundante en `Publicacion`)
- Estadísticas de usuario se separaron en tabla `EstadisticaUsuario` (no en `Usuario`)

---

## 📊 DIAGRAMA DE RELACIONES

```
Usuario (1) ──────< (N) Publicacion
    │                       │
    │                       ├──< (N) Comentario
    │                       │
    │                       └──< (N) Interaccion
    │
    ├──────< (N) Comentario
    │
    ├──────< (N) Interaccion
    │
    └────── (1) EstadisticaUsuario

Categoria (1) ──────< (N) Publicacion

Mundial (1) ──────< (N) Publicacion

Comentario (1) ──────< (N) ReporteComentario
```

---

## 🛡️ ÍNDICES Y OPTIMIZACIÓN

### Índices PRIMARY KEY (automáticos)
- `idUsuario`, `idPublicacion`, `idComentario`, `idInteraccion`, `idCategoria`, `idMundial`, `idEstadistica`, `idReporte`

### Índices UNIQUE
- `Usuario.correoElectronico`
- `Categoria.nombre`
- `Mundial.anio`

### Índices FOREIGN KEY (automáticos en InnoDB)
- `Publicacion.idUsuario`
- `Publicacion.idMundial`
- `Publicacion.idCategoria`
- `Comentario.idPublicacion`
- `Comentario.idUsuario`
- `Interaccion.idUsuario`
- `Interaccion.idPublicacion`

### Índices Compuestos Recomendados
- `Interaccion(idUsuario, idPublicacion)` - Para búsquedas rápidas de interacción específica
- `Publicacion(estado, fechaPublicacion)` - Para ordenar feed de aprobadas
- `Comentario(idPublicacion, activo)` - Para listar comentarios visibles de una publicación

---

## 📝 NOTAS ADICIONALES

### Sistema BLOB
- Las imágenes se pueden almacenar como BLOB (`multimediaBlob`) o como URL (`urlMultimedia`)
- El campo `tieneBlob` calculado dinámicamente indica si existe imagen BLOB
- `blob-api.php` maneja la descarga de imágenes BLOB con el formato: `/blob-api.php?action=download&tipo=publicacion&id={idPublicacion}`

### Sistema de Moderación
- Todas las publicaciones inician en estado `pendiente`
- Un administrador debe aprobarlas para que aparezcan en el feed
- Publicaciones rechazadas guardan el `motivoRechazo`

### Sistema de Interacciones
- Un usuario solo puede tener UNA interacción activa por publicación (like O dislike)
- Si cambia de opinión, se elimina la anterior y se crea una nueva
- Los contadores se calculan dinámicamente con subconsultas en lugar de columnas estáticas

### Validaciones de Edad
- Frontend: JavaScript valida >= 12 años en `signup.js`
- Backend: PHP valida >= 12 años en `api.php` (función `handleRegister`)
- La validación es obligatoria en ambos lados

---

**Fecha de Creación**: Noviembre 2025  
**Versión**: 1.0  
**Motor de Base de Datos**: MySQL 8.0 / MariaDB 10.x  
**Charset**: utf8mb4_unicode_ci
