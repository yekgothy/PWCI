-- ============================================
-- DATOS DE PRUEBA - COMPATIBLE CON database.sql
-- ============================================

-- PASO 1: CREAR USUARIOS
INSERT INTO Usuario (nombreCompleto, fechaNacimiento, genero, paisNacimiento, nacionalidad, correoElectronico, contrasena, rol, activo) 
VALUES 
('Carlos Rodríguez', '1995-03-15', 'Masculino', 'México', 'Mexicana', 'carlos@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', 1),
('María González', '1998-07-22', 'Femenino', 'Argentina', 'Argentina', 'maria@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', 1),
('John Smith', '1992-11-08', 'Masculino', 'Estados Unidos', 'Estadounidense', 'john@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', 1),
('Admin User', '1990-01-01', 'Masculino', 'México', 'Mexicana', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- PASO 2: CREAR ESTADÍSTICAS
INSERT INTO EstadisticaUsuario (idUsuario) 
SELECT idUsuario FROM Usuario WHERE correoElectronico LIKE '%@test.com';

-- PASO 3: CREAR CATEGORÍAS (sin campo 'icono')
INSERT INTO Categoria (nombre, descripcion, color, activa) 
VALUES 
('Noticias', 'Últimas noticias del mundial', '#FF6B6B', 1),
('Debate', 'Debates y opiniones', '#4ECDC4', 1),
('Historia', 'Momentos históricos', '#FFD93D', 1),
('Predicciones', 'Pronósticos y apuestas', '#95E1D3', 1),
('Memes', 'Humor futbolero', '#F38181', 1);

-- PASO 4: CREAR MUNDIALES
INSERT INTO Mundial (anio, paisSede, estado, numeroEquipos, fechaInicio, fechaFin) 
VALUES 
(2026, 'México, USA, Canadá', 'proximo', 48, '2026-06-11', '2026-07-19'),
(2022, 'Qatar', 'finalizado', 32, '2022-11-20', '2022-12-18');

-- PASO 5: CREAR PUBLICACIONES (usar urlMultimedia y idMundial obligatorio)
INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'carlos@test.com'), 
 1, 1,
 'México 2026: Estadio Azteca confirmado como sede', 
 '¡Gran noticia! El mítico Estadio Azteca será una de las principales sedes del Mundial 2026. Este estadio ha sido testigo de dos finales de Copa del Mundo (1970 y 1986) y ahora volverá a hacer historia. ¿Qué les parece?', 
 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800', 
 'aprobada', NOW() - INTERVAL 2 HOUR);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'maria@test.com'), 
 1, 2,
 '¿Quién ganará el Mundial 2026?', 
 'Después del emocionante Mundial de Qatar 2022 donde Argentina se coronó campeón, ¿quién creen que levante la copa en 2026? Yo voy con Brasil, tienen un equipo joven muy prometedor. ¡Opinen!', 
 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', 
 'aprobada', NOW() - INTERVAL 5 HOUR);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'john@test.com'), 
 2, 3,
 'Top 5 Goleadores Históricos de los Mundiales', 
 'Mi ranking personal:\n1. Miroslav Klose (Alemania) - 16 goles\n2. Ronaldo Nazário (Brasil) - 15 goles\n3. Gerd Müller (Alemania) - 14 goles\n4. Just Fontaine (Francia) - 13 goles\n5. Pelé (Brasil) - 12 goles\n\n¿Están de acuerdo? ¿Quién falta?', 
 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aac?w=800', 
 'aprobada', NOW() - INTERVAL 1 DAY);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'carlos@test.com'), 
 2, 3,
 'El Gol de Maradona a Inglaterra - 35 años después', 
 'Un día como hoy, hace 35 años, Maradona marcó el gol del siglo contra Inglaterra en México 86. Ese gol lo vi mi abuelo en vivo y hasta hoy lo recuerda con lágrimas en los ojos. ¿Cuál es su gol histórico favorito?', 
 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', 
 'aprobada', NOW() - INTERVAL 3 HOUR);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'maria@test.com'), 
 1, 4,
 'Predicción: Argentina defenderá el título', 
 'Sé que suena loco, pero creo que Argentina puede ser el primer equipo en defender el título desde Brasil en 1962. Tienen a Messi probablemente en su último mundial, un equipo consolidado y mucha hambre. ¿Qué opinan?', 
 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 
 'aprobada', NOW() - INTERVAL 8 HOUR);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'john@test.com'), 
 2, 5,
 'Meme: Cuando tu equipo queda eliminado', 
 'Ese momento cuando tu selección queda eliminada en octavos y tienes que fingir que sigues viendo el mundial... 😭⚽\n\n¿A quién le pasó con su equipo en 2022?', 
 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800', 
 'aprobada', NOW() - INTERVAL 12 HOUR);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'carlos@test.com'), 
 1, 2,
 'El formato de 48 equipos: ¿Bueno o malo?', 
 'El Mundial 2026 será el primero con 48 equipos en lugar de 32. Algunos dicen que habrá más partidos aburridos, otros que dará más oportunidades. Yo estoy dividido. ¿Ustedes qué piensan?', 
 NULL, 
 'aprobada', NOW() - INTERVAL 6 HOUR);

INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, estado, fechaPublicacion) 
VALUES 
((SELECT idUsuario FROM Usuario WHERE correoElectronico = 'maria@test.com'), 
 1, 1,
 'Sedes estadounidenses confirmadas', 
 'Las ciudades de USA confirmadas para el Mundial 2026:\n- Nueva York/Nueva Jersey\n- Los Ángeles\n- Dallas\n- Atlanta\n- Miami\n- Seattle\n- Houston\n- Filadelfia\n- Kansas City\n- Boston\n\n¿Cuál les gustaría visitar?', 
 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800', 
 'aprobada', NOW() - INTERVAL 10 HOUR);

-- PASO 6: CREAR COMENTARIOS
INSERT INTO Comentario (idPublicacion, idUsuario, contenido) 
VALUES 
(1, 2, '¡El Azteca es legendario! Ojalá pueda ir a ver un partido allí.'),
(1, 3, 'Definitivamente uno de los mejores estadios del mundo. 🏟️'),
(2, 1, 'Francia también tiene chances, no los descarten.'),
(2, 3, 'Brasil siempre es favorito, pero Argentina viene con todo.'),
(3, 2, 'Klose es una leyenda, merece todo el respeto.');

-- PASO 7: CREAR INTERACCIONES (likes/dislikes) - tabla Interaccion
INSERT INTO Interaccion (idUsuario, idPublicacion, tipo) 
VALUES 
(2, 1, 'like'),
(3, 1, 'like'),
(1, 2, 'like'),
(3, 2, 'like'),
(1, 3, 'like'),
(2, 3, 'like'),
(2, 4, 'like'),
(3, 5, 'dislike'),
(1, 6, 'like'),
(2, 6, 'like');

-- ============================================
-- ¡LISTO! Ahora ve a: http://localhost/PWCI/PWCI-Front/pages/feed.html
-- ============================================
