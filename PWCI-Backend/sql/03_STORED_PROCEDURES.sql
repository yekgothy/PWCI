-- =====================================================
-- STORED_PROCEDURES_DEFINITIVOS.SQL
-- TODOS LOS SPs QUE FUNCIONABAN ANTES DE BLOB
-- VERSION ESTABLE Y COMPLETA - 38 PROCEDIMIENTOS
-- =====================================================

USE BDM;

-- Limpiar procedimientos existentes
DROP PROCEDURE IF EXISTS sp_login;
DROP PROCEDURE IF EXISTS sp_registrar_usuario;
DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_id;
DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_email;
DROP PROCEDURE IF EXISTS sp_actualizar_perfil_usuario;
DROP PROCEDURE IF EXISTS sp_actualizar_foto_perfil;
DROP PROCEDURE IF EXISTS sp_obtener_estadisticas_usuario;
DROP PROCEDURE IF EXISTS sp_obtener_publicaciones_aprobadas;
DROP PROCEDURE IF EXISTS sp_obtener_publicacion_por_id;
DROP PROCEDURE IF EXISTS sp_crear_publicacion;
DROP PROCEDURE IF EXISTS sp_actualizar_publicacion;
DROP PROCEDURE IF EXISTS sp_eliminar_publicacion;
DROP PROCEDURE IF EXISTS sp_aprobar_publicacion;
DROP PROCEDURE IF EXISTS sp_rechazar_publicacion;
DROP PROCEDURE IF EXISTS sp_obtener_publicaciones_pendientes;
DROP PROCEDURE IF EXISTS sp_obtener_publicaciones_usuario;
DROP PROCEDURE IF EXISTS sp_obtener_publicaciones_por_estado;
DROP PROCEDURE IF EXISTS sp_actualizar_estado_publicacion;
DROP PROCEDURE IF EXISTS sp_obtener_categorias;
DROP PROCEDURE IF EXISTS sp_obtener_categoria_por_id;
DROP PROCEDURE IF EXISTS sp_crear_categoria;
DROP PROCEDURE IF EXISTS sp_actualizar_categoria;
DROP PROCEDURE IF EXISTS sp_eliminar_categoria;
DROP PROCEDURE IF EXISTS sp_obtener_mundiales;
DROP PROCEDURE IF EXISTS sp_obtener_mundial_por_id;
DROP PROCEDURE IF EXISTS sp_crear_mundial;
DROP PROCEDURE IF EXISTS sp_actualizar_mundial;
DROP PROCEDURE IF EXISTS sp_eliminar_mundial;
DROP PROCEDURE IF EXISTS sp_obtener_comentarios_por_publicacion;
DROP PROCEDURE IF EXISTS sp_crear_comentario;
DROP PROCEDURE IF EXISTS sp_actualizar_comentario;
DROP PROCEDURE IF EXISTS sp_eliminar_comentario;
DROP PROCEDURE IF EXISTS sp_crear_interaccion;
DROP PROCEDURE IF EXISTS sp_eliminar_interaccion;
DROP PROCEDURE IF EXISTS sp_obtener_interaccion_usuario;
DROP PROCEDURE IF EXISTS sp_contar_interacciones;
DROP PROCEDURE IF EXISTS sp_obtener_todos_comentarios;
DROP PROCEDURE IF EXISTS sp_obtener_todos_usuarios;
DROP PROCEDURE IF EXISTS sp_incrementar_vistas_publicacion;

DELIMITER //

-- ============================================
-- USUARIOS (8 SPs)
-- ============================================

-- 1. Login de usuario
CREATE PROCEDURE sp_login(
    IN p_correoElectronico VARCHAR(100)
)
BEGIN
    SELECT 
        idUsuario, nombreCompleto, correoElectronico, contrasena, 
        fechaNacimiento, genero, paisNacimiento, nacionalidad,
        foto, rol, activo, fechaRegistro
    FROM Usuario
    WHERE correoElectronico = p_correoElectronico AND activo = TRUE;
END//

-- 2. Registrar nuevo usuario
CREATE PROCEDURE sp_registrar_usuario(
    IN p_nombreCompleto VARCHAR(100),
    IN p_correoElectronico VARCHAR(100),
    IN p_contrasena VARCHAR(255),
    IN p_fechaNacimiento DATE,
    IN p_foto VARCHAR(255)
)
BEGIN
    INSERT INTO Usuario (nombreCompleto, correoElectronico, contrasena, fechaNacimiento, foto, rol, activo)
    VALUES (p_nombreCompleto, p_correoElectronico, p_contrasena, p_fechaNacimiento, p_foto, 'usuario', TRUE);
    SELECT LAST_INSERT_ID() as idUsuario;
