-- ============================================
-- VIEWS, FUNCTIONS Y TRIGGERS - World Cup Hub
-- ============================================
-- Este archivo debe ejecutarse DESPUÉS de database.sql
-- y ANTES de insertar_datos_prueba.sql
-- ============================================

USE BDM;

-- ============================================
-- SECCIÓN 1: ELIMINAR OBJETOS EXISTENTES
-- ============================================

-- Eliminar triggers si existen
DROP TRIGGER IF EXISTS trg_actualizar_estadisticas_usuario;
DROP TRIGGER IF EXISTS trg_registrar_fecha_aprobacion;

-- Eliminar functions si existen
DROP FUNCTION IF EXISTS fn_calcular_popularidad_post;
DROP FUNCTION IF EXISTS fn_validar_email;

-- Eliminar views si existen
DROP VIEW IF EXISTS v_publicaciones_completas;
DROP VIEW IF EXISTS v_publicaciones_aprobadas;
DROP VIEW IF EXISTS v_comentarios_completos;
DROP VIEW IF EXISTS v_estadisticas_usuario;
DROP VIEW IF EXISTS v_categorias_populares;
DROP VIEW IF EXISTS v_mundiales_con_publicaciones;
DROP VIEW IF EXISTS v_publicaciones_pendientes;
DROP VIEW IF EXISTS v_usuarios_activos;

-- ============================================
-- SECCIÓN 2: VIEWS (8 vistas)
-- ============================================

-- VIEW 1: Publicaciones completas con toda la información relacionada
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
    -- Contar likes
    (SELECT COUNT(*) FROM Interaccion i 
     WHERE i.idPublicacion = p.idPublicacion AND i.tipo = 'like') AS totalLikes,
    -- Contar dislikes
    (SELECT COUNT(*) FROM Interaccion i 
     WHERE i.idPublicacion = p.idPublicacion AND i.tipo = 'dislike') AS totalDislikes,
    -- Contar comentarios
    (SELECT COUNT(*) FROM Comentario com 
     WHERE com.idPublicacion = p.idPublicacion) AS totalComentarios
FROM Publicacion p
INNER JOIN Usuario u ON p.idUsuario = u.idUsuario
LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
LEFT JOIN Mundial m ON p.idMundial = m.idMundial;

-- VIEW 2: Publicaciones aprobadas para el feed público
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

-- VIEW 3: Comentarios completos con información del usuario
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
    -- Verificar si el comentario tiene reportes
    (SELECT COUNT(*) FROM ReporteComentario rc 
     WHERE rc.idComentario = c.idComentario) AS totalReportes
FROM Comentario c
INNER JOIN Usuario u ON c.idUsuario = u.idUsuario
INNER JOIN Publicacion p ON c.idPublicacion = p.idPublicacion
ORDER BY c.fechaComentario DESC;

-- VIEW 4: Estadísticas por usuario
CREATE VIEW v_estadisticas_usuario AS
SELECT 
    u.idUsuario,
    u.nombreCompleto,
    u.correoElectronico,
    u.foto,
    u.rol,
    u.fechaRegistro,
    -- Total de publicaciones
    COUNT(DISTINCT p.idPublicacion) AS totalPublicaciones,
    -- Publicaciones aprobadas
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    -- Publicaciones pendientes
    SUM(CASE WHEN p.estado = 'pendiente' THEN 1 ELSE 0 END) AS publicacionesPendientes,
    -- Publicaciones rechazadas
    SUM(CASE WHEN p.estado = 'rechazada' THEN 1 ELSE 0 END) AS publicacionesRechazadas,
    -- Total de likes recibidos en todas sus publicaciones
    (SELECT COUNT(*) FROM Interaccion i 
     INNER JOIN Publicacion pub ON i.idPublicacion = pub.idPublicacion
     WHERE pub.idUsuario = u.idUsuario AND i.tipo = 'like') AS totalLikesRecibidos,
    -- Total de comentarios hechos por el usuario
    (SELECT COUNT(*) FROM Comentario c 
     WHERE c.idUsuario = u.idUsuario) AS totalComentariosHechos,
    -- Total de comentarios recibidos en sus publicaciones
    (SELECT COUNT(*) FROM Comentario c 
     INNER JOIN Publicacion pub ON c.idPublicacion = pub.idPublicacion
     WHERE pub.idUsuario = u.idUsuario) AS totalComentariosRecibidos
