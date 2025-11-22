-- =====================================================
-- LIMPIAR BASE DE DATOS - BORRAR TODO
-- World Cup Hub
-- =====================================================
-- ADVERTENCIA: Este script elimina TODOS los datos
-- Úsalo solo cuando quieras resetear la BD completamente
-- =====================================================

USE BDM;

-- Desactivar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Vaciar todas las tablas en orden correcto (respetando Foreign Keys)
DELETE FROM Interaccion;
DELETE FROM reportecomentario;
DELETE FROM Comentario;
DELETE FROM Publicacion;
DELETE FROM Categoria;
DELETE FROM Mundial;
DELETE FROM Usuario;

-- Reactivar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Resetear auto_increment a 1 para todas las tablas
ALTER TABLE Usuario AUTO_INCREMENT = 1;
ALTER TABLE Categoria AUTO_INCREMENT = 1;
ALTER TABLE Mundial AUTO_INCREMENT = 1;
ALTER TABLE Publicacion AUTO_INCREMENT = 1;
ALTER TABLE Comentario AUTO_INCREMENT = 1;
ALTER TABLE Interaccion AUTO_INCREMENT = 1;
ALTER TABLE reportecomentario AUTO_INCREMENT = 1;

SELECT '✅ BASE DE DATOS LIMPIADA EXITOSAMENTE' as status;
SELECT '⚠️ TODAS LAS TABLAS ESTÁN VACÍAS' as advertencia;
SELECT 'Ahora puedes ejecutar los scripts de datos de prueba' as proxmoPaso;