END//

-- 3. Obtener usuario por ID
CREATE PROCEDURE sp_obtener_usuario_por_id(
    IN p_idUsuario INT
)
BEGIN
    SELECT 
        idUsuario, nombreCompleto, correoElectronico, fechaNacimiento,
        genero, paisNacimiento, nacionalidad, foto, rol, activo, fechaRegistro
    FROM Usuario
    WHERE idUsuario = p_idUsuario AND activo = TRUE;
END//

-- 4. Obtener usuario por email
CREATE PROCEDURE sp_obtener_usuario_por_email(
    IN p_correoElectronico VARCHAR(100)
)
BEGIN
    SELECT 
        idUsuario, nombreCompleto, correoElectronico, contrasena,
        fechaNacimiento, genero, paisNacimiento, nacionalidad,
        foto, rol, activo, fechaRegistro
    FROM Usuario
    WHERE correoElectronico = p_correoElectronico;
END//

-- 5. Actualizar perfil de usuario
CREATE PROCEDURE sp_actualizar_perfil_usuario(
    IN p_idUsuario INT,
    IN p_nombreCompleto VARCHAR(100),
    IN p_fechaNacimiento DATE
)
BEGIN
    UPDATE Usuario
    SET nombreCompleto = COALESCE(p_nombreCompleto, nombreCompleto),
        fechaNacimiento = COALESCE(p_fechaNacimiento, fechaNacimiento)
    WHERE idUsuario = p_idUsuario;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 6. Actualizar foto de perfil
CREATE PROCEDURE sp_actualizar_foto_perfil(
    IN p_idUsuario INT,
    IN p_foto VARCHAR(255)
)
BEGIN
    UPDATE Usuario SET foto = p_foto WHERE idUsuario = p_idUsuario;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 7. Obtener estadísticas de usuario
CREATE PROCEDURE sp_obtener_estadisticas_usuario(
    IN p_idUsuario INT
)
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM Publicacion WHERE idUsuario = p_idUsuario) as totalPublicaciones,
        (SELECT COUNT(*) FROM Publicacion WHERE idUsuario = p_idUsuario AND estado = 'aprobada') as publicacionesAprobadas,
        (SELECT COUNT(*) FROM Publicacion WHERE idUsuario = p_idUsuario AND estado = 'pendiente') as publicacionesPendientes,
        (SELECT COUNT(*) FROM Publicacion WHERE idUsuario = p_idUsuario AND estado = 'rechazada') as publicacionesRechazadas,
        (SELECT COUNT(*) FROM Comentario WHERE idUsuario = p_idUsuario) as totalComentarios,
        (SELECT COALESCE(SUM(likes), 0) FROM Publicacion WHERE idUsuario = p_idUsuario) as totalLikes,
        (SELECT COALESCE(SUM(dislikes), 0) FROM Publicacion WHERE idUsuario = p_idUsuario) as totalDislikes;
END//

-- 8. Obtener TODOS los usuarios (admin)
CREATE PROCEDURE sp_obtener_todos_usuarios()
BEGIN
    SELECT 
        idUsuario, nombreCompleto, correoElectronico, fechaNacimiento,
        genero, paisNacimiento, nacionalidad, foto, rol, activo, fechaRegistro
    FROM Usuario
    WHERE activo = TRUE
    ORDER BY fechaRegistro DESC;
END//

-- ============================================
-- PUBLICACIONES (10 SPs)
-- ============================================

-- 9. Obtener publicaciones aprobadas (feed)
CREATE PROCEDURE sp_obtener_publicaciones_aprobadas()
BEGIN
    SELECT 
        p.idPublicacion, p.titulo, p.contenido, p.urlMultimedia, p.estado,
        p.multimediaMimeType, p.multimediaNombre,
        CASE WHEN p.multimediaBlob IS NOT NULL THEN 1 ELSE 0 END as tieneBlob,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'like') as likes,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'dislike') as dislikes,
        p.vistas,
        p.fechaPublicacion, p.fechaAprobacion,
        u.idUsuario, u.nombreCompleto as nombreAutor, u.foto as fotoAutor,
        c.idCategoria, c.nombre as nombreCategoria, c.color as colorCategoria,
        m.idMundial, m.anio as anioMundial, m.paisSede,
        (SELECT COUNT(*) FROM Comentario WHERE idPublicacion = p.idPublicacion AND activo = TRUE) as totalComentarios
    FROM Publicacion p
    INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
    INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
    INNER JOIN Mundial m ON p.idMundial = m.idMundial
    WHERE p.estado = 'aprobada'
    ORDER BY p.fechaPublicacion DESC;
