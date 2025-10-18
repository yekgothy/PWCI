


CREATE DATABASE IF NOT EXISTS BDM;
USE BDM;


-- ============================================
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
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);


-- ============================================
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
);


-- ============================================
CREATE TABLE Categoria (
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#000000',
    activa BOOLEAN DEFAULT TRUE,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
CREATE TABLE Publicacion (
    idPublicacion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idMundial INT NOT NULL,
    idCategoria INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,
    urlMultimedia VARCHAR(255),
    fechaPublicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaAprobacion DATETIME NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    motivoRechazo TEXT NULL,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idMundial) REFERENCES Mundial(idMundial) ON DELETE RESTRICT,
    FOREIGN KEY (idCategoria) REFERENCES Categoria(idCategoria) ON DELETE RESTRICT
);


-- ============================================
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
);


-- ============================================
CREATE TABLE Interaccion (
    idInteraccion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idPublicacion INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_post (idUsuario, idPublicacion),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idPublicacion) REFERENCES Publicacion(idPublicacion) ON DELETE CASCADE
);


-- ============================================
CREATE TABLE EstadisticaUsuario (
    idEstadistica INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    publicaciones INT DEFAULT 0,
    comentarios INT DEFAULT 0,
    interacciones INT DEFAULT 0,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario) ON DELETE CASCADE
);


-- ============================================
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
);



