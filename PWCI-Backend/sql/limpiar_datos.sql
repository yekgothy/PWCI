-- ================================================
-- SCRIPT DE LIMPIEZA COMPLETA
-- ================================================
-- Este script elimina todos los datos de las tablas
-- respetando las dependencias de foreign keys

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar reportes primero (depende de Comentario)
DELETE FROM ReporteComentario;

-- Eliminar comentarios (depende de Publicacion y Usuario)
DELETE FROM Comentario;

-- Eliminar interacciones (depende de Publicacion y Usuario)
DELETE FROM Interaccion;

-- Eliminar publicaciones (depende de Usuario, Mundial, Categoria)
DELETE FROM Publicacion;

-- Eliminar estadísticas de usuario (depende de Usuario)
DELETE FROM EstadisticaUsuario;

-- Eliminar usuarios
DELETE FROM Usuario;

-- Eliminar categorías
DELETE FROM Categoria;

-- Eliminar mundiales
DELETE FROM Mundial;

-- Reiniciar los AUTO_INCREMENT a 1
ALTER TABLE Usuario AUTO_INCREMENT = 1;
ALTER TABLE Categoria AUTO_INCREMENT = 1;
ALTER TABLE Mundial AUTO_INCREMENT = 1;
ALTER TABLE Publicacion AUTO_INCREMENT = 1;
ALTER TABLE Comentario AUTO_INCREMENT = 1;
ALTER TABLE Interaccion AUTO_INCREMENT = 1;
ALTER TABLE EstadisticaUsuario AUTO_INCREMENT = 1;
ALTER TABLE ReporteComentario AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que todas las tablas estén vacías
SELECT 'Usuario' as Tabla, COUNT(*) as Registros FROM Usuario
UNION ALL
SELECT 'Publicacion', COUNT(*) FROM Publicacion
UNION ALL
SELECT 'Comentario', COUNT(*) FROM Comentario
UNION ALL
SELECT 'Interaccion', COUNT(*) FROM Interaccion
UNION ALL
SELECT 'Categoria', COUNT(*) FROM Categoria
UNION ALL
SELECT 'Mundial', COUNT(*) FROM Mundial
UNION ALL
SELECT 'EstadisticaUsuario', COUNT(*) FROM EstadisticaUsuario
UNION ALL
SELECT 'ReporteComentario', COUNT(*) FROM ReporteComentario;