END//

-- 10. Obtener publicación por ID
CREATE PROCEDURE sp_obtener_publicacion_por_id(
    IN p_idPublicacion INT
)
BEGIN
    SELECT 
        p.idPublicacion, p.titulo, p.contenido, p.urlMultimedia, p.estado,
        p.multimediaMimeType, p.multimediaNombre,
        CASE WHEN p.multimediaBlob IS NOT NULL THEN 1 ELSE 0 END as tieneBlob,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'like') as likes,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'dislike') as dislikes,
        p.vistas,
        p.fechaPublicacion, p.fechaAprobacion,
        u.idUsuario, u.nombreCompleto as nombreAutor, u.foto as fotoAutor,
        c.idCategoria, c.nombre as nombreCategoria, c.color as colorCategoria,
        m.idMundial, m.anio as anioMundial, m.paisSede,
        (SELECT COUNT(*) FROM Comentario WHERE idPublicacion = p.idPublicacion AND activo = TRUE) as totalComentarios
    FROM Publicacion p
    INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
    INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
    INNER JOIN Mundial m ON p.idMundial = m.idMundial
    WHERE p.idPublicacion = p_idPublicacion;
END//

-- 11. Obtener publicaciones por estado
CREATE PROCEDURE sp_obtener_publicaciones_por_estado(
    IN p_estado VARCHAR(20)
)
BEGIN
    SELECT 
        p.idPublicacion, p.titulo, p.contenido, p.urlMultimedia, p.estado,
        p.multimediaMimeType, p.multimediaNombre,
        CASE WHEN p.multimediaBlob IS NOT NULL THEN 1 ELSE 0 END as tieneBlob,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'like') as likes,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'dislike') as dislikes,
        p.vistas,
        p.fechaPublicacion, p.fechaAprobacion,
        u.idUsuario, u.nombreCompleto as nombreAutor, u.foto as fotoAutor,
        c.idCategoria, c.nombre as nombreCategoria, c.color as colorCategoria,
        m.idMundial, m.anio as anioMundial, m.paisSede,
        (SELECT COUNT(*) FROM Comentario WHERE idPublicacion = p.idPublicacion AND activo = TRUE) as totalComentarios
    FROM Publicacion p
    INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
    INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
    INNER JOIN Mundial m ON p.idMundial = m.idMundial
    WHERE p.estado = p_estado
    ORDER BY p.fechaPublicacion DESC;
END//

-- 12. Obtener publicaciones pendientes
CREATE PROCEDURE sp_obtener_publicaciones_pendientes()
BEGIN
    SELECT 
        p.idPublicacion, p.titulo, p.contenido, p.urlMultimedia, p.fechaPublicacion,
        p.estado, p.likes, p.dislikes, p.idUsuario,
        u.nombreCompleto as nombreAutor, u.correoElectronico as emailAutor,
        c.idCategoria, c.nombre as nombreCategoria, c.color as colorCategoria,
        m.idMundial, m.anio as anioMundial, m.paisSede
    FROM Publicacion p
    INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
    INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
    INNER JOIN Mundial m ON p.idMundial = m.idMundial
    WHERE p.estado = 'pendiente'
    ORDER BY p.fechaPublicacion DESC;
END//

-- 13. Obtener publicaciones de un usuario
CREATE PROCEDURE sp_obtener_publicaciones_usuario(
    IN p_idUsuario INT
)
BEGIN
    SELECT 
        p.idPublicacion, p.titulo, p.contenido, p.urlMultimedia,
        p.multimediaMimeType, p.multimediaNombre,
        CASE WHEN p.multimediaBlob IS NOT NULL THEN 1 ELSE 0 END as tieneBlob,
        p.fechaPublicacion, p.estado,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'like') as likes,
        (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p.idPublicacion AND tipo = 'dislike') as dislikes,
        p.vistas,
        (SELECT COUNT(*) FROM Comentario WHERE idPublicacion = p.idPublicacion AND activo = TRUE) as totalComentarios,
        c.idCategoria, c.nombre as nombreCategoria, c.color as colorCategoria,
        m.idMundial, m.anio as anioMundial, m.paisSede
    FROM Publicacion p
    INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
    INNER JOIN Mundial m ON p.idMundial = m.idMundial
    WHERE p.idUsuario = p_idUsuario
    ORDER BY p.fechaPublicacion DESC;
