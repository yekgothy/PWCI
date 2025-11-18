-- ============================================
-- DATOS DE PRUEBA PARA WORLD CUP HUB
-- ============================================

-- Usar la base de datos correcta
USE BDM;

-- IMPORTANTE: Primero limpiamos datos de prueba anteriores
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM InteraccionPublicacion WHERE idPublicacion IN (SELECT idPublicacion FROM Publicacion WHERE idUsuario IN (SELECT idUsuario FROM Usuario WHERE correoElectronico LIKE '%@test.com'));
DELETE FROM Comentario WHERE idPublicacion IN (SELECT idPublicacion FROM Publicacion WHERE idUsuario IN (SELECT idUsuario FROM Usuario WHERE correoElectronico LIKE '%@test.com'));
DELETE FROM Publicacion WHERE idUsuario IN (SELECT idUsuario FROM Usuario WHERE correoElectronico LIKE '%@test.com');
DELETE FROM EstadisticaUsuario WHERE idUsuario IN (SELECT idUsuario FROM Usuario WHERE correoElectronico LIKE '%@test.com');
DELETE FROM Usuario WHERE correoElectronico LIKE '%@test.com';
DELETE FROM Categoria WHERE nombre IN ('Noticias', 'Debate', 'Historia', 'Predicciones', 'Memes');
DELETE FROM Mundial WHERE anio IN (2026, 2022);

SET FOREIGN_KEY_CHECKS = 1;

