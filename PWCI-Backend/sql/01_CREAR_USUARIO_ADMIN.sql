-- =====================================================
-- CREAR USUARIO ADMINISTRADOR
-- World Cup Hub - Sistema de Administración
-- =====================================================
-- EJECUTAR ESTE ARCHIVO DESPUÉS DE CREAR LA BASE DE DATOS
-- Contraseña del admin: password1
-- =====================================================

USE BDM;

-- Eliminar admin anterior si existe
DELETE FROM Usuario WHERE correoElectronico = 'admin@worldcuphub.com';

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
    'admin@worldcuphub.com',
    '$2y$10$q3IJwvQXvHby3GhL3VEje.OudeVATracShi1JYM/nhP.uHET1ivGy',  -- Contraseña: password1
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
SELECT 'Email: admin@worldcuphub.com' as info;
SELECT 'Contraseña temporal: admin123 (cámbiala después del primer login)' as warning;