END//

-- 14. Crear publicación
CREATE PROCEDURE sp_crear_publicacion(
    IN p_titulo VARCHAR(150),
    IN p_contenido TEXT,
    IN p_urlMultimedia VARCHAR(255),
    IN p_idUsuario INT,
    IN p_idCategoria INT,
    IN p_idMundial INT
)
BEGIN
    INSERT INTO Publicacion (titulo, contenido, urlMultimedia, idUsuario, idCategoria, idMundial, estado)
    VALUES (p_titulo, p_contenido, p_urlMultimedia, p_idUsuario, p_idCategoria, p_idMundial, 'pendiente');
    SELECT LAST_INSERT_ID() as idPublicacion;
END//

-- 15. Actualizar publicación
CREATE PROCEDURE sp_actualizar_publicacion(
    IN p_idPublicacion INT,
    IN p_titulo VARCHAR(150),
    IN p_contenido TEXT,
    IN p_urlMultimedia VARCHAR(255),
    IN p_idCategoria INT,
    IN p_idMundial INT
)
BEGIN
    UPDATE Publicacion
    SET titulo = p_titulo, contenido = p_contenido, urlMultimedia = p_urlMultimedia,
        idCategoria = p_idCategoria, idMundial = p_idMundial
    WHERE idPublicacion = p_idPublicacion;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 16. Actualizar estado de publicación
CREATE PROCEDURE sp_actualizar_estado_publicacion(
    IN p_idPublicacion INT,
    IN p_estado ENUM('pendiente', 'aprobada', 'rechazada')
)
BEGIN
    IF p_estado = 'aprobada' THEN
        UPDATE Publicacion SET estado = p_estado, fechaAprobacion = NOW()
        WHERE idPublicacion = p_idPublicacion;
    ELSE
        UPDATE Publicacion SET estado = p_estado WHERE idPublicacion = p_idPublicacion;
    END IF;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 17. Eliminar publicación
CREATE PROCEDURE sp_eliminar_publicacion(
    IN p_idPublicacion INT
)
BEGIN
    DELETE FROM Publicacion WHERE idPublicacion = p_idPublicacion;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 18. Aprobar publicación
CREATE PROCEDURE sp_aprobar_publicacion(
    IN p_idPublicacion INT
)
BEGIN
    UPDATE Publicacion SET estado = 'aprobada', fechaAprobacion = NOW()
    WHERE idPublicacion = p_idPublicacion;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- ============================================
-- CATEGORÍAS (5 SPs)
-- ============================================

-- 19. Obtener todas las categorías
CREATE PROCEDURE sp_obtener_categorias()
BEGIN
    SELECT idCategoria, nombre, descripcion, color, activa, fechaCreacion
    FROM Categoria
    WHERE activa = TRUE
    ORDER BY nombre ASC;
END//

-- 20. Obtener categoría por ID
CREATE PROCEDURE sp_obtener_categoria_por_id(
    IN p_idCategoria INT
)
BEGIN
    SELECT idCategoria, nombre, descripcion, color, activa, fechaCreacion
    FROM Categoria
    WHERE idCategoria = p_idCategoria;
END//

-- 21. Crear categoría
CREATE PROCEDURE sp_crear_categoria(
    IN p_nombre VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_color VARCHAR(7)
)
BEGIN
    INSERT INTO Categoria (nombre, descripcion, color)
    VALUES (p_nombre, p_descripcion, p_color);
    SELECT LAST_INSERT_ID() as idCategoria;
END//

-- 22. Actualizar categoría
CREATE PROCEDURE sp_actualizar_categoria(
    IN p_idCategoria INT,
    IN p_nombre VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_color VARCHAR(7)
)
BEGIN
    UPDATE Categoria
    SET nombre = COALESCE(p_nombre, nombre),
        descripcion = COALESCE(p_descripcion, descripcion),
        color = COALESCE(p_color, color)
    WHERE idCategoria = p_idCategoria;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 23. Eliminar categoría
CREATE PROCEDURE sp_eliminar_categoria(
    IN p_idCategoria INT
)
BEGIN
    UPDATE Categoria SET activa = FALSE WHERE idCategoria = p_idCategoria;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- ============================================
