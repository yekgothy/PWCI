
USE BDM;
DELIMITER //

-- ============================================
-- SP1: Crear nuevo usuario
-- ============================================
CREATE PROCEDURE sp_CreateUser(
    IN p_nombreCompleto VARCHAR(100),
    IN p_fechaNacimiento DATE,
    IN p_genero VARCHAR(20),
    IN p_paisNacimiento VARCHAR(50),
    IN p_nacionalidad VARCHAR(50),
    IN p_correoElectronico VARCHAR(100),
    IN p_contrasena VARCHAR(255),
    IN p_foto VARCHAR(255),
    IN p_rol ENUM('admin', 'usuario'),
    OUT p_idUsuario INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_idUsuario = 0;
        SET p_mensaje = 'Error al crear usuario: El correo electrónico ya existe o datos inválidos';
    END;
    
    START TRANSACTION;
    
    -- Verificar si el correo ya existe
    SELECT COUNT(*) INTO v_existe 
    FROM Usuario 
    WHERE correoElectronico = p_correoElectronico;
    
    IF v_existe > 0 THEN
        SET p_idUsuario = 0;
        SET p_mensaje = 'El correo electrónico ya está registrado';
        ROLLBACK;
    ELSE
        -- Insertar nuevo usuario
        INSERT INTO Usuario (
            nombreCompleto, fechaNacimiento, genero, paisNacimiento, 
            nacionalidad, correoElectronico, contrasena, foto, rol
        ) VALUES (
            p_nombreCompleto, p_fechaNacimiento, p_genero, p_paisNacimiento,
            p_nacionalidad, p_correoElectronico, p_contrasena, p_foto, 
            IFNULL(p_rol, 'usuario')
        );
        
        SET p_idUsuario = LAST_INSERT_ID();
        SET p_mensaje = 'Usuario creado exitosamente';
        COMMIT;
    END IF;
END //

-- ============================================
-- SP2: Obtener usuario por ID
-- ============================================
CREATE PROCEDURE sp_GetUserById(
    IN p_idUsuario INT
)
BEGIN
    SELECT 
        idUsuario, nombreCompleto, fechaNacimiento, genero, 
        paisNacimiento, nacionalidad, correoElectronico, 
        foto, rol, fechaRegistro, activo
    FROM Usuario 
    WHERE idUsuario = p_idUsuario AND activo = TRUE;
END //

-- ============================================
-- SP3: Obtener usuario por correo electrónico
-- ============================================
CREATE PROCEDURE sp_GetUserByEmail(
    IN p_correoElectronico VARCHAR(100)
)
BEGIN
    SELECT 
        idUsuario, nombreCompleto, fechaNacimiento, genero, 
        paisNacimiento, nacionalidad, correoElectronico, 
        contrasena, foto, rol, fechaRegistro, activo
    FROM Usuario 
    WHERE correoElectronico = p_correoElectronico AND activo = TRUE;
END //

-- ============================================
-- SP4: Autenticar usuario (login)
-- ============================================
CREATE PROCEDURE sp_AuthenticateUser(
    IN p_correoElectronico VARCHAR(100),
    IN p_contrasena VARCHAR(255),
    OUT p_idUsuario INT,
    OUT p_nombreCompleto VARCHAR(100),
    OUT p_rol ENUM('admin', 'usuario'),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_storedPassword VARCHAR(255);
    DECLARE v_userCount INT DEFAULT 0;
    
    -- Inicializar variables de salida
    SET p_idUsuario = 0;
    SET p_nombreCompleto = '';
    SET p_rol = 'usuario';
    
    -- Buscar usuario activo por correo
    SELECT COUNT(*), idUsuario, nombreCompleto, contrasena, rol
    INTO v_userCount, p_idUsuario, p_nombreCompleto, v_storedPassword, p_rol
    FROM Usuario 
    WHERE correoElectronico = p_correoElectronico AND activo = TRUE;
    
    IF v_userCount = 0 THEN
        SET p_idUsuario = 0;
        SET p_mensaje = 'Usuario no encontrado o inactivo';
    ELSE
        -- Nota: La verificación de password se debe hacer en PHP con password_verify()
        -- Aquí solo devolvemos los datos para que PHP haga la comparación
        SET p_mensaje = 'Usuario encontrado - verificar password en aplicación';
    END IF;
END //

-- ============================================
-- SP5: Actualizar datos de usuario
-- ============================================
CREATE PROCEDURE sp_UpdateUser(
    IN p_idUsuario INT,
    IN p_nombreCompleto VARCHAR(100),
    IN p_fechaNacimiento DATE,
    IN p_genero VARCHAR(20),
    IN p_paisNacimiento VARCHAR(50),
    IN p_nacionalidad VARCHAR(50),
    IN p_foto VARCHAR(255),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_mensaje = 'Error al actualizar usuario';
    END;
    
    START TRANSACTION;
    
    -- Verificar si el usuario existe y está activo
    SELECT COUNT(*) INTO v_existe 
    FROM Usuario 
    WHERE idUsuario = p_idUsuario AND activo = TRUE;
    
    IF v_existe = 0 THEN
        SET p_mensaje = 'Usuario no encontrado o inactivo';
        ROLLBACK;
    ELSE
        -- Actualizar datos del usuario
        UPDATE Usuario SET
            nombreCompleto = IFNULL(p_nombreCompleto, nombreCompleto),
            fechaNacimiento = IFNULL(p_fechaNacimiento, fechaNacimiento),
            genero = IFNULL(p_genero, genero),
            paisNacimiento = IFNULL(p_paisNacimiento, paisNacimiento),
            nacionalidad = IFNULL(p_nacionalidad, nacionalidad),
            foto = IFNULL(p_foto, foto)
        WHERE idUsuario = p_idUsuario;
        
        SET p_mensaje = 'Usuario actualizado exitosamente';
        COMMIT;
    END IF;
END //

-- ============================================
-- SP6: Cambiar contraseña de usuario
-- ============================================
CREATE PROCEDURE sp_ChangePassword(
    IN p_idUsuario INT,
    IN p_nuevaContrasena VARCHAR(255),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_mensaje = 'Error al cambiar contraseña';
    END;
    
    START TRANSACTION;
    
    -- Verificar si el usuario existe y está activo
    SELECT COUNT(*) INTO v_existe 
    FROM Usuario 
    WHERE idUsuario = p_idUsuario AND activo = TRUE;
    
    IF v_existe = 0 THEN
        SET p_mensaje = 'Usuario no encontrado o inactivo';
        ROLLBACK;
    ELSE
        -- Actualizar contraseña (debe venir hasheada desde PHP)
        UPDATE Usuario SET
            contrasena = p_nuevaContrasena
        WHERE idUsuario = p_idUsuario;
        
        SET p_mensaje = 'Contraseña actualizada exitosamente';
        COMMIT;
    END IF;
END //

-- ============================================
-- SP7: Desactivar usuario (soft delete)
-- ============================================
CREATE PROCEDURE sp_DeactivateUser(
    IN p_idUsuario INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_mensaje = 'Error al desactivar usuario';
    END;
    
    START TRANSACTION;
    
    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO v_existe 
    FROM Usuario 
    WHERE idUsuario = p_idUsuario;
    
    IF v_existe = 0 THEN
        SET p_mensaje = 'Usuario no encontrado';
        ROLLBACK;
    ELSE
        -- Desactivar usuario (soft delete)
        UPDATE Usuario SET
            activo = FALSE
        WHERE idUsuario = p_idUsuario;
        
        SET p_mensaje = 'Usuario desactivado exitosamente';
        COMMIT;
    END IF;
END //

-- ============================================
-- SP8: Listar usuarios activos
-- ============================================
CREATE PROCEDURE sp_ListUsers(
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- Si no se especifica límite, usar 50 por defecto
    SET p_limite = IFNULL(p_limite, 50);
    SET p_offset = IFNULL(p_offset, 0);
    
    SELECT 
        idUsuario, nombreCompleto, fechaNacimiento, genero,
        paisNacimiento, nacionalidad, correoElectronico,
        foto, rol, fechaRegistro, activo
    FROM Usuario 
    WHERE activo = TRUE
    ORDER BY fechaRegistro DESC
    LIMIT p_limite OFFSET p_offset;
END //

-- ============================================
-- SP9: Contar usuarios activos
-- ============================================
CREATE PROCEDURE sp_CountUsers()
BEGIN
    SELECT COUNT(*) as total_usuarios
    FROM Usuario 
    WHERE activo = TRUE;
END //

-- ============================================
-- SP10: Buscar usuarios por nombre o correo
-- ============================================
CREATE PROCEDURE sp_SearchUsers(
    IN p_termino VARCHAR(100)
)
BEGIN
    SELECT 
        idUsuario, nombreCompleto, correoElectronico, 
        genero, rol, fechaRegistro
    FROM Usuario 
    WHERE activo = TRUE 
    AND (
        nombreCompleto LIKE CONCAT('%', p_termino, '%') OR
        correoElectronico LIKE CONCAT('%', p_termino, '%')
    )
    ORDER BY nombreCompleto ASC
    LIMIT 20;
END //

-- Restaurar el delimitador
DELIMITER ;