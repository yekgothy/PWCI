-- =====================================================
-- TRIGGERS, VIEWS Y FUNCTIONS - WORLD CUP HUB
-- Exportado desde la base de datos funcional actual
-- Requisitos Académicos: 6 Triggers, 16 Views, 4 Functions
-- =====================================================

USE BDM;

-- =====================================================
-- PARTE 1: TRIGGERS (6 en total)
-- =====================================================

-- TRIGGER 1: Actualizar likes/dislikes al insertar interacción
DROP TRIGGER IF EXISTS trg_actualizar_likes_dislikes_insert;
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

-- TRIGGER 2: Actualizar likes/dislikes al actualizar interacción
DROP TRIGGER IF EXISTS trg_actualizar_likes_dislikes_update;
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

-- TRIGGER 3: Actualizar likes/dislikes al eliminar interacción
DROP TRIGGER IF EXISTS trg_actualizar_likes_dislikes_delete;
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

-- TRIGGER 4: Validar fechas del mundial
DROP TRIGGER IF EXISTS trg_validar_fechas_mundial;
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

-- TRIGGER 5: Actualizar estadísticas al crear publicación
DROP TRIGGER IF EXISTS trg_actualizar_estadisticas_usuario;
DELIMITER //
CREATE TRIGGER trg_actualizar_estadisticas_usuario
AFTER INSERT ON Publicacion
FOR EACH ROW
BEGIN
    INSERT INTO EstadisticaUsuario (
        idUsuario, 
        publicaciones, 
        comentarios, 
        interacciones
    )
    VALUES (
        NEW.idUsuario,
        1,
        0,
        0
    )
    ON DUPLICATE KEY UPDATE
        publicaciones = publicaciones + 1;
END//
DELIMITER ;

-- TRIGGER 6: Registrar fecha de aprobación
DROP TRIGGER IF EXISTS trg_registrar_fecha_aprobacion;
DELIMITER //
CREATE TRIGGER trg_registrar_fecha_aprobacion
BEFORE UPDATE ON Publicacion
FOR EACH ROW
BEGIN
    IF NEW.estado = 'aprobada' AND OLD.estado != 'aprobada' THEN
        SET NEW.fechaAprobacion = NOW();
    END IF;
    
    IF NEW.estado != 'aprobada' AND OLD.estado = 'aprobada' THEN
        SET NEW.fechaAprobacion = NULL;
    END IF;
END//
DELIMITER ;

SELECT '✅ 6 TRIGGERS CREADOS EXITOSAMENTE' as status;

-- =====================================================
-- PARTE 2: FUNCTIONS (4 en total)
-- =====================================================

-- FUNCTION 1: Calcular popularidad (likes - dislikes)
DROP FUNCTION IF EXISTS fn_calcular_popularidad;
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