-- 1. CREAR USUARIOS DE PRUEBA
INSERT INTO Usuario (nombreCompleto, fechaNacimiento, genero, paisNacimiento, nacionalidad, correoElectronico, contrasena, rol, activo) 
VALUES 
('Carlos Rodríguez', '1995-03-15', 'Masculino', 'México', 'Mexicana', 'carlos@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),
('María González', '1998-07-22', 'Femenino', 'Argentina', 'Argentina', 'maria@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),
('John Smith', '1992-11-08', 'Masculino', 'Estados Unidos', 'Estadounidense', 'john@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE),
('Admin User', '1990-01-01', 'Masculino', 'México', 'Mexicana', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);

-- Contraseña para todos: password

-- 2. CREAR ESTADÍSTICAS PARA USUARIOS
INSERT INTO EstadisticaUsuario (idUsuario) 
SELECT idUsuario FROM Usuario WHERE correoElectronico IN ('carlos@test.com', 'maria@test.com', 'john@test.com', 'admin@test.com');

-- 3. CREAR CATEGORÍAS
INSERT INTO Categoria (nombre, descripcion, icono, activa) 
VALUES 
('Noticias', 'Últimas noticias del mundial', '📰', TRUE),
('Debate', 'Debates y opiniones', '💬', TRUE),
('Historia', 'Momentos históricos', '🏆', TRUE),
('Predicciones', 'Pronósticos y apuestas', '🔮', TRUE),
('Memes', 'Humor futbolero', '😂', TRUE);

-- 4. CREAR MUNDIALES
INSERT INTO Mundial (anio, paisSede, campeon, subcampeon, tercerLugar, estadisticas, activo) 
VALUES 
(2026, 'México, USA, Canadá', NULL, NULL, NULL, '{"equipos": 48, "partidos": 104, "sedes": 16}', TRUE),
(2022, 'Qatar', 'Argentina', 'Francia', 'Croacia', '{"equipos": 32, "partidos": 64}', TRUE);

-- 5. CREAR PUBLICACIONES DE PRUEBA
INSERT INTO Publicacion (idUsuario, titulo, contenido, urlImagen, idCategoria, idMundial, estado, fechaCreacion) 
VALUES 
(1, 'México 2026: Estadio Azteca confirmado como sede', 
'¡Gran noticia! El mítico Estadio Azteca será una de las principales sedes del Mundial 2026. Este estadio ha sido testigo de dos finales de Copa del Mundo (1970 y 1986) y ahora volverá a hacer historia. ¿Qué les parece?', 
'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800', 
1, 1, 'aprobada', NOW() - INTERVAL 2 HOUR),

(2, '¿Quién ganará el Mundial 2026?', 
'Después del emocionante Mundial de Qatar 2022 donde Argentina se coronó campeón, ¿quién creen que levante la copa en 2026? Yo voy con Brasil, tienen un equipo joven muy prometedor. ¡Opinen!', 
'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', 
2, 1, 'aprobada', NOW() - INTERVAL 5 HOUR),

(3, 'Top 5 Goleadores Históricos de los Mundiales', 
'Mi ranking personal:
1. Miroslav Klose (Alemania) - 16 goles
2. Ronaldo Nazário (Brasil) - 15 goles
3. Gerd Müller (Alemania) - 14 goles
4. Just Fontaine (Francia) - 13 goles
5. Pelé (Brasil) - 12 goles

¿Están de acuerdo? ¿Quién falta?', 
'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aac?w=800', 
3, NULL, 'aprobada', NOW() - INTERVAL 1 DAY),

(1, 'El Gol de Maradona a Inglaterra - 35 años después', 
'Un día como hoy, hace 35 años, Maradona marcó el gol del siglo contra Inglaterra en México 86. Ese gol lo vi mi abuelo en vivo y hasta hoy lo recuerda con lágrimas en los ojos. ¿Cuál es su gol histórico favorito?', 
'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', 
3, NULL, 'aprobada', NOW() - INTERVAL 3 HOUR),

(2, 'Predicción: Argentina defenderá el título', 
'Sé que suena loco, pero creo que Argentina puede ser el primer equipo en defender el título desde Brasil en 1962. Tienen a Messi probablemente en su último mundial, un equipo consolidado y mucha hambre. ¿Qué opinan?', 
'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 
4, 1, 'aprobada', NOW() - INTERVAL 8 HOUR),

(3, 'Meme: Cuando tu equipo queda eliminado', 
'Ese momento cuando tu selección queda eliminada en octavos y tienes que fingir que sigues viendo el mundial... 😭⚽

¿A quién le pasó con su equipo en 2022?', 
'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800', 
5, 2, 'aprobada', NOW() - INTERVAL 12 HOUR),

(1, 'El formato de 48 equipos: ¿Bueno o malo?', 
'El Mundial 2026 será el primero con 48 equipos en lugar de 32. Algunos dicen que habrá más partidos aburridos, otros que dará más oportunidades. Yo estoy dividido. ¿Ustedes qué piensan?', 
NULL, 
2, 1, 'aprobada', NOW() - INTERVAL 6 HOUR),

(2, 'Sedes estadounidenses confirmadas', 
'Las ciudades de USA confirmadas para el Mundial 2026:
- Nueva York/Nueva Jersey
- Los Ángeles
- Dallas
- Atlanta
- Miami
- Seattle
- Houston
- Filadelfia
- Kansas City
- Boston

¿Cuál les gustaría visitar?', 
'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800', 
1, 1, 'aprobada', NOW() - INTERVAL 10 HOUR);

-- 6. CREAR ALGUNOS COMENTARIOS
INSERT INTO Comentario (idPublicacion, idUsuario, contenido, fechaCreacion) 
VALUES 
(1, 2, '¡El Azteca es legendario! Ojalá pueda ir a ver un partido allí.', NOW() - INTERVAL 1 HOUR),
(1, 3, 'Definitivamente uno de los mejores estadios del mundo. 🏟️', NOW() - INTERVAL 30 MINUTE),
(2, 1, 'Francia también tiene chances, no los descarten.', NOW() - INTERVAL 4 HOUR),
(2, 3, 'Brasil siempre es favorito, pero Argentina viene con todo.', NOW() - INTERVAL 3 HOUR),
(3, 2, 'Klose es una leyenda, merece todo el respeto.', NOW() - INTERVAL 20 HOUR),
(5, 1, 'No creo que puedan defender el título, pero sería épico.', NOW() - INTERVAL 7 HOUR),
(6, 3, 'JAJAJA me pasó con mi selección, dolió mucho 😢', NOW() - INTERVAL 11 HOUR);

-- 7. CREAR INTERACCIONES (Likes/Dislikes)
INSERT INTO InteraccionPublicacion (idPublicacion, idUsuario, tipoInteraccion) 
VALUES 
(1, 2, 'like'),
(1, 3, 'like'),
(2, 1, 'like'),
(2, 3, 'like'),
(3, 1, 'like'),
(3, 2, 'like'),
(4, 2, 'like'),
(5, 3, 'dislike'),
(6, 1, 'like'),
(6, 2, 'like'),
(7, 2, 'like'),
(8, 1, 'like'),
(8, 3, 'like');

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'USUARIOS CREADOS:' as Info, COUNT(*) as Total FROM Usuario;
SELECT 'CATEGORÍAS CREADAS:' as Info, COUNT(*) as Total FROM Categoria;
SELECT 'PUBLICACIONES CREADAS:' as Info, COUNT(*) as Total FROM Publicacion;
SELECT 'COMENTARIOS CREADOS:' as Info, COUNT(*) as Total FROM Comentario;
SELECT 'INTERACCIONES CREADAS:' as Info, COUNT(*) as Total FROM InteraccionPublicacion;
