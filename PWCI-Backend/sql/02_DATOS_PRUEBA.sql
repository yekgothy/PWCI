-- =====================================================
-- DATOS DE PRUEBA - World Cup Hub
-- Usuarios, Categorías, Mundiales y Publicaciones de ejemplo
-- =====================================================
-- EJECUTAR DESPUÉS DE: 01_CREAR_USUARIO_ADMIN.sql
-- =====================================================

USE BDM;

-- ============================================
-- PASO 1: CATEGORÍAS
-- ============================================
INSERT INTO Categoria (nombre, descripcion, color, activa) VALUES
('Noticias', 'Últimas noticias y acontecimientos del mundial', '#3B82F6', TRUE),
('Análisis', 'Análisis táctico y estratégico de partidos', '#8B5CF6', TRUE),
('Jugadas', 'Mejores jugadas y momentos destacados', '#EF4444', TRUE),
('Entrevistas', 'Declaraciones de jugadores y técnicos', '#10B981', TRUE),
('Historia', 'Momentos históricos del fútbol mundial', '#F59E0B', TRUE),
('Memes', 'Humor y memes futboleros', '#EC4899', TRUE);

-- ============================================
-- PASO 2: MUNDIALES
-- ============================================
INSERT INTO Mundial (
    anio, 
    paisSede, 
    logo, 
    nombreOficial, 
    descripcion,
    fechaInicio, 
    fechaFin, 
    numeroEquipos, 
    estado
) VALUES
(2026, 'México, USA, Canadá', NULL, 'FIFA World Cup 2026', 
 'Primera Copa del Mundo con 48 equipos y tres países anfitriones',
 '2026-06-11', '2026-07-19', 48, 'proximo'),

(2022, 'Qatar', NULL, 'FIFA World Cup Qatar 2022', 
 'Copa Mundial celebrada en invierno por primera vez',
 '2022-11-20', '2022-12-18', 32, 'finalizado'),

(2018, 'Rusia', NULL, 'FIFA World Cup Russia 2018', 
 'Copa Mundial con victoria de Francia',
 '2018-06-14', '2018-07-15', 32, 'finalizado'),

(2014, 'Brasil', NULL, 'Copa do Mundo FIFA Brasil 2014', 
 'Copa Mundial con victoria de Alemania en el Maracaná',
 '2014-06-12', '2014-07-13', 32, 'finalizado'),

(2010, 'Sudáfrica', NULL, 'FIFA World Cup South Africa 2010', 
 'Primera Copa Mundial en África, España campeón',
 '2010-06-11', '2010-07-11', 32, 'finalizado');

-- ============================================
-- PASO 3: USUARIOS DE PRUEBA
-- ============================================
-- Contraseña para todos: password123