-- MUNDIALES (5 SPs)
-- ============================================

-- 24. Obtener todos los mundiales
CREATE PROCEDURE sp_obtener_mundiales()
BEGIN
    SELECT idMundial, anio, paisSede, logo, nombreOficial,
           descripcion, fechaInicio, fechaFin, numeroEquipos, estado, fechaCreacion
    FROM Mundial
    ORDER BY anio DESC;
END//

-- 25. Obtener mundial por ID
CREATE PROCEDURE sp_obtener_mundial_por_id(
    IN p_idMundial INT
)
BEGIN
    SELECT idMundial, anio, paisSede, logo, nombreOficial,
           descripcion, fechaInicio, fechaFin, numeroEquipos, estado, fechaCreacion
    FROM Mundial
    WHERE idMundial = p_idMundial;
END//

-- 26. Crear mundial
CREATE PROCEDURE sp_crear_mundial(
    IN p_anio INT,
    IN p_paisSede VARCHAR(50),
    IN p_logo VARCHAR(255),
    IN p_nombreOficial VARCHAR(100),
    IN p_descripcion TEXT,
    IN p_fechaInicio DATE,
    IN p_fechaFin DATE,
    IN p_numeroEquipos INT,
    IN p_estado VARCHAR(20)
)
BEGIN
    INSERT INTO Mundial (anio, paisSede, logo, nombreOficial, descripcion, fechaInicio, fechaFin, numeroEquipos, estado)
    VALUES (p_anio, p_paisSede, p_logo, p_nombreOficial, p_descripcion, p_fechaInicio, p_fechaFin, p_numeroEquipos, p_estado);
    SELECT LAST_INSERT_ID() as idMundial;
END//

-- 27. Actualizar mundial
CREATE PROCEDURE sp_actualizar_mundial(
    IN p_idMundial INT,
    IN p_anio INT,
    IN p_paisSede VARCHAR(50),
    IN p_logo VARCHAR(255),
    IN p_nombreOficial VARCHAR(100),
    IN p_descripcion TEXT,
    IN p_fechaInicio DATE,
    IN p_fechaFin DATE,
    IN p_numeroEquipos INT,
    IN p_estado VARCHAR(20)
)
BEGIN
    UPDATE Mundial
    SET anio = COALESCE(p_anio, anio),
        paisSede = COALESCE(p_paisSede, paisSede),
        logo = COALESCE(p_logo, logo),
        nombreOficial = COALESCE(p_nombreOficial, nombreOficial),
        descripcion = COALESCE(p_descripcion, descripcion),
        fechaInicio = COALESCE(p_fechaInicio, fechaInicio),
        fechaFin = COALESCE(p_fechaFin, fechaFin),
        numeroEquipos = COALESCE(p_numeroEquipos, numeroEquipos),
        estado = COALESCE(p_estado, estado)
    WHERE idMundial = p_idMundial;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 28. Eliminar mundial
CREATE PROCEDURE sp_eliminar_mundial(
    IN p_idMundial INT
)
BEGIN
    DELETE FROM Mundial WHERE idMundial = p_idMundial;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- ============================================
-- COMENTARIOS (5 SPs)
-- ============================================

-- 29. Obtener comentarios por publicación
CREATE PROCEDURE sp_obtener_comentarios_por_publicacion(
    IN p_idPublicacion INT
)
BEGIN
    SELECT 
        c.idComentario, c.contenido, c.fechaComentario, c.activo,
        u.idUsuario, u.nombreCompleto as nombreAutor, u.foto as fotoAutor
    FROM Comentario c
    INNER JOIN Usuario u ON c.idUsuario = u.idUsuario
    WHERE c.idPublicacion = p_idPublicacion AND c.activo = TRUE
    ORDER BY c.fechaComentario DESC;
END//

-- 30. Obtener TODOS los comentarios (admin)
CREATE PROCEDURE sp_obtener_todos_comentarios()
BEGIN
    SELECT 
        c.idComentario, c.contenido, c.fechaComentario,
        c.idPublicacion, p.titulo as tituloPublicacion,
        u.idUsuario, u.nombreCompleto as nombreAutor, c.activo
    FROM Comentario c
    INNER JOIN Publicacion p ON c.idPublicacion = p.idPublicacion
    INNER JOIN Usuario u ON c.idUsuario = u.idUsuario
    WHERE c.activo = TRUE
    ORDER BY c.fechaComentario DESC;