FROM Usuario u
LEFT JOIN Publicacion p ON u.idUsuario = p.idUsuario
WHERE u.activo = TRUE
GROUP BY u.idUsuario, u.nombreCompleto, u.correoElectronico, u.foto, u.rol, u.fechaRegistro;

-- VIEW 5: Categorías populares con cantidad de publicaciones
CREATE VIEW v_categorias_populares AS
SELECT 
    c.idCategoria,
    c.nombre AS nombreCategoria,
    c.descripcion,
    COUNT(p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    -- Promedio de likes por publicación en esta categoría
    AVG((SELECT COUNT(*) FROM Interaccion i 
         WHERE i.idPublicacion = p.idPublicacion AND i.tipo = 'like')) AS promedioLikes,
    -- Total de comentarios en publicaciones de esta categoría
    (SELECT COUNT(*) FROM Comentario com 
     INNER JOIN Publicacion pub ON com.idPublicacion = pub.idPublicacion
     WHERE pub.idCategoria = c.idCategoria) AS totalComentarios
FROM Categoria c
LEFT JOIN Publicacion p ON c.idCategoria = p.idCategoria
GROUP BY c.idCategoria, c.nombre, c.descripcion
ORDER BY totalPublicaciones DESC;

-- VIEW 6: Mundiales con cantidad de publicaciones
CREATE VIEW v_mundiales_con_publicaciones AS
SELECT 
    m.idMundial,
    m.anio,
    m.paisSede,
    COUNT(p.idPublicacion) AS totalPublicaciones,
    SUM(CASE WHEN p.estado = 'aprobada' THEN 1 ELSE 0 END) AS publicacionesAprobadas,
    -- Total de likes en publicaciones de este mundial
    (SELECT COUNT(*) FROM Interaccion i 
     INNER JOIN Publicacion pub ON i.idPublicacion = pub.idPublicacion
     WHERE pub.idMundial = m.idMundial AND i.tipo = 'like') AS totalLikes,
    -- Total de comentarios en publicaciones de este mundial
    (SELECT COUNT(*) FROM Comentario c 
     INNER JOIN Publicacion pub ON c.idPublicacion = pub.idPublicacion
     WHERE pub.idMundial = m.idMundial) AS totalComentarios
FROM Mundial m
LEFT JOIN Publicacion p ON m.idMundial = p.idMundial
GROUP BY m.idMundial, m.anio, m.paisSede
ORDER BY m.anio DESC;

-- VIEW 7: Publicaciones pendientes de aprobación (para admin)
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
ORDER BY fechaPublicacion ASC;

-- VIEW 8: Usuarios activos con actividad reciente
CREATE VIEW v_usuarios_activos AS
SELECT 
    u.idUsuario,
    u.nombreCompleto,
    u.correoElectronico,
    u.foto,
    u.rol,
    u.fechaRegistro,
    -- Última publicación
    (SELECT MAX(p.fechaPublicacion) FROM Publicacion p 
     WHERE p.idUsuario = u.idUsuario) AS ultimaPublicacion,
    -- Último comentario
    (SELECT MAX(c.fechaComentario) FROM Comentario c 
     WHERE c.idUsuario = u.idUsuario) AS ultimoComentario,
    -- Última interacción
    (SELECT MAX(i.fecha) FROM Interaccion i 
     WHERE i.idUsuario = u.idUsuario) AS ultimaInteraccion,
    -- Determinar última actividad
    GREATEST(
        COALESCE((SELECT MAX(p.fechaPublicacion) FROM Publicacion p WHERE p.idUsuario = u.idUsuario), '2000-01-01'),
        COALESCE((SELECT MAX(c.fechaComentario) FROM Comentario c WHERE c.idUsuario = u.idUsuario), '2000-01-01'),
        COALESCE((SELECT MAX(i.fecha) FROM Interaccion i WHERE i.idUsuario = u.idUsuario), '2000-01-01')
    ) AS ultimaActividad,
    -- Total de publicaciones
    (SELECT COUNT(*) FROM Publicacion p WHERE p.idUsuario = u.idUsuario) AS totalPublicaciones
FROM Usuario u
WHERE u.activo = TRUE
ORDER BY ultimaActividad DESC;

-- ============================================
-- SECCIÓN 3: FUNCTIONS (2 funciones)
-- ============================================

DELIMITER //

-- FUNCTION 1: Calcular popularidad de un post
-- Retorna un score basado en likes, dislikes y comentarios
CREATE FUNCTION fn_calcular_popularidad_post(
    p_idPublicacion INT
) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_likes INT DEFAULT 0;
    DECLARE v_dislikes INT DEFAULT 0;
    DECLARE v_comentarios INT DEFAULT 0;
    DECLARE v_score INT DEFAULT 0;
    
    -- Contar likes
    SELECT COUNT(*) INTO v_likes
    FROM Interaccion
    WHERE idPublicacion = p_idPublicacion AND tipo = 'like';
    
    -- Contar dislikes
    SELECT COUNT(*) INTO v_dislikes
    FROM Interaccion
    WHERE idPublicacion = p_idPublicacion AND tipo = 'dislike';
    
    -- Contar comentarios
    SELECT COUNT(*) INTO v_comentarios
    FROM Comentario
    WHERE idPublicacion = p_idPublicacion;
    
    -- Calcular score: likes positivo, dislikes negativo, comentarios x2
    SET v_score = v_likes - v_dislikes + (v_comentarios * 2);
    
    RETURN v_score;
END //

-- FUNCTION 2: Validar formato de email
-- Retorna 1 si el email es válido, 0 si no
CREATE FUNCTION fn_validar_email(
    p_email VARCHAR(100)
) RETURNS BOOLEAN
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_valido BOOLEAN DEFAULT FALSE;
    
    -- Validar que contenga @ y punto después del @
    IF p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SET v_valido = TRUE;
    END IF;
    
    RETURN v_valido;
END //

DELIMITER ;

-- ============================================
-- SECCIÓN 4: TRIGGERS (2 triggers)
-- ============================================

DELIMITER //

-- TRIGGER 1: Actualizar estadísticas cuando se crea una publicación
-- Se activa DESPUÉS de insertar en la tabla Publicacion
CREATE TRIGGER trg_actualizar_estadisticas_usuario
AFTER INSERT ON Publicacion
FOR EACH ROW
BEGIN
    -- Actualizar o crear registro en EstadisticaUsuario
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
END //

-- TRIGGER 2: Registrar fecha de aprobación automáticamente
-- Se activa ANTES de actualizar el estado de una publicación
CREATE TRIGGER trg_registrar_fecha_aprobacion
BEFORE UPDATE ON Publicacion
FOR EACH ROW
BEGIN
    -- Si el estado cambia a 'aprobada', registrar la fecha
    IF NEW.estado = 'aprobada' AND OLD.estado != 'aprobada' THEN
        SET NEW.fechaAprobacion = NOW();
    END IF;
    
    -- Si el estado cambia de 'aprobada' a otro, limpiar la fecha
    IF NEW.estado != 'aprobada' AND OLD.estado = 'aprobada' THEN
        SET NEW.fechaAprobacion = NULL;
    END IF;
END //

DELIMITER ;

-- ============================================
-- FIN DEL ARCHIVO
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'VIEWS creadas:' AS mensaje;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

SELECT 'FUNCTIONS creadas:' AS mensaje;
SHOW FUNCTION STATUS WHERE Db = 'BDM';

SELECT 'TRIGGERS creados:' AS mensaje;
SHOW TRIGGERS FROM BDM;
