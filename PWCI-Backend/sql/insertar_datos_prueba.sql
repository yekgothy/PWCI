-- ================================================
-- SCRIPT DE DATOS DE PRUEBA
-- ================================================
-- Este script inserta datos de prueba desde cero
-- Las IDs empezarán desde 1

-- ================================================
-- 1. INSERTAR USUARIOS
-- ================================================
INSERT INTO Usuario (nombreCompleto, fechaNacimiento, genero, correoElectronico, contrasena, foto, rol) VALUES
('Carlos Gómez', '1995-03-15', 'Masculino', 'carlos@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=12', 'usuario'),
('María López', '1998-07-22', 'Femenino', 'maria@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=25', 'usuario'),
('Admin User', '1990-01-10', 'Masculino', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=33', 'admin');

-- ================================================
-- 2. INSERTAR CATEGORÍAS
-- ================================================
INSERT INTO Categoria (nombre, descripcion, color) VALUES
('Análisis', 'Análisis tácticos y estratégicos del fútbol', '#3B82F6'),
('Noticias', 'Últimas noticias del mundo del fútbol', '#EF4444'),
('Historia', 'Momentos históricos del fútbol mundial', '#F59E0B'),
('Opinión', 'Opiniones y debates sobre fútbol', '#8B5CF6'),
('Estadísticas', 'Datos y estadísticas del fútbol', '#10B981');

-- ================================================
-- 3. INSERTAR MUNDIALES
-- ================================================
INSERT INTO Mundial (anio, paisSede, nombreOficial, descripcion, fechaInicio, fechaFin, estado) VALUES
(2022, 'Qatar', 'Copa Mundial de la FIFA Qatar 2022', 'La final más emocionante de la historia', '2022-11-20', '2022-12-18', 'finalizado'),
(2018, 'Rusia', 'Copa Mundial de la FIFA Rusia 2018', 'Francia campeón por segunda vez', '2018-06-14', '2018-07-15', 'finalizado');

-- ================================================
-- 4. INSERTAR PUBLICACIONES
-- ================================================
INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia, fechaPublicacion, fechaAprobacion, estado) VALUES
(1, 1, 1, 'El mejor gol de Messi en Qatar 2022', 'Sin duda, el gol contra México fue uno de los más importantes de su carrera. Un disparo desde fuera del área que cambió el rumbo del partido y del Mundial.', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, 'aprobada'),
(1, 1, 3, 'La final más épica de la historia', 'Argentina vs Francia fue un partido de infarto. 3-3 en 120 minutos, con Messi y Mbappé como protagonistas absolutos. Los penales definieron al campeón.', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, 'aprobada'),
(2, 1, 2, '¿Quién fue el mejor jugador del Mundial?', 'Messi ganó el Balón de Oro, pero Mbappé hizo un hat-trick en la final. ¿Quién fue realmente el mejor? Debate abierto.', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 'aprobada'),
(2, 2, 4, 'Francia 2018: El resurgir de los Bleus', 'Con Griezmann, Pogba y Mbappé, Francia volvió a ganar un Mundial después de 20 años. Un equipo joven que marcó una era.', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY, 'aprobada'),
(1, 1, 5, 'Estadísticas de Qatar 2022', 'Se marcaron 172 goles en 64 partidos. Mbappé fue el goleador con 8 goles. Argentina tuvo el mayor porcentaje de posesión.', 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, 'aprobada'),
(2, 1, 1, 'La atajada de Dibu Martínez', 'El arquero argentino fue clave en los penales. Su personalidad y reflejos fueron determinantes para la victoria.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY, 'aprobada'),
(1, 2, 3, 'El gol de Pavard: ¿El mejor del Mundial 2018?', 'Benjamin Pavard anotó un golazo de volea contra Argentina. Fue elegido como el mejor gol del torneo.', 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY, 'aprobada'),
(2, 1, 4, 'El legado de Messi tras ganar el Mundial', 'Con este título, Messi cierra el debate sobre quién es el mejor de la historia. Su carrera está completa.', 'https://images.unsplash.com/photo-1511016904113-007faa79e740?w=800', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY, 'aprobada');

-- ================================================
-- 5. INSERTAR COMENTARIOS
-- ================================================
INSERT INTO Comentario (idPublicacion, idUsuario, contenido, fechaComentario) VALUES
(1, 2, '¡Totalmente de acuerdo! Ese gol fue un golazo.', NOW() - INTERVAL 1 DAY),
(1, 3, 'Messi es el GOAT, sin dudas.', NOW() - INTERVAL 1 DAY),
(2, 2, 'La final más emocionante que he visto en mi vida.', NOW() - INTERVAL 4 DAY),
(3, 1, 'Mbappé fue increíble, pero Messi dirigió el equipo.', NOW() - INTERVAL 1 DAY),
(5, 3, 'Interesantes datos, gracias por compartir.', NOW() - INTERVAL 2 DAY);

-- ================================================
-- 6. INSERTAR INTERACCIONES (LIKES/DISLIKES)
-- ================================================
INSERT INTO Interaccion (idUsuario, idPublicacion, tipo, fecha) VALUES
(1, 2, 'like', NOW() - INTERVAL 4 DAY),
(1, 3, 'like', NOW() - INTERVAL 1 DAY),
(2, 1, 'like', NOW() - INTERVAL 1 DAY),
(2, 2, 'like', NOW() - INTERVAL 4 DAY),
(2, 5, 'like', NOW() - INTERVAL 2 DAY),
(3, 1, 'like', NOW() - INTERVAL 1 DAY),
(3, 2, 'like', NOW() - INTERVAL 4 DAY),
(3, 3, 'dislike', NOW() - INTERVAL 1 DAY),
(3, 5, 'like', NOW() - INTERVAL 2 DAY),
(1, 6, 'like', NOW() - INTERVAL 5 DAY);

-- ================================================
-- VERIFICAR DATOS INSERTADOS
-- ================================================
SELECT 'Usuario' as Tabla, COUNT(*) as Registros FROM Usuario
UNION ALL
SELECT 'Categoria', COUNT(*) FROM Categoria
UNION ALL
SELECT 'Mundial', COUNT(*) FROM Mundial
UNION ALL
SELECT 'Publicacion', COUNT(*) FROM Publicacion
UNION ALL
SELECT 'Comentario', COUNT(*) FROM Comentario
UNION ALL
SELECT 'Interaccion', COUNT(*) FROM Interaccion;

-- Ver publicaciones con sus títulos
SELECT idPublicacion, titulo, nombreCompleto, estado 
FROM Publicacion p
JOIN Usuario u ON p.idUsuario = u.idUsuario
ORDER BY fechaPublicacion DESC;