INSERT INTO Usuario (
    nombreCompleto, 
    fechaNacimiento, 
    genero, 
    paisNacimiento, 
    nacionalidad, 
    correoElectronico, 
    contrasena, 
    rol, 
    activo
) VALUES
('Carlos Rodríguez', '1995-03-15', 'Masculino', 'México', 'Mexicana', 
 'carlos@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),

('María González', '1998-07-22', 'Femenino', 'Argentina', 'Argentina', 
 'maria@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),

('John Smith', '1992-11-08', 'Masculino', 'Estados Unidos', 'Estadounidense', 
 'john@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),

('Ana Silva', '1996-05-20', 'Femenino', 'Brasil', 'Brasileña', 
 'ana@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),

('Luis Martínez', '1994-09-12', 'Masculino', 'España', 'Española', 
 'luis@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE);

-- ============================================
-- PASO 4: PUBLICACIONES DE PRUEBA (APROBADAS)
-- ============================================

-- Obtener IDs de usuarios
SET @carlos = (SELECT idUsuario FROM Usuario WHERE correoElectronico = 'carlos@test.com');
SET @maria = (SELECT idUsuario FROM Usuario WHERE correoElectronico = 'maria@test.com');
SET @john = (SELECT idUsuario FROM Usuario WHERE correoElectronico = 'john@test.com');
SET @ana = (SELECT idUsuario FROM Usuario WHERE correoElectronico = 'ana@test.com');
SET @luis = (SELECT idUsuario FROM Usuario WHERE correoElectronico = 'luis@test.com');

-- Obtener IDs de categorías
SET @noticias = (SELECT idCategoria FROM Categoria WHERE nombre = 'Noticias');
SET @analisis = (SELECT idCategoria FROM Categoria WHERE nombre = 'Análisis');
SET @jugadas = (SELECT idCategoria FROM Categoria WHERE nombre = 'Jugadas');
SET @historia = (SELECT idCategoria FROM Categoria WHERE nombre = 'Historia');
SET @memes = (SELECT idCategoria FROM Categoria WHERE nombre = 'Memes');

-- Obtener IDs de mundiales
SET @mundial2026 = (SELECT idMundial FROM Mundial WHERE anio = 2026);
SET @mundial2022 = (SELECT idMundial FROM Mundial WHERE anio = 2022);
SET @mundial2018 = (SELECT idMundial FROM Mundial WHERE anio = 2018);

-- Publicaciones sobre Mundial 2026
INSERT INTO Publicacion (
    idUsuario, idMundial, idCategoria, 
    titulo, contenido, 
    estado, fechaAprobacion, 
    likes, dislikes, vistas
) VALUES
(@carlos, @mundial2026, @noticias,
 '¡México será sede del Mundial 2026!',
 'Increíble noticia para todos los aficionados mexicanos. Nuestro país será uno de los tres anfitriones de la Copa del Mundo 2026, junto con Estados Unidos y Canadá. ¡Será histórico!',
 'aprobada', NOW(), 15, 2, 120),

(@maria, @mundial2026, @analisis,
 'Análisis: ¿Qué equipos son favoritos para 2026?',
 'Con el formato ampliado de 48 equipos, analicemos quiénes tienen más posibilidades. Brasil, Francia y Argentina siguen siendo los grandes favoritos, pero hay sorpresas emergentes.',
 'aprobada', NOW(), 23, 1, 95),

(@john, @mundial2026, @noticias,
 'Estadios confirmados para el Mundial 2026',
 'FIFA anunció oficialmente los 16 estadios que albergarán los partidos del Mundial 2026. El Estadio Azteca en México City es uno de los más emblemáticos.',
 'aprobada', NOW(), 18, 0, 78),

-- Publicaciones sobre Mundial 2022
(@ana, @mundial2022, @historia,
 'El momento en que Messi levantó la copa',
 'Uno de los momentos más emotivos del fútbol. Lionel Messi finalmente consiguió su ansiada Copa del Mundo con Argentina en Qatar 2022. Una imagen para la eternidad.',
 'aprobada', NOW(), 45, 3, 230),

(@luis, @mundial2022, @jugadas,
 'El golazo de Mbappé en la final',
 'Increíble jugada individual de Kylian Mbappé en la final del Mundial. Aunque Francia perdió en penales, este gol quedará en la historia como uno de los mejores de una final.',
 'aprobada', NOW(), 38, 2, 187),

(@carlos, @mundial2022, @memes,
 'Los mejores memes del Mundial Qatar 2022',
 'Recopilación de los memes más divertidos del mundial. Desde la celebración de Argentina hasta las reacciones de los aficionados. ¡No te los pierdas!',
 'aprobada', NOW(), 56, 5, 310),

-- Publicaciones sobre Mundial 2018
(@maria, @mundial2018, @historia,
 'El día que Croacia llegó a la final',
 'Nadie esperaba que Croacia llegara tan lejos en Rusia 2018. Su épico camino a la final es una de las mejores historias del fútbol moderno.',
 'aprobada', NOW(), 29, 1, 145),

(@john, @mundial2018, @jugadas,
 'El golazo de Pavard contra Argentina',
 'Benjamin Pavard anotó uno de los mejores goles del Mundial 2018 con un espectacular derechazo contra Argentina. Belleza pura.',
 'aprobada', NOW(), 34, 2, 165),

-- Más publicaciones
(@ana, @mundial2026, @analisis,
 '¿Cómo afectará el clima a los equipos en 2026?',
 'Con sedes en tres países diferentes, las condiciones climáticas variarán mucho. Esto podría ser un factor decisivo en el rendimiento de los equipos.',
 'aprobada', NOW(), 12, 0, 67),

(@luis, @mundial2022, @noticias,
 'Estadísticas sorprendentes del Mundial Qatar',
 'Datos curiosos y récords batidos en el Mundial 2022. Desde el jugador más joven hasta los goles más rápidos.',
 'aprobada', NOW(), 21, 1, 103);

-- ============================================
-- PASO 5: PUBLICACIONES PENDIENTES (para que el admin las apruebe)
-- ============================================
INSERT INTO Publicacion (
    idUsuario, idMundial, idCategoria, 
    titulo, contenido, 
    estado,
    likes, dislikes, vistas
) VALUES
(@carlos, @mundial2026, @noticias,
 'Nuevos rumores sobre el fixture del Mundial 2026',
 'Según fuentes cercanas a FIFA, el fixture podría tener un formato innovador para aprovechar las tres sedes.',
 'pendiente', 0, 0, 0),

(@maria, @mundial2022, @analisis,
 'Táctica: El 4-3-3 de la Argentina campeona',
 'Análisis detallado de la táctica utilizada por Scaloni en el Mundial 2022.',
 'pendiente', 0, 0, 0);

-- ============================================
-- PASO 6: COMENTARIOS DE EJEMPLO
-- ============================================
INSERT INTO Comentario (idPublicacion, idUsuario, contenido) VALUES
(1, @maria, '¡Qué emoción! No puedo esperar para ver a México como anfitrión.'),
(1, @john, 'Ojalá mi país también organice buenos partidos. ¡Va a ser épico!'),
(4, @carlos, 'Ese momento me hizo llorar de emoción. Messi se lo merecía.'),
(4, @luis, 'Sin duda el mejor final de Copa del Mundo que he visto.'),
(6, @ana, 'JAJAJA los memes estuvieron buenísimos 😂'),
(6, @john, 'El de la celebración de Messi con la copa es mi favorito');

-- ============================================
-- PASO 7: INTERACCIONES (LIKES/DISLIKES)
-- ============================================
INSERT INTO Interaccion (idUsuario, idPublicacion, tipo) VALUES
-- Likes de varios usuarios a diferentes publicaciones
(@maria, 1, 'like'),
(@john, 1, 'like'),
(@ana, 1, 'like'),
(@luis, 1, 'like'),
(@carlos, 4, 'like'),
(@maria, 4, 'like'),
(@john, 4, 'like'),
(@ana, 6, 'like'),
(@luis, 6, 'like'),
(@carlos, 6, 'like'),
-- Algunos dislikes
(@luis, 2, 'dislike'),
(@ana, 5, 'dislike');

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT '✅ DATOS DE PRUEBA INSERTADOS CORRECTAMENTE' as status;

SELECT 'Categorías creadas:' as info, COUNT(*) as total FROM Categoria;
SELECT 'Mundiales creados:' as info, COUNT(*) as total FROM Mundial;
SELECT 'Usuarios de prueba:' as info, COUNT(*) as total FROM Usuario WHERE correoElectronico LIKE '%@test.com';
SELECT 'Publicaciones aprobadas:' as info, COUNT(*) as total FROM Publicacion WHERE estado = 'aprobada';
SELECT 'Publicaciones pendientes:' as info, COUNT(*) as total FROM Publicacion WHERE estado = 'pendiente';
SELECT 'Comentarios:' as info, COUNT(*) as total FROM Comentario;
SELECT 'Interacciones:' as info, COUNT(*) as total FROM Interaccion;

-- NOTA: Contraseña de todos los usuarios de prueba: password123
-- Para login usar: carlos@test.com, maria@test.com, john@test.com, etc.