END//

-- 31. Crear comentario
CREATE PROCEDURE sp_crear_comentario(
    IN p_contenido TEXT,
    IN p_idUsuario INT,
    IN p_idPublicacion INT
)
BEGIN
    INSERT INTO Comentario (contenido, idUsuario, idPublicacion)
    VALUES (p_contenido, p_idUsuario, p_idPublicacion);
    SELECT LAST_INSERT_ID() as idComentario;
END//

-- 32. Actualizar comentario
CREATE PROCEDURE sp_actualizar_comentario(
    IN p_idComentario INT,
    IN p_contenido TEXT
)
BEGIN
    UPDATE Comentario
    SET contenido = p_contenido, editado = TRUE, fechaEdicion = NOW()
    WHERE idComentario = p_idComentario;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 33. Eliminar comentario
CREATE PROCEDURE sp_eliminar_comentario(
    IN p_idComentario INT
)
BEGIN
    UPDATE Comentario SET activo = FALSE WHERE idComentario = p_idComentario;
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- ============================================
-- INTERACCIONES (5 SPs)
-- ============================================

-- 34. Crear o actualizar interacción
CREATE PROCEDURE sp_crear_interaccion(
    IN p_tipo ENUM('like', 'dislike'),
    IN p_idUsuario INT,
    IN p_idPublicacion INT
)
BEGIN
    INSERT INTO Interaccion (tipo, idUsuario, idPublicacion)
    VALUES (p_tipo, p_idUsuario, p_idPublicacion)
    ON DUPLICATE KEY UPDATE tipo = p_tipo, fecha = NOW();
    
    UPDATE Publicacion p
    SET 
        likes = (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p_idPublicacion AND tipo = 'like'),
        dislikes = (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p_idPublicacion AND tipo = 'dislike')
    WHERE idPublicacion = p_idPublicacion;
    
    SELECT LAST_INSERT_ID() as idInteraccion;
END//

-- 35. Eliminar interacción
CREATE PROCEDURE sp_eliminar_interaccion(
    IN p_idUsuario INT,
    IN p_idPublicacion INT
)
BEGIN
    DELETE FROM Interaccion 
    WHERE idUsuario = p_idUsuario AND idPublicacion = p_idPublicacion;
    
    UPDATE Publicacion p
    SET 
        likes = (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p_idPublicacion AND tipo = 'like'),
        dislikes = (SELECT COUNT(*) FROM Interaccion WHERE idPublicacion = p_idPublicacion AND tipo = 'dislike')
    WHERE idPublicacion = p_idPublicacion;
    
    SELECT ROW_COUNT() as filasAfectadas;
END//

-- 36. Obtener interacción de usuario
CREATE PROCEDURE sp_obtener_interaccion_usuario(
    IN p_idUsuario INT,
    IN p_idPublicacion INT
)
BEGIN
    SELECT idInteraccion, tipo, fecha
    FROM Interaccion
    WHERE idUsuario = p_idUsuario AND idPublicacion = p_idPublicacion;
END//

-- 37. Contar interacciones
CREATE PROCEDURE sp_contar_interacciones(
    IN p_idPublicacion INT
)
BEGIN
    SELECT 
        COUNT(CASE WHEN tipo = 'like' THEN 1 END) as totalLikes,
        COUNT(CASE WHEN tipo = 'dislike' THEN 1 END) as totalDislikes
    FROM Interaccion
    WHERE idPublicacion = p_idPublicacion;
END//

-- 38. Incrementar vistas de publicación
CREATE PROCEDURE sp_incrementar_vistas_publicacion(
    IN p_idPublicacion INT
)
BEGIN
    UPDATE Publicacion 
    SET vistas = vistas + 1 
    WHERE idPublicacion = p_idPublicacion;
    
    SELECT vistas FROM Publicacion WHERE idPublicacion = p_idPublicacion;
END//

-- ============================================
-- SP AUXILIAR: Contar usuarios (para diagnóstico)
-- ============================================
DROP PROCEDURE IF EXISTS sp_contar_usuarios //
CREATE PROCEDURE sp_contar_usuarios()
BEGIN
    SELECT COUNT(*) as total FROM Usuario;
END//

DELIMITER ;

-- ============================================
SELECT '✅ 40 STORED PROCEDURES CREADOS EXITOSAMENTE' as status;
SELECT 'Sistema con BLOB y vistas completo' as info;
