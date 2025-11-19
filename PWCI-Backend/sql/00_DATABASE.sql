-- =====================================================
-- BASE DE DATOS COMPLETA - WORLD CUP HUB
-- Exportado desde la base de datos funcional actual
-- Incluye: 8 tablas con BLOB para imágenes y multimedia
-- =====================================================

CREATE DATABASE IF NOT EXISTS BDM;
USE BDM;

-- ============================================
-- TABLA USUARIO
-- ============================================
DROP TABLE IF EXISTS Usuario;
CREATE TABLE Usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombreCompleto VARCHAR(100) NOT NULL,
    fechaNacimiento DATE NOT NULL,
    genero VARCHAR(20),
    paisNacimiento VARCHAR(50),
    nacionalidad VARCHAR(50),
    correoElectronico VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    fotoBlob LONGBLOB,
    fotoMimeType VARCHAR(50),
    fotoNombre VARCHAR(255),
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA MUNDIAL
-- ============================================
DROP TABLE IF EXISTS Mundial;
CREATE TABLE Mundial (
    idMundial INT AUTO_INCREMENT PRIMARY KEY,
    anio INT NOT NULL,
    paisSede VARCHAR(50) NOT NULL,
    logo VARCHAR(255),
    nombreOficial VARCHAR(100),
    descripcion TEXT,
    fechaInicio DATE,
    fechaFin DATE,
    numeroEquipos INT DEFAULT 32,
    estado ENUM('proximo', 'en_curso', 'finalizado') DEFAULT 'proximo',
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA CATEGORIA
-- ============================================
DROP TABLE IF EXISTS Categoria;
CREATE TABLE Categoria (
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#000000',
    activa BOOLEAN DEFAULT TRUE,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA PUBLICACION
-- ============================================
DROP TABLE IF EXISTS Publicacion;
CREATE TABLE Publicacion (
    idPublicacion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idMundial INT NOT NULL,
    idCategoria INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,
    urlMultimedia VARCHAR(255),
    multimediaBlob LONGBLOB,
    multimediaMimeType VARCHAR(50),
    multimediaNombre VARCHAR(255),
    fechaPublicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaAprobacion DATETIME NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    motivoRechazo TEXT NULL,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    vistas INT DEFAULT 0,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idMundial) REFERENCES Mundial(idMundial),
    FOREIGN KEY (idCategoria) REFERENCES Categoria(idCategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA COMENTARIO
-- ============================================
DROP TABLE IF EXISTS Comentario;
CREATE TABLE Comentario (
    idComentario INT AUTO_INCREMENT PRIMARY KEY,
    idPublicacion INT NOT NULL,
    idUsuario INT NOT NULL,
    contenido TEXT NOT NULL,
    fechaComentario DATETIME DEFAULT CURRENT_TIMESTAMP,
    editado BOOLEAN DEFAULT FALSE,
    fechaEdicion DATETIME NULL,
    reportado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA INTERACCION
-- ============================================
DROP TABLE IF EXISTS Interaccion;
CREATE TABLE Interaccion (
    idInteraccion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idPublicacion INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_post (idUsuario, idPublicacion),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA ESTADISTICAUSUARIO
-- ============================================
DROP TABLE IF EXISTS EstadisticaUsuario;
CREATE TABLE EstadisticaUsuario (
    idEstadistica INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    publicaciones INT DEFAULT 0,
    comentarios INT DEFAULT 0,
    interacciones INT DEFAULT 0,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLA REPORTECOMENTARIO
-- ============================================
DROP TABLE IF EXISTS ReporteComentario;
CREATE TABLE ReporteComentario (
    idReporte INT AUTO_INCREMENT PRIMARY KEY,
    idComentario INT NOT NULL,
    idUsuarioReportador INT NOT NULL,
    motivo ENUM('spam', 'lenguaje_ofensivo', 'acoso', 'contenido_inapropiado', 'otro') NOT NULL,
    descripcion TEXT,
    fechaReporte DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'revisado', 'accion_tomada') DEFAULT 'pendiente',
    FOREIGN KEY (idComentario) REFERENCES Comentario(idComentario) ON DELETE CASCADE,
    FOREIGN KEY (idUsuarioReportador) REFERENCES Usuario(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT '✅ 8 TABLAS CREADAS EXITOSAMENTE' as status;
SELECT 'Usuario, Mundial, Categoria, Publicacion, Comentario, Interaccion, EstadisticaUsuario, ReporteComentario' as tablas;
