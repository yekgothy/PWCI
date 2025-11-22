-- =====================================================
-- CREAR USUARIO ADMINISTRADOR
-- World Cup Hub - Sistema de Administración
-- =====================================================
-- EJECUTAR ESTE ARCHIVO DESPUÉS DE CREAR LA BASE DE DATOS
-- Contraseña del admin: admin123
-- =====================================================

USE BDM;

-- Eliminar admin anterior si existe
DELETE FROM Usuario WHERE correoElectronico = 'admin@admin.worldcup';

-- Crear usuario administrador
INSERT INTO Usuario (
    nombreCompleto, 
    fechaNacimiento, 
    genero, 
    paisNacimiento, 
    nacionalidad, 
    correoElectronico, 
    contrasena, 
    foto,
    rol, 
    activo,
    fechaRegistro
) VALUES (
    'Admin User',
    '1990-01-01',
    'Masculino',
    'México',
    'Mexicana',
    'admin@admin.worldcup',
    '$2y$10$MlJNQOWSxsjIK.E1dAAwY.G0ZgjvYiOZlePqF3QIO8Vey4axqSqEG',  -- Contraseña: admin123 (password_hash, cost 10)
    NULL,
    'admin',
    TRUE,
    NOW()
);

-- Verificar que se creó correctamente
SELECT 
    idUsuario,
    nombreCompleto,
    correoElectronico,
    rol,
    fechaRegistro
FROM Usuario 
WHERE rol = 'admin';

SELECT '✅ Usuario administrador creado exitosamente' as status;
SELECT 'Email: admin@admin.worldcup' as info;
SELECT 'Contraseña temporal: admin123 (cámbiala después del primer login)' as warning;