-- FUNCTION 2: Calcular popularidad compleja (con comentarios)
DROP FUNCTION IF EXISTS fn_calcular_popularidad_post;
DELIMITER //
CREATE FUNCTION fn_calcular_popularidad_post(p_idPublicacion INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_likes INT DEFAULT 0;
    DECLARE v_dislikes INT DEFAULT 0;
    DECLARE v_comentarios INT DEFAULT 0;
    DECLARE v_score INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_likes
    FROM Interaccion
    WHERE idPublicacion = p_idPublicacion AND tipo = 'like';
    
    SELECT COUNT(*) INTO v_dislikes
    FROM Interaccion
    WHERE idPublicacion = p_idPublicacion AND tipo = 'dislike';
    
    SELECT COUNT(*) INTO v_comentarios
    FROM Comentario
    WHERE idPublicacion = p_idPublicacion;
    
    SET v_score = v_likes - v_dislikes + (v_comentarios * 2);
    
    RETURN v_score;
END//
DELIMITER ;

-- FUNCTION 3: Validar formato de email
DROP FUNCTION IF EXISTS fn_validar_email;
DELIMITER //
CREATE FUNCTION fn_validar_email(p_email VARCHAR(100)) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    RETURN p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$';
END//
DELIMITER ;

-- FUNCTION 4: Verificar interacción de usuario
DROP FUNCTION IF EXISTS fn_verificar_interaccion_usuario;
DELIMITER //
CREATE FUNCTION fn_verificar_interaccion_usuario(p_idUsuario INT, p_idPublicacion INT) 
RETURNS VARCHAR(10)
READS SQL DATA
BEGIN
    DECLARE v_tipo VARCHAR(10);
    
    SELECT tipo INTO v_tipo
    FROM Interaccion
    WHERE idUsuario = p_idUsuario AND idPublicacion = p_idPublicacion
    LIMIT 1;
    
    RETURN COALESCE(v_tipo, 'ninguna');
END//
DELIMITER ;

SELECT '✅ 4 FUNCTIONS CREADAS EXITOSAMENTE' as status;

-- =====================================================
-- PARTE 3: VIEWS (16 en total)
-- =====================================================

-- VIEW 1: Categorías populares
DROP VIEW IF EXISTS v_categorias_populares;
CREATE VIEW v_categorias_populares AS
SELECT 
    c.idCategoria,
    c.nombre AS nombreCategoria,
    c.descripcion,
    COUNT(p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    AVG((SELECT COUNT(*) FROM Interaccion i WHERE i.idPublicacion = p.idPublicacion AND i.tipo = 'like')) AS promedioLikes,
    (SELECT COUNT(*) FROM Comentario com 
     JOIN Publicacion pub ON com.idPublicacion = pub.idPublicacion 
     WHERE pub.idCategoria = c.idCategoria) AS totalComentarios
FROM Categoria c
LEFT JOIN Publicacion p ON c.idCategoria = p.idCategoria
GROUP BY c.idCategoria, c.nombre, c.descripcion
ORDER BY COUNT(p.idPublicacion) DESC;

-- VIEW 2: Comentarios completos con reportes
DROP VIEW IF EXISTS v_comentarios_completos;
CREATE VIEW v_comentarios_completos AS
SELECT 
    c.idComentario,
    c.contenido,
    c.fechaComentario,
    c.idPublicacion,
    p.titulo AS tituloPublicacion,
    c.idUsuario,
    u.nombreCompleto,
    u.foto AS fotoUsuario,
    (SELECT COUNT(*) FROM ReporteComentario rc WHERE rc.idComentario = c.idComentario) AS totalReportes
FROM Comentario c
JOIN Usuario u ON c.idUsuario = u.idUsuario
JOIN Publicacion p ON c.idPublicacion = p.idPublicacion
ORDER BY c.fechaComentario DESC;

-- VIEW 3: Estadísticas de usuario completas
DROP VIEW IF EXISTS v_estadisticas_usuario;
CREATE VIEW v_estadisticas_usuario AS
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
    (SELECT COUNT(*) FROM Interaccion i 
     JOIN Publicacion pub ON i.idPublicacion = pub.idPublicacion 
     WHERE pub.idUsuario = u.idUsuario AND i.tipo = 'like') AS totalLikesRecibidos,
    (SELECT COUNT(*) FROM Comentario c WHERE c.idUsuario = u.idUsuario) AS totalComentariosHechos,
    (SELECT COUNT(*) FROM Comentario c 
     JOIN Publicacion pub ON c.idPublicacion = pub.idPublicacion 
     WHERE pub.idUsuario = u.idUsuario) AS totalComentariosRecibidos
FROM Usuario u
LEFT JOIN Publicacion p ON u.idUsuario = p.idUsuario
WHERE u.activo = TRUE
GROUP BY u.idUsuario, u.nombreCompleto, u.correoElectronico, u.foto, u.rol, u.fechaRegistro;

-- VIEW 4: Mundiales con publicaciones
DROP VIEW IF EXISTS v_mundiales_con_publicaciones;
CREATE VIEW v_mundiales_con_publicaciones AS
SELECT 
    m.idMundial,
    m.anio,
    m.paisSede,
    COUNT(p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    (SELECT COUNT(*) FROM Interaccion i 
     JOIN Publicacion pub ON i.idPublicacion = pub.idPublicacion 
     WHERE pub.idMundial = m.idMundial AND i.tipo = 'like') AS totalLikes,
    (SELECT COUNT(*) FROM Comentario c 
     JOIN Publicacion pub ON c.idPublicacion = pub.idPublicacion 
     WHERE pub.idMundial = m.idMundial) AS totalComentarios
FROM Mundial m
LEFT JOIN Publicacion p ON m.idMundial = p.idMundial
GROUP BY m.idMundial, m.anio, m.paisSede
ORDER BY m.anio DESC;

-- VIEW 5: Publicaciones completas (base)
DROP VIEW IF EXISTS v_publicaciones_completas;
CREATE VIEW v_publicaciones_completas AS
SELECT 
    p.idPublicacion,
    p.titulo,
    p.contenido,
    p.urlMultimedia,
    p.fechaPublicacion,
    p.estado,
    p.fechaAprobacion,
    p.idUsuario,
    u.nombreCompleto AS nombreAutor,
    u.correoElectronico AS emailAutor,
    u.foto AS fotoAutor,
    p.idCategoria,
    c.nombre AS nombreCategoria,
    c.descripcion AS descripcionCategoria,
    p.idMundial,
    m.anio,
    m.paisSede,
    (SELECT COUNT(*) FROM Interaccion i WHERE i.idPublicacion = p.idPublicacion AND i.tipo = 'like') AS totalLikes,
    (SELECT COUNT(*) FROM Interaccion i WHERE i.idPublicacion = p.idPublicacion AND i.tipo = 'dislike') AS totalDislikes,
    (SELECT COUNT(*) FROM Comentario com WHERE com.idPublicacion = p.idPublicacion) AS totalComentarios
FROM Publicacion p
JOIN Usuario u ON p.idUsuario = u.idUsuario
LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
LEFT JOIN Mundial m ON p.idMundial = m.idMundial;

-- VIEW 6: Publicaciones aprobadas
DROP VIEW IF EXISTS v_publicaciones_aprobadas;
CREATE VIEW v_publicaciones_aprobadas AS
SELECT 
    idPublicacion,
    titulo,
    contenido,
    urlMultimedia AS urlImagen,
    fechaPublicacion AS fechaCreacion,
    nombreAutor,
    fotoAutor,
    nombreCategoria,
    anio,
    paisSede,
    totalLikes,
    totalDislikes,
    totalComentarios,
    (totalLikes - totalDislikes + (totalComentarios * 2)) AS scorePopularidad
FROM v_publicaciones_completas
WHERE estado = 'aprobada'
ORDER BY fechaPublicacion DESC;

-- VIEW 7: Publicaciones pendientes
DROP VIEW IF EXISTS v_publicaciones_pendientes;
CREATE VIEW v_publicaciones_pendientes AS
SELECT 
    idPublicacion,
    titulo,
    contenido,
    urlMultimedia AS urlImagen,
    fechaPublicacion,
    nombreAutor,
    emailAutor,
    fotoAutor,
    nombreCategoria,
    anio AS anioMundial,
    paisSede,
    totalComentarios,
    DATEDIFF(NOW(), fechaPublicacion) AS diasPendiente
FROM v_publicaciones_completas
WHERE estado = 'pendiente'
ORDER BY fechaPublicacion;

-- VIEW 8: Usuarios activos
DROP VIEW IF EXISTS v_usuarios_activos;
CREATE VIEW v_usuarios_activos AS
SELECT 
    u.idUsuario,
    u.nombreCompleto,
    u.correoElectronico,
    u.foto,
    u.rol,
    u.fechaRegistro,
    (SELECT MAX(p.fechaPublicacion) FROM Publicacion p WHERE p.idUsuario = u.idUsuario) AS ultimaPublicacion,
    (SELECT MAX(c.fechaComentario) FROM Comentario c WHERE c.idUsuario = u.idUsuario) AS ultimoComentario,
    (SELECT MAX(i.fecha) FROM Interaccion i WHERE i.idUsuario = u.idUsuario) AS ultimaInteraccion,
    GREATEST(
        COALESCE((SELECT MAX(p.fechaPublicacion) FROM Publicacion p WHERE p.idUsuario = u.idUsuario), '2000-01-01'),
        COALESCE((SELECT MAX(c.fechaComentario) FROM Comentario c WHERE c.idUsuario = u.idUsuario), '2000-01-01'),
        COALESCE((SELECT MAX(i.fecha) FROM Interaccion i WHERE i.idUsuario = u.idUsuario), '2000-01-01')
    ) AS ultimaActividad,
    (SELECT COUNT(*) FROM Publicacion p WHERE p.idUsuario = u.idUsuario) AS totalPublicaciones
FROM Usuario u
WHERE u.activo = TRUE
ORDER BY ultimaActividad DESC;

-- VIEW 9-16: Vistas adicionales con prefijo vw_
DROP VIEW IF EXISTS vw_comentarios_con_autores;
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
JOIN Usuario u ON c.idUsuario = u.idUsuario
JOIN Publicacion p ON c.idPublicacion = p.idPublicacion
WHERE c.activo = TRUE;

DROP VIEW IF EXISTS vw_estadisticas_usuario;
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

DROP VIEW IF EXISTS vw_interacciones_por_publicacion;
CREATE VIEW vw_interacciones_por_publicacion AS
SELECT 
    p.idPublicacion,
    p.titulo,
    COUNT(CASE WHEN i.tipo = 'like' THEN 1 END) AS totalLikes,
    COUNT(CASE WHEN i.tipo = 'dislike' THEN 1 END) AS totalDislikes,
    COUNT(i.idInteraccion) AS totalInteracciones,
    COUNT(CASE WHEN i.tipo = 'like' THEN 1 END) - COUNT(CASE WHEN i.tipo = 'dislike' THEN 1 END) AS popularidad
FROM Publicacion p
LEFT JOIN Interaccion i ON p.idPublicacion = i.idPublicacion
GROUP BY p.idPublicacion;

DROP VIEW IF EXISTS vw_publicaciones_completas;
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
JOIN Usuario u ON p.idUsuario = u.idUsuario
JOIN Categoria c ON p.idCategoria = c.idCategoria
JOIN Mundial m ON p.idMundial = m.idMundial;

DROP VIEW IF EXISTS vw_publicaciones_populares;
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
JOIN Usuario u ON p.idUsuario = u.idUsuario
JOIN Categoria c ON p.idCategoria = c.idCategoria
JOIN Mundial m ON p.idMundial = m.idMundial
WHERE p.estado = 'aprobada'
ORDER BY popularidad DESC, totalComentarios DESC;

DROP VIEW IF EXISTS vw_publicaciones_por_categoria;
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

DROP VIEW IF EXISTS vw_publicaciones_por_mundial;
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

DROP VIEW IF EXISTS vw_usuarios_activos;
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

SELECT '✅ 16 VIEWS CREADAS EXITOSAMENTE' as status;
SELECT '✅ TOTAL: 6 Triggers + 4 Functions + 16 Views' as resumen;
