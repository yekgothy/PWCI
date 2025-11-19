-- =====================================================
-- TRIGGERS, VIEWS Y FUNCTIONS - REQUISITOS ACADÉMICOS
-- Base de Datos Mundial - BDM
-- =====================================================

USE BDM;

-- =====================================================
-- PARTE 1: TRIGGERS (Mínimo 2 requeridos)
-- =====================================================

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trg_actualizar_likes_dislikes_insert;
DROP TRIGGER IF EXISTS trg_actualizar_likes_dislikes_delete;
DROP TRIGGER IF EXISTS trg_actualizar_likes_dislikes_update;
DROP TRIGGER IF EXISTS trg_log_cambio_estado_publicacion;

-- TRIGGER 1: Actualizar likes/dislikes automáticamente
-- Cuando se inserta una interacción
DELIMITER //
CREATE TRIGGER trg_actualizar_likes_dislikes_insert
AFTER INSERT ON Interaccion
FOR EACH ROW
BEGIN
    UPDATE Publicacion
    SET likes = (SELECT COUNT(*) FROM Interaccion 
                 WHERE idPublicacion = NEW.idPublicacion AND tipo = 'like'),
        dislikes = (SELECT COUNT(*) FROM Interaccion 
                    WHERE idPublicacion = NEW.idPublicacion AND tipo = 'dislike')
    WHERE idPublicacion = NEW.idPublicacion;
END//
DELIMITER ;

-- Cuando se elimina una interacción
DELIMITER //
CREATE TRIGGER trg_actualizar_likes_dislikes_delete
AFTER DELETE ON Interaccion
FOR EACH ROW
BEGIN
    UPDATE Publicacion
    SET likes = (SELECT COUNT(*) FROM Interaccion 
                 WHERE idPublicacion = OLD.idPublicacion AND tipo = 'like'),
        dislikes = (SELECT COUNT(*) FROM Interaccion 
                    WHERE idPublicacion = OLD.idPublicacion AND tipo = 'dislike')
    WHERE idPublicacion = OLD.idPublicacion;
END//
DELIMITER ;

-- Cuando se actualiza una interacción
DELIMITER //
CREATE TRIGGER trg_actualizar_likes_dislikes_update
AFTER UPDATE ON Interaccion
FOR EACH ROW
BEGIN
    UPDATE Publicacion
    SET likes = (SELECT COUNT(*) FROM Interaccion 
                 WHERE idPublicacion = NEW.idPublicacion AND tipo = 'like'),
        dislikes = (SELECT COUNT(*) FROM Interaccion 
                    WHERE idPublicacion = NEW.idPublicacion AND tipo = 'dislike')
    WHERE idPublicacion = NEW.idPublicacion;
END//
DELIMITER ;

-- TRIGGER 2: Validar fecha de mundial antes de insertar
DELIMITER //
CREATE TRIGGER trg_validar_fechas_mundial
BEFORE INSERT ON Mundial
FOR EACH ROW
BEGIN
    IF NEW.fechaInicio IS NOT NULL AND NEW.fechaFin IS NOT NULL THEN
        IF NEW.fechaFin < NEW.fechaInicio THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La fecha de fin no puede ser anterior a la fecha de inicio';
        END IF;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- PARTE 2: VIEWS (Mínimo 8 requeridas)
-- =====================================================

-- Eliminar vistas existentes si existen
DROP VIEW IF EXISTS vw_publicaciones_completas;
DROP VIEW IF EXISTS vw_estadisticas_usuario;
DROP VIEW IF EXISTS vw_comentarios_con_autores;
DROP VIEW IF EXISTS vw_interacciones_por_publicacion;
DROP VIEW IF EXISTS vw_publicaciones_por_categoria;
DROP VIEW IF EXISTS vw_publicaciones_por_mundial;
DROP VIEW IF EXISTS vw_usuarios_activos;
DROP VIEW IF EXISTS vw_publicaciones_populares;

