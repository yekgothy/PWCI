-- =====================================================
-- DATABASE_DEFINITIVO.SQL - ESTRUCTURA DE TABLAS DEFINITIVA
-- VERSION CON BLOB Y VISTAS
-- Incluye: LONGBLOB para imágenes, contador de vistas
-- =====================================================

CREATE DATABASE IF NOT EXISTS BDM;
USE BDM;

-- ============================================
-- TABLA USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS Usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombreCompleto VARCHAR(100) NOT NULL,
    fechaNacimiento DATE NOT NULL,
    genero VARCHAR(20),
    paisNacimiento VARCHAR(50),
    nacionalidad VARCHAR(50),
    correoElectronico VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLA MUNDIAL
-- ============================================
CREATE TABLE IF NOT EXISTS Mundial (
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
);

-- ============================================
-- TABLA CATEGORIA
-- ============================================
CREATE TABLE IF NOT EXISTS Categoria (
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#000000',
    activa BOOLEAN DEFAULT TRUE,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA PUBLICACION
-- ============================================
CREATE TABLE IF NOT EXISTS Publicacion (
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
    FOREIGN KEY (idMundial) REFERENCES Mundial(idMundial) ON DELETE RESTRICT,
    FOREIGN KEY (idCategoria) REFERENCES Categoria(idCategoria) ON DELETE RESTRICT
);

-- ============================================
-- TABLA COMENTARIO
-- ============================================
CREATE TABLE IF NOT EXISTS Comentario (
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
);

-- ============================================
-- TABLA INTERACCION
-- ============================================
CREATE TABLE IF NOT EXISTS Interaccion (
    idInteraccion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idPublicacion INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_post (idUsuario, idPublicacion),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion) ON DELETE CASCADE
);

SELECT '✅ TABLAS CREADAS EXITOSAMENTE' as status;