-- VIEW 1: Publicaciones con toda la información relacionada
CREATE VIEW vw_publicaciones_completas AS
SELECT 
    p.idPublicacion,
    p.titulo,
    p.contenido,
    p.urlMultimedia,
    p.estado,
    p.likes,
    p.dislikes,
    p.fechaPublicacion,
    p.fechaAprobacion,
    u.idUsuario,
    u.nombreCompleto AS nombreAutor,
    u.foto AS fotoAutor,
    c.idCategoria,
    c.nombre AS nombreCategoria,
    c.color AS colorCategoria,
    m.idMundial,
    m.anio AS anioMundial,
    m.paisSede,
    (p.likes - p.dislikes) AS popularidad,
    (SELECT COUNT(*) FROM Comentario WHERE idPublicacion = p.idPublicacion AND activo = TRUE) AS totalComentarios
FROM Publicacion p
INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
INNER JOIN Mundial m ON p.idMundial = m.idMundial;

-- VIEW 2: Estadísticas completas de usuarios
CREATE VIEW vw_estadisticas_usuario AS
SELECT 
    u.idUsuario,
    u.nombreCompleto,
    u.correoElectronico,
    u.foto,
    u.rol,
    u.fechaRegistro,
    COUNT(DISTINCT p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    SUM(CASE WHEN p.estado = 'pendiente' THEN 1 ELSE 0 END) AS publicacionesPendientes,
    SUM(CASE WHEN p.estado = 'rechazada' THEN 1 ELSE 0 END) AS publicacionesRechazadas,
    COUNT(DISTINCT co.idComentario) AS totalComentarios,
    COALESCE(SUM(p.likes), 0) AS totalLikes,
    COALESCE(SUM(p.dislikes), 0) AS totalDislikes
FROM Usuario u
LEFT JOIN Publicacion p ON u.idUsuario = p.idUsuario
LEFT JOIN Comentario co ON u.idUsuario = co.idUsuario AND co.activo = TRUE
WHERE u.activo = TRUE
GROUP BY u.idUsuario;

-- VIEW 3: Comentarios con información del autor y publicación
CREATE VIEW vw_comentarios_con_autores AS
SELECT 
    c.idComentario,
    c.contenido,
    c.fechaComentario,
    c.editado,
    c.fechaEdicion,
    u.idUsuario,
    u.nombreCompleto AS nombreAutor,
    u.foto AS fotoAutor,
    p.idPublicacion,
    p.titulo AS tituloPublicacion,
    p.estado AS estadoPublicacion
FROM Comentario c
INNER JOIN Usuario u ON c.idUsuario = u.idUsuario
INNER JOIN Publicacion p ON c.idPublicacion = p.idPublicacion
WHERE c.activo = TRUE;

-- VIEW 4: Conteo de interacciones por publicación
CREATE VIEW vw_interacciones_por_publicacion AS
SELECT 
    p.idPublicacion,
    p.titulo,
    COUNT(CASE WHEN i.tipo = 'like' THEN 1 END) AS totalLikes,
    COUNT(CASE WHEN i.tipo = 'dislike' THEN 1 END) AS totalDislikes,
    COUNT(i.idInteraccion) AS totalInteracciones,
    (COUNT(CASE WHEN i.tipo = 'like' THEN 1 END) - 
     COUNT(CASE WHEN i.tipo = 'dislike' THEN 1 END)) AS popularidad
FROM Publicacion p
LEFT JOIN Interaccion i ON p.idPublicacion = i.idPublicacion
GROUP BY p.idPublicacion;

-- VIEW 5: Publicaciones agrupadas por categoría
CREATE VIEW vw_publicaciones_por_categoria AS
SELECT 
    c.idCategoria,
    c.nombre AS nombreCategoria,
    c.color,
    COUNT(p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    SUM(CASE WHEN p.estado = 'pendiente' THEN 1 ELSE 0 END) AS publicacionesPendientes,
    COALESCE(SUM(p.likes), 0) AS totalLikes,
    COALESCE(SUM(p.dislikes), 0) AS totalDislikes
FROM Categoria c
LEFT JOIN Publicacion p ON c.idCategoria = p.idCategoria
WHERE c.activa = TRUE
GROUP BY c.idCategoria;

-- VIEW 6: Publicaciones agrupadas por mundial
CREATE VIEW vw_publicaciones_por_mundial AS
SELECT 
    m.idMundial,
    m.anio,
    m.paisSede,
    m.nombreOficial,
    COUNT(p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    COALESCE(SUM(p.likes), 0) AS totalLikes,
    COALESCE(SUM(p.dislikes), 0) AS totalDislikes
FROM Mundial m
LEFT JOIN Publicacion p ON m.idMundial = p.idMundial
GROUP BY m.idMundial;

-- VIEW 7: Usuarios activos con actividad reciente
CREATE VIEW vw_usuarios_activos AS
SELECT 
    u.idUsuario,
    u.nombreCompleto,
    u.correoElectronico,
    u.foto,
    u.rol,
    u.fechaRegistro,
    COUNT(DISTINCT p.idPublicacion) AS totalPublicaciones,
    COUNT(DISTINCT c.idComentario) AS totalComentarios,
    MAX(p.fechaPublicacion) AS ultimaPublicacion,
    MAX(c.fechaComentario) AS ultimoComentario
FROM Usuario u
LEFT JOIN Publicacion p ON u.idUsuario = p.idUsuario
LEFT JOIN Comentario c ON u.idUsuario = c.idUsuario AND c.activo = TRUE
WHERE u.activo = TRUE
GROUP BY u.idUsuario
HAVING totalPublicaciones > 0 OR totalComentarios > 0;

-- VIEW 8: Publicaciones más populares (por likes - dislikes)
CREATE VIEW vw_publicaciones_populares AS
SELECT 
    p.idPublicacion,
    p.titulo,
    p.contenido,
    p.fechaPublicacion,
    u.nombreCompleto AS nombreAutor,
    c.nombre AS nombreCategoria,
    m.anio AS anioMundial,
    p.likes,
    p.dislikes,
    (p.likes - p.dislikes) AS popularidad,
    (SELECT COUNT(*) FROM Comentario WHERE idPublicacion = p.idPublicacion AND activo = TRUE) AS totalComentarios
FROM Publicacion p
INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
INNER JOIN Mundial m ON p.idMundial = m.idMundial
WHERE p.estado = 'aprobada'
ORDER BY popularidad DESC, totalComentarios DESC;

-- =====================================================
-- PARTE 3: FUNCTIONS (Mínimo 2 requeridas)
-- =====================================================

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS fn_calcular_popularidad;
DROP FUNCTION IF EXISTS fn_verificar_interaccion_usuario;

-- FUNCTION 1: Calcular popularidad de una publicación
DELIMITER //
CREATE FUNCTION fn_calcular_popularidad(p_idPublicacion INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_popularidad INT;
    
    SELECT (likes - dislikes) INTO v_popularidad
    FROM Publicacion
    WHERE idPublicacion = p_idPublicacion;
    
    RETURN COALESCE(v_popularidad, 0);
END//
DELIMITER ;

-- FUNCTION 2: Verificar tipo de interacción de un usuario con una publicación
DELIMITER //
CREATE FUNCTION fn_verificar_interaccion_usuario(p_idUsuario INT, p_idPublicacion INT)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE v_tipo VARCHAR(10);
    
    SELECT tipo INTO v_tipo
    FROM Interaccion
    WHERE idUsuario = p_idUsuario AND idPublicacion = p_idPublicacion;
    
    RETURN COALESCE(v_tipo, 'ninguna');
END//
DELIMITER ;

-- =====================================================
-- RESUMEN
-- =====================================================
SELECT '✅ TRIGGERS CREADOS' AS componente, '4 triggers' AS cantidad
UNION ALL
SELECT '✅ VIEWS CREADAS', '8 views'
UNION ALL
SELECT '✅ FUNCTIONS CREADAS', '2 functions';

-- =====================================================
-- PRUEBAS RÁPIDAS
-- =====================================================

-- Probar función de popularidad
SELECT fn_calcular_popularidad(1) AS popularidad_publicacion_1;

-- Probar función de verificación de interacción
SELECT fn_verificar_interaccion_usuario(1, 1) AS interaccion_usuario_1_pub_1;

-- Probar vista de publicaciones populares
SELECT * FROM vw_publicaciones_populares LIMIT 5;

-- Probar vista de estadísticas de usuario
SELECT * FROM vw_estadisticas_usuario WHERE totalPublicaciones > 0;
