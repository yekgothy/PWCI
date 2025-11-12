<?php


// Configurar headers para API REST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Incluir la configuración de la base de datos
require_once 'config/database.php';


function sendResponse($data, $status = 200, $message = '') {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}


function sendError($message, $status = 400) {
    sendResponse(null, $status, $message);
}

// MIDDLEWARE: Verificar autenticación
function requireAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader)) {
        sendError('Token de autenticación requerido', 401);
    }
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        sendError('Formato de token inválido', 401);
    }
    
    $token = trim($matches[1]);
    $user = validateToken($token);
    
    if (!$user) {
        sendError('Token inválido o expirado', 401);
    }
    
    return $user;
}

// MIDDLEWARE: Verificar admin
function requireAdmin($user) {
    if ($user['rol'] !== 'admin') {
        sendError('Acceso denegado', 403);
    }
}

// Validar token y obtener usuario
function validateToken($token) {
    try {
        $parts = explode('_', $token);
        if (count($parts) < 2) {
            return false;
        }
        
        $userId = (int)end($parts);
        
        // Obtener usuario de la base de datos
        $users = executeSelect(
            "SELECT idUsuario, nombreCompleto, correoElectronico, rol, activo 
             FROM Usuario WHERE idUsuario = ? AND activo = TRUE",
            [$userId]
        );
        
        if (!$users || count($users) === 0) {
            return false;
        }
        
        return $users[0];
        
    } catch (Exception $e) {
        error_log('Error validando token: ' . $e->getMessage());
        return false;
    }
}

// Generar token de autenticación
function generateAuthToken($userId) {
    $randomHash = bin2hex(random_bytes(32));
    return $randomHash . '_' . $userId;
}

$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
$endpoint = $request[0] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

// Manejar subrutas especiales
if ($endpoint === 'usuarios' && isset($request[2])) {
    if ($request[2] === 'cambiar-password') {
        handleCambiarPassword($method, $request, $input);
        exit;
    }
}

switch ($endpoint) {
    case 'auth':
        handleAuth($method, $request, $input);
        break;
    
    case 'usuarios':
        handleUsuarios($method, $request, $input);
        break;
    
    case 'publicaciones':
        handlePublicaciones($method, $request, $input);
        break;
    
    case 'comentarios':
        handleComentarios($method, $request, $input);
        break;
    
    case 'mundiales':
        handleMundiales($method, $request, $input);
        break;
    
    case 'categorias':
        handleCategorias($method, $request, $input);
        break;
    
    case 'status':
        // Endpoint para verificar el estado de la API
        sendResponse([
            'api' => 'BDM API',
            'version' => '1.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'database' => getDBConnection() ? 'connected' : 'disconnected'
        ], 200, 'API funcionando correctamente');
        break;
    
    default:
        sendError('Endpoint no encontrado', 404);
}

function handleAuth($method, $request, $input) {
    $action = $request[1] ?? '';
    
    switch ($action) {
        case 'login':
            if ($method !== 'POST') sendError('Método no permitido', 405);
            handleLogin($input);
            break;
        case 'register':
            if ($method !== 'POST') sendError('Método no permitido', 405);
            handleRegister($input);
            break;
        case 'verify':
            if ($method !== 'POST') sendError('Método no permitido', 405);
            handleVerifyToken($input);
            break;
        default:
            sendError('Acción no válida', 400);
    }
}

function handleLogin($input) {
    if (!$input || empty($input['correoElectronico']) || empty($input['contrasena'])) {
        sendError('Se requiere correo electrónico y contraseña');
    }
    $users = executeSelect(
        "SELECT idUsuario, nombreCompleto, correoElectronico, contrasena, foto, rol, activo 
         FROM Usuario WHERE correoElectronico = ?",
        [$input['correoElectronico']]
    );
    
    if (!$users || count($users) === 0) {
        sendError('Credenciales incorrectas', 401);
    }
    
    $user = $users[0];
    
    // Verificar si el usuario está activo
    if (!$user['activo']) {
        sendError('Usuario desactivado. Contacte al administrador.', 403);
    }
    
    // Verificar contraseña
    if (!password_verify($input['contrasena'], $user['contrasena'])) {
        sendError('Credenciales incorrectas', 401);
    }
    
    // Generar token de sesión usando la función del middleware
    $token = generateAuthToken($user['idUsuario']);
    
    // Preparar respuesta (sin enviar la contraseña)
    unset($user['contrasena']);
    
    sendResponse([
        'user' => $user,
        'token' => $token
    ], 200, 'Inicio de sesión exitoso');
}

/**
 * Manejar registro de usuario
 */
function handleRegister($input) {
    // Validar datos requeridos
    if (!$input || empty($input['nombreCompleto']) || empty($input['correoElectronico']) || 
        empty($input['contrasena']) || empty($input['fechaNacimiento'])) {
        sendError('Datos incompletos. Se requiere: nombreCompleto, correoElectronico, contrasena, fechaNacimiento');
    }
    
    // Validar formato de correo
    if (!filter_var($input['correoElectronico'], FILTER_VALIDATE_EMAIL)) {
        sendError('Formato de correo electrónico inválido');
    }
    
    // Validar longitud de contraseña
    if (strlen($input['contrasena']) < 6) {
        sendError('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Verificar si el correo ya existe
    $existingUsers = executeSelect(
        "SELECT idUsuario FROM Usuario WHERE correoElectronico = ?",
        [$input['correoElectronico']]
    );
    
    if ($existingUsers && count($existingUsers) > 0) {
        sendError('El correo electrónico ya está registrado', 409);
    }
    
    // Hash de la contraseña
    $hashedPassword = password_hash($input['contrasena'], PASSWORD_DEFAULT);
    
    // Insertar nuevo usuario
    $id = executeQuery(
        "INSERT INTO Usuario (nombreCompleto, fechaNacimiento, genero, paisNacimiento, nacionalidad, 
                            correoElectronico, contrasena, foto, rol) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $input['nombreCompleto'],
            $input['fechaNacimiento'],
            $input['genero'] ?? null,
            $input['paisNacimiento'] ?? null,
            $input['nacionalidad'] ?? null,
            $input['correoElectronico'],
            $hashedPassword,
            $input['foto'] ?? null,
            'usuario' // Siempre crear como usuario normal
        ]
    );
    
    if ($id) {
        // Crear estadísticas iniciales para el usuario
        executeQuery(
            "INSERT INTO EstadisticaUsuario (idUsuario) VALUES (?)",
            [$id]
        );
        
        // Generar token usando la función del middleware
        $token = generateAuthToken($id);
        
        sendResponse([
            'idUsuario' => $id,
            'nombreCompleto' => $input['nombreCompleto'],
            'correoElectronico' => $input['correoElectronico'],
            'rol' => 'usuario',
            'token' => $token
        ], 201, 'Usuario registrado exitosamente');
    } else {
        sendError('Error al registrar usuario', 500);
    }
}

/**
 * Verificar token de sesión
 */
function handleVerifyToken($input) {
    if (!$input || empty($input['token'])) {
        sendError('Token requerido');
    }
    
    // En una implementación real, verificarías el token contra una base de datos o JWT
    // Por ahora, solo retornamos que es válido
    sendResponse(['valid' => true], 200, 'Token válido');
}

/**
 * Manejar operaciones de usuarios
 */
function handleUsuarios($method, $request, $input) {
    // MIDDLEWARE: Requiere autenticación
    $currentUser = requireAuth();
    
    switch ($method) {
        case 'GET':
            if (isset($request[1])) {
                // Obtener usuario específico
                $id = (int)$request[1];
                $user = executeSelect(
                    "SELECT idUsuario, nombreCompleto, correoElectronico, genero, paisNacimiento, 
                            nacionalidad, foto, rol, fechaRegistro, activo 
                     FROM Usuario WHERE idUsuario = ?", 
                    [$id]
                );
                
                if ($user) {
                    sendResponse($user[0], 200, 'Usuario encontrado');
                } else {
                    sendError('Usuario no encontrado', 404);
                }
            } else {
                // Obtener todos los usuarios (solo admins)
                requireAdmin($currentUser);
                
                $users = executeSelect(
                    "SELECT idUsuario, nombreCompleto, correoElectronico, genero, paisNacimiento, 
                            nacionalidad, foto, rol, fechaRegistro, activo 
                     FROM Usuario 
                     ORDER BY fechaRegistro DESC"
                );
                sendResponse($users, 200, 'Usuarios obtenidos correctamente');
            }
            break;
        
        case 'POST':
            // Crear nuevo usuario
            if (!$input || empty($input['nombreCompleto']) || empty($input['correoElectronico']) || empty($input['contrasena'])) {
                sendError('Datos incompletos. Se requiere: nombreCompleto, correoElectronico, contrasena');
            }
            
            // Hash de la contraseña
            $hashedPassword = password_hash($input['contrasena'], PASSWORD_DEFAULT);
            
            $id = executeQuery(
                "INSERT INTO Usuario (nombreCompleto, fechaNacimiento, genero, paisNacimiento, nacionalidad, 
                                    correoElectronico, contrasena, foto, rol) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $input['nombreCompleto'],
                    $input['fechaNacimiento'] ?? null,
                    $input['genero'] ?? null,
                    $input['paisNacimiento'] ?? null,
                    $input['nacionalidad'] ?? null,
                    $input['correoElectronico'],
                    $hashedPassword,
                    $input['foto'] ?? null,
                    $input['rol'] ?? 'usuario'
                ]
            );
            
            if ($id) {
                sendResponse(['idUsuario' => $id], 201, 'Usuario creado correctamente');
            } else {
                sendError('Error al crear usuario', 500);
            }
            break;
        
        case 'PUT':
            // Actualizar usuario
            if (!isset($request[1])) {
                sendError('ID de usuario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que el usuario actual es el dueño del perfil o es admin
            if ($currentUser['idUsuario'] != $id && $currentUser['rol'] !== 'admin') {
                sendError('No tienes permiso para editar este perfil', 403);
            }
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            // Construir query dinámico solo con los campos proporcionados
            $updates = [];
            $params = [];
            
            if (isset($input['nombreCompleto'])) {
                $updates[] = "nombreCompleto = ?";
                $params[] = $input['nombreCompleto'];
            }
            if (isset($input['fechaNacimiento'])) {
                $updates[] = "fechaNacimiento = ?";
                $params[] = $input['fechaNacimiento'];
            }
            if (isset($input['genero'])) {
                $updates[] = "genero = ?";
                $params[] = $input['genero'];
            }
            if (isset($input['paisNacimiento'])) {
                $updates[] = "paisNacimiento = ?";
                $params[] = $input['paisNacimiento'];
            }
            if (isset($input['nacionalidad'])) {
                $updates[] = "nacionalidad = ?";
                $params[] = $input['nacionalidad'];
            }
            if (isset($input['foto'])) {
                $updates[] = "foto = ?";
                $params[] = $input['foto'];
            }
            
            if (empty($updates)) {
                sendError('No hay campos para actualizar', 400);
            }
            
            $params[] = $id;
            $result = executeQuery(
                "UPDATE Usuario SET " . implode(', ', $updates) . " WHERE idUsuario = ? AND activo = TRUE",
                $params
            );
            
            if ($result) {
                // Obtener usuario actualizado
                $updatedUser = executeSelect(
                    "SELECT idUsuario, nombreCompleto, correoElectronico, genero, paisNacimiento, 
                            nacionalidad, foto, rol, fechaRegistro, activo 
                     FROM Usuario WHERE idUsuario = ?",
                    [$id]
                );
                sendResponse($updatedUser[0], 200, 'Usuario actualizado correctamente');
            } else {
                sendError('Error al actualizar usuario', 500);
            }
            break;
        
        case 'DELETE':
            // Desactivar usuario (soft delete)
            if (!isset($request[1])) {
                sendError('ID de usuario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Solo admins o el propio usuario pueden desactivar
            if ($currentUser['idUsuario'] != $id && $currentUser['rol'] !== 'admin') {
                sendError('No tienes permiso para desactivar este usuario', 403);
            }
            
            $result = executeQuery(
                "UPDATE Usuario SET activo = FALSE WHERE idUsuario = ?",
                [$id]
            );
            
            if ($result) {
                sendResponse(null, 200, 'Usuario desactivado correctamente');
            } else {
                sendError('Error al desactivar usuario', 500);
            }
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Cambiar contraseña de usuario
 */
function handleCambiarPassword($method, $request, $input) {
    if ($method !== 'PUT') {
        sendError('Método no permitido', 405);
    }
    
    $currentUser = requireAuth();
    
    if (!isset($request[1])) {
        sendError('ID de usuario requerido', 400);
    }
    
    $id = (int)$request[1];
    
    // Solo el propio usuario puede cambiar su contraseña
    if ($currentUser['idUsuario'] != $id) {
        sendError('No tienes permiso para cambiar esta contraseña', 403);
    }
    
    if (!$input || empty($input['contrasenaActual']) || empty($input['contrasenaNueva'])) {
        sendError('Se requiere: contrasenaActual, contrasenaNueva');
    }
    
    // Verificar contraseña actual
    $user = executeSelect(
        "SELECT contrasena FROM Usuario WHERE idUsuario = ? AND activo = TRUE",
        [$id]
    );
    
    if (!$user || !password_verify($input['contrasenaActual'], $user[0]['contrasena'])) {
        sendError('Contraseña actual incorrecta', 401);
    }
    
    // Validar nueva contraseña
    if (strlen($input['contrasenaNueva']) < 6) {
        sendError('La nueva contraseña debe tener al menos 6 caracteres');
    }
    
    // Actualizar contraseña
    $hashedPassword = password_hash($input['contrasenaNueva'], PASSWORD_DEFAULT);
    $result = executeQuery(
        "UPDATE Usuario SET contrasena = ? WHERE idUsuario = ?",
        [$hashedPassword, $id]
    );
    
    if ($result) {
        sendResponse(null, 200, 'Contraseña actualizada correctamente');
    } else {
        sendError('Error al actualizar contraseña', 500);
    }
}

/**
 * Manejar operaciones de publicaciones
 */
function handlePublicaciones($method, $request, $input) {
    // Manejo de subrutas especiales para publicaciones
    if (isset($request[2])) {
        $action = $request[2];
        $id = isset($request[1]) ? (int)$request[1] : null;
        
        if ($action === 'aprobar' && $method === 'PUT') {
            return handleAprobarPublicacion($id);
        } elseif ($action === 'rechazar' && $method === 'PUT') {
            return handleRechazarPublicacion($id, $input);
        } elseif ($action === 'like' && $method === 'POST') {
            return handleLikePublicacion($id);
        } elseif ($action === 'dislike' && $method === 'POST') {
            return handleDislikePublicacion($id);
        } elseif ($action === 'interaccion' && $method === 'DELETE') {
            return handleQuitarInteraccion($id);
        }
    }
    
    // Las publicaciones públicas pueden verse sin auth
    $currentUser = null;
    
    // Requiere auth para POST, PUT, DELETE
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
        $currentUser = requireAuth();
    }
    
    switch ($method) {
        case 'GET':
            // Verificar si se solicitan publicaciones pendientes
            if (isset($request[1]) && $request[1] === 'pendientes') {
                $currentUser = requireAuth();
                requireAdmin($currentUser);
                
                $publicaciones = executeSelect(
                    "SELECT p.*, u.nombreCompleto as autor, m.anio as mundialAnio, c.nombre as categoriaNombre
                     FROM Publicacion p
                     JOIN Usuario u ON p.idUsuario = u.idUsuario
                     JOIN Mundial m ON p.idMundial = m.idMundial
                     JOIN Categoria c ON p.idCategoria = c.idCategoria
                     WHERE p.estado = 'pendiente'
                     ORDER BY p.fechaPublicacion DESC"
                );
                sendResponse($publicaciones, 200, 'Publicaciones pendientes obtenidas correctamente');
                break;
            }
            
            if (isset($request[1])) {
                // Obtener publicación específica
                $id = (int)$request[1];
                $publicacion = executeSelect(
                    "SELECT p.*, u.nombreCompleto as autor, m.anio as mundialAnio, c.nombre as categoriaNombre
                     FROM Publicacion p
                     JOIN Usuario u ON p.idUsuario = u.idUsuario
                     JOIN Mundial m ON p.idMundial = m.idMundial
                     JOIN Categoria c ON p.idCategoria = c.idCategoria
                     WHERE p.idPublicacion = ?", 
                    [$id]
                );
                
                if ($publicacion) {
                    sendResponse($publicacion[0], 200, 'Publicación encontrada');
                } else {
                    sendError('Publicación no encontrada', 404);
                }
            } else {
                // Obtener todas las publicaciones aprobadas
                $publicaciones = executeSelect(
                    "SELECT p.*, u.nombreCompleto as autor, m.anio as mundialAnio, c.nombre as categoriaNombre
                     FROM Publicacion p
                     JOIN Usuario u ON p.idUsuario = u.idUsuario
                     JOIN Mundial m ON p.idMundial = m.idMundial
                     JOIN Categoria c ON p.idCategoria = c.idCategoria
                     WHERE p.estado = 'aprobada'
                     ORDER BY p.fechaPublicacion DESC"
                );
                sendResponse($publicaciones, 200, 'Publicaciones obtenidas correctamente');
            }
            break;
        
        case 'POST':
            // Crear nueva publicación (requiere autenticación)
            if (!$input || empty($input['titulo']) || empty($input['contenido']) || 
                empty($input['idMundial']) || empty($input['idCategoria'])) {
                sendError('Datos incompletos. Se requiere: titulo, contenido, idMundial, idCategoria');
            }
            
            // Usar el ID del usuario autenticado (del middleware)
            $id = executeQuery(
                "INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia) 
                 VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $currentUser['idUsuario'], // ID del usuario autenticado
                    $input['idMundial'],
                    $input['idCategoria'],
                    $input['titulo'],
                    $input['contenido'],
                    $input['urlMultimedia'] ?? null
                ]
            );
            
            if ($id) {
                sendResponse(['idPublicacion' => $id], 201, 'Publicación creada correctamente');
            } else {
                sendError('Error al crear publicación', 500);
            }
            break;
        
        case 'PUT':
            // Actualizar publicación
            if (!isset($request[1])) {
                sendError('ID de publicación requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que la publicación existe y obtener su dueño
            $publicacion = executeSelect(
                "SELECT idUsuario FROM Publicacion WHERE idPublicacion = ?",
                [$id]
            );
            
            if (!$publicacion) {
                sendError('Publicación no encontrada', 404);
            }
            
            // Verificar que el usuario actual es el dueño o es admin
            if ($currentUser['idUsuario'] != $publicacion[0]['idUsuario'] && $currentUser['rol'] !== 'admin') {
                sendError('No tienes permiso para editar esta publicación', 403);
            }
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            // Construir query dinámico
            $updates = [];
            $params = [];
            
            if (isset($input['titulo'])) {
                $updates[] = "titulo = ?";
                $params[] = $input['titulo'];
            }
            if (isset($input['contenido'])) {
                $updates[] = "contenido = ?";
                $params[] = $input['contenido'];
            }
            if (isset($input['urlMultimedia'])) {
                $updates[] = "urlMultimedia = ?";
                $params[] = $input['urlMultimedia'];
            }
            if (isset($input['idMundial'])) {
                $updates[] = "idMundial = ?";
                $params[] = $input['idMundial'];
            }
            if (isset($input['idCategoria'])) {
                $updates[] = "idCategoria = ?";
                $params[] = $input['idCategoria'];
            }
            
            if (empty($updates)) {
                sendError('No hay campos para actualizar', 400);
            }
            
            $params[] = $id;
            $result = executeQuery(
                "UPDATE Publicacion SET " . implode(', ', $updates) . " WHERE idPublicacion = ?",
                $params
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Publicación actualizada correctamente');
            } else {
                sendError('Error al actualizar publicación', 500);
            }
            break;
        
        case 'DELETE':
            // Eliminar publicación
            if (!isset($request[1])) {
                sendError('ID de publicación requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que la publicación existe y obtener su dueño
            $publicacion = executeSelect(
                "SELECT idUsuario FROM Publicacion WHERE idPublicacion = ?",
                [$id]
            );
            
            if (!$publicacion) {
                sendError('Publicación no encontrada', 404);
            }
            
            // Solo el dueño o admin pueden eliminar
            if ($currentUser['idUsuario'] != $publicacion[0]['idUsuario'] && $currentUser['rol'] !== 'admin') {
                sendError('No tienes permiso para eliminar esta publicación', 403);
            }
            
            $result = executeQuery(
                "DELETE FROM Publicacion WHERE idPublicacion = ?",
                [$id]
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Publicación eliminada correctamente');
            } else {
                sendError('Error al eliminar publicación', 500);
            }
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Aprobar publicación (admin)
 */
function handleAprobarPublicacion($id) {
    $currentUser = requireAuth();
    requireAdmin($currentUser);
    
    if (!$id) {
        sendError('ID de publicación requerido', 400);
    }
    
    $result = executeQuery(
        "UPDATE Publicacion SET estado = 'aprobada', fechaAprobacion = NOW() WHERE idPublicacion = ?",
        [$id]
    );
    
    if ($result !== false) {
        sendResponse(null, 200, 'Publicación aprobada correctamente');
    } else {
        sendError('Error al aprobar publicación', 500);
    }
}

/**
 * Rechazar publicación (admin)
 */
function handleRechazarPublicacion($id, $input) {
    $currentUser = requireAuth();
    requireAdmin($currentUser);
    
    if (!$id) {
        sendError('ID de publicación requerido', 400);
    }
    
    $motivo = $input['motivo'] ?? 'No especificado';
    
    $result = executeQuery(
        "UPDATE Publicacion SET estado = 'rechazada', motivoRechazo = ? WHERE idPublicacion = ?",
        [$motivo, $id]
    );
    
    if ($result !== false) {
        sendResponse(null, 200, 'Publicación rechazada correctamente');
    } else {
        sendError('Error al rechazar publicación', 500);
    }
}

/**
 * Dar like a publicación
 */
function handleLikePublicacion($id) {
    $currentUser = requireAuth();
    
    if (!$id) {
        sendError('ID de publicación requerido', 400);
    }
    
    // Verificar si ya existe una interacción
    $existing = executeSelect(
        "SELECT tipo FROM Interaccion WHERE idUsuario = ? AND idPublicacion = ?",
        [$currentUser['idUsuario'], $id]
    );
    
    if ($existing) {
        // Ya existe, actualizar si es diferente
        if ($existing[0]['tipo'] === 'like') {
            sendError('Ya diste like a esta publicación', 409);
        }
        
        // Cambiar de dislike a like
        executeQuery(
            "UPDATE Interaccion SET tipo = 'like', fecha = NOW() WHERE idUsuario = ? AND idPublicacion = ?",
            [$currentUser['idUsuario'], $id]
        );
        executeQuery("UPDATE Publicacion SET dislikes = dislikes - 1, likes = likes + 1 WHERE idPublicacion = ?", [$id]);
    } else {
        // Crear nueva interacción
        executeQuery(
            "INSERT INTO Interaccion (idUsuario, idPublicacion, tipo) VALUES (?, ?, 'like')",
            [$currentUser['idUsuario'], $id]
        );
        executeQuery("UPDATE Publicacion SET likes = likes + 1 WHERE idPublicacion = ?", [$id]);
    }
    
    sendResponse(null, 200, 'Like registrado correctamente');
}

/**
 * Dar dislike a publicación
 */
function handleDislikePublicacion($id) {
    $currentUser = requireAuth();
    
    if (!$id) {
        sendError('ID de publicación requerido', 400);
    }
    
    // Verificar si ya existe una interacción
    $existing = executeSelect(
        "SELECT tipo FROM Interaccion WHERE idUsuario = ? AND idPublicacion = ?",
        [$currentUser['idUsuario'], $id]
    );
    
    if ($existing) {
        // Ya existe, actualizar si es diferente
        if ($existing[0]['tipo'] === 'dislike') {
            sendError('Ya diste dislike a esta publicación', 409);
        }
        
        // Cambiar de like a dislike
        executeQuery(
            "UPDATE Interaccion SET tipo = 'dislike', fecha = NOW() WHERE idUsuario = ? AND idPublicacion = ?",
            [$currentUser['idUsuario'], $id]
        );
        executeQuery("UPDATE Publicacion SET likes = likes - 1, dislikes = dislikes + 1 WHERE idPublicacion = ?", [$id]);
    } else {
        // Crear nueva interacción
        executeQuery(
            "INSERT INTO Interaccion (idUsuario, idPublicacion, tipo) VALUES (?, ?, 'dislike')",
            [$currentUser['idUsuario'], $id]
        );
        executeQuery("UPDATE Publicacion SET dislikes = dislikes + 1 WHERE idPublicacion = ?", [$id]);
    }
    
    sendResponse(null, 200, 'Dislike registrado correctamente');
}

/**
 * Quitar like/dislike
 */
function handleQuitarInteraccion($id) {
    $currentUser = requireAuth();
    
    if (!$id) {
        sendError('ID de publicación requerido', 400);
    }
    
    // Obtener tipo de interacción actual
    $existing = executeSelect(
        "SELECT tipo FROM Interaccion WHERE idUsuario = ? AND idPublicacion = ?",
        [$currentUser['idUsuario'], $id]
    );
    
    if (!$existing) {
        sendError('No tienes interacción con esta publicación', 404);
    }
    
    $tipo = $existing[0]['tipo'];
    
    // Eliminar interacción
    executeQuery(
        "DELETE FROM Interaccion WHERE idUsuario = ? AND idPublicacion = ?",
        [$currentUser['idUsuario'], $id]
    );
    
    // Actualizar contador
    if ($tipo === 'like') {
        executeQuery("UPDATE Publicacion SET likes = likes - 1 WHERE idPublicacion = ?", [$id]);
    } else {
        executeQuery("UPDATE Publicacion SET dislikes = dislikes - 1 WHERE idPublicacion = ?", [$id]);
    }
    
    sendResponse(null, 200, 'Interacción eliminada correctamente');
}

/**
 * Manejar operaciones de comentarios
 */

/**
 * Manejar operaciones de comentarios
 */
function handleComentarios($method, $request, $input) {
    // Manejo de subrutas especiales
    if (isset($request[2])) {
        $action = $request[2];
        $id = isset($request[1]) ? (int)$request[1] : null;
        
        if ($action === 'reportar' && $method === 'POST') {
            return handleReportarComentario($id, $input);
        }
    }
    
    // Requiere auth para POST, PUT, DELETE
    $currentUser = null;
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
        $currentUser = requireAuth();
    }
    
    switch ($method) {
        case 'GET':
            if (isset($request[1])) {
                // Obtener comentarios de una publicación específica
                $idPublicacion = (int)$request[1];
                $comentarios = executeSelect(
                    "SELECT c.*, u.nombreCompleto as autor
                     FROM Comentario c
                     JOIN Usuario u ON c.idUsuario = u.idUsuario
                     WHERE c.idPublicacion = ? AND c.activo = TRUE
                     ORDER BY c.fechaComentario ASC", 
                    [$idPublicacion]
                );
                sendResponse($comentarios, 200, 'Comentarios obtenidos correctamente');
            } else {
                sendError('ID de publicación requerido', 400);
            }
            break;
        
        case 'POST':
            // Crear nuevo comentario (requiere autenticación)
            if (!$input || empty($input['contenido']) || empty($input['idPublicacion'])) {
                sendError('Datos incompletos. Se requiere: contenido, idPublicacion');
            }
            
            // Usar el ID del usuario autenticado (del middleware)
            $id = executeQuery(
                "INSERT INTO Comentario (idPublicacion, idUsuario, contenido) VALUES (?, ?, ?)",
                [$input['idPublicacion'], $currentUser['idUsuario'], $input['contenido']]
            );
            
            if ($id) {
                sendResponse(['idComentario' => $id], 201, 'Comentario creado correctamente');
            } else {
                sendError('Error al crear comentario', 500);
            }
            break;
        
        case 'PUT':
            // Editar comentario
            if (!isset($request[1])) {
                sendError('ID de comentario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que el comentario existe y obtener su dueño
            $comentario = executeSelect(
                "SELECT idUsuario FROM Comentario WHERE idComentario = ? AND activo = TRUE",
                [$id]
            );
            
            if (!$comentario) {
                sendError('Comentario no encontrado', 404);
            }
            
            // Solo el dueño o admin pueden editar
            if ($currentUser['idUsuario'] != $comentario[0]['idUsuario'] && $currentUser['rol'] !== 'admin') {
                sendError('No tienes permiso para editar este comentario', 403);
            }
            
            if (!$input || empty($input['contenido'])) {
                sendError('Contenido requerido', 400);
            }
            
            $result = executeQuery(
                "UPDATE Comentario SET contenido = ?, editado = TRUE, fechaEdicion = NOW() WHERE idComentario = ?",
                [$input['contenido'], $id]
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Comentario actualizado correctamente');
            } else {
                sendError('Error al actualizar comentario', 500);
            }
            break;
        
        case 'DELETE':
            // Eliminar comentario (soft delete)
            if (!isset($request[1])) {
                sendError('ID de comentario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que el comentario existe y obtener su dueño
            $comentario = executeSelect(
                "SELECT idUsuario FROM Comentario WHERE idComentario = ?",
                [$id]
            );
            
            if (!$comentario) {
                sendError('Comentario no encontrado', 404);
            }
            
            // Solo el dueño o admin pueden eliminar
            if ($currentUser['idUsuario'] != $comentario[0]['idUsuario'] && $currentUser['rol'] !== 'admin') {
                sendError('No tienes permiso para eliminar este comentario', 403);
            }
            
            $result = executeQuery(
                "UPDATE Comentario SET activo = FALSE WHERE idComentario = ?",
                [$id]
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Comentario eliminado correctamente');
            } else {
                sendError('Error al eliminar comentario', 500);
            }
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Reportar comentario
 */
function handleReportarComentario($id, $input) {
    $currentUser = requireAuth();
    
    if (!$id) {
        sendError('ID de comentario requerido', 400);
    }
    
    if (!$input || empty($input['motivo'])) {
        sendError('Motivo del reporte requerido', 400);
    }
    
    // Verificar que el comentario existe
    $comentario = executeSelect(
        "SELECT idComentario FROM Comentario WHERE idComentario = ?",
        [$id]
    );
    
    if (!$comentario) {
        sendError('Comentario no encontrado', 404);
    }
    
    // Verificar que no haya reportado antes
    $existing = executeSelect(
        "SELECT idReporte FROM ReporteComentario WHERE idComentario = ? AND idUsuarioReportador = ?",
        [$id, $currentUser['idUsuario']]
    );
    
    if ($existing) {
        sendError('Ya reportaste este comentario', 409);
    }
    
    // Crear reporte
    $idReporte = executeQuery(
        "INSERT INTO ReporteComentario (idComentario, idUsuarioReportador, motivo, descripcion) VALUES (?, ?, ?, ?)",
        [$id, $currentUser['idUsuario'], $input['motivo'], $input['descripcion'] ?? null]
    );
    
    if ($idReporte) {
        // Marcar comentario como reportado
        executeQuery(
            "UPDATE Comentario SET reportado = TRUE WHERE idComentario = ?",
            [$id]
        );
        sendResponse(['idReporte' => $idReporte], 201, 'Reporte creado correctamente');
    } else {
        sendError('Error al crear reporte', 500);
    }
}

/**
 * Manejar operaciones de mundiales
 */
function handleMundiales($method, $request, $input) {
    // Requiere auth para POST, PUT, DELETE (solo admin)
    $currentUser = null;
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
        $currentUser = requireAuth();
        requireAdmin($currentUser);
    }
    
    switch ($method) {
        case 'GET':
            if (isset($request[1])) {
                // Obtener mundial específico
                $id = (int)$request[1];
                $mundial = executeSelect(
                    "SELECT * FROM Mundial WHERE idMundial = ?",
                    [$id]
                );
                
                if ($mundial) {
                    sendResponse($mundial[0], 200, 'Mundial encontrado');
                } else {
                    sendError('Mundial no encontrado', 404);
                }
            } else {
                // Obtener todos los mundiales
                $mundiales = executeSelect(
                    "SELECT * FROM Mundial ORDER BY anio DESC"
                );
                sendResponse($mundiales, 200, 'Mundiales obtenidos correctamente');
            }
            break;
        
        case 'POST':
            // Crear mundial (solo admin)
            if (!$input || empty($input['anio']) || empty($input['paisSede'])) {
                sendError('Datos incompletos. Se requiere: anio, paisSede');
            }
            
            $id = executeQuery(
                "INSERT INTO Mundial (anio, paisSede, logo, nombreOficial, descripcion, fechaInicio, fechaFin, numeroEquipos, estado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $input['anio'],
                    $input['paisSede'],
                    $input['logo'] ?? null,
                    $input['nombreOficial'] ?? null,
                    $input['descripcion'] ?? null,
                    $input['fechaInicio'] ?? null,
                    $input['fechaFin'] ?? null,
                    $input['numeroEquipos'] ?? 32,
                    $input['estado'] ?? 'proximo'
                ]
            );
            
            if ($id) {
                sendResponse(['idMundial' => $id], 201, 'Mundial creado correctamente');
            } else {
                sendError('Error al crear mundial', 500);
            }
            break;
        
        case 'PUT':
            // Actualizar mundial (solo admin)
            if (!isset($request[1])) {
                sendError('ID de mundial requerido', 400);
            }
            
            $id = (int)$request[1];
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            // Construir query dinámico
            $updates = [];
            $params = [];
            
            if (isset($input['anio'])) {
                $updates[] = "anio = ?";
                $params[] = $input['anio'];
            }
            if (isset($input['paisSede'])) {
                $updates[] = "paisSede = ?";
                $params[] = $input['paisSede'];
            }
            if (isset($input['logo'])) {
                $updates[] = "logo = ?";
                $params[] = $input['logo'];
            }
            if (isset($input['nombreOficial'])) {
                $updates[] = "nombreOficial = ?";
                $params[] = $input['nombreOficial'];
            }
            if (isset($input['descripcion'])) {
                $updates[] = "descripcion = ?";
                $params[] = $input['descripcion'];
            }
            if (isset($input['fechaInicio'])) {
                $updates[] = "fechaInicio = ?";
                $params[] = $input['fechaInicio'];
            }
            if (isset($input['fechaFin'])) {
                $updates[] = "fechaFin = ?";
                $params[] = $input['fechaFin'];
            }
            if (isset($input['numeroEquipos'])) {
                $updates[] = "numeroEquipos = ?";
                $params[] = $input['numeroEquipos'];
            }
            if (isset($input['estado'])) {
                $updates[] = "estado = ?";
                $params[] = $input['estado'];
            }
            
            if (empty($updates)) {
                sendError('No hay campos para actualizar', 400);
            }
            
            $params[] = $id;
            $result = executeQuery(
                "UPDATE Mundial SET " . implode(', ', $updates) . " WHERE idMundial = ?",
                $params
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Mundial actualizado correctamente');
            } else {
                sendError('Error al actualizar mundial', 500);
            }
            break;
        
        case 'DELETE':
            // Eliminar mundial (solo admin)
            if (!isset($request[1])) {
                sendError('ID de mundial requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar si tiene publicaciones asociadas
            $publicaciones = executeSelect(
                "SELECT COUNT(*) as total FROM Publicacion WHERE idMundial = ?",
                [$id]
            );
            
            if ($publicaciones && $publicaciones[0]['total'] > 0) {
                sendError('No se puede eliminar el mundial porque tiene publicaciones asociadas', 409);
            }
            
            $result = executeQuery(
                "DELETE FROM Mundial WHERE idMundial = ?",
                [$id]
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Mundial eliminado correctamente');
            } else {
                sendError('Error al eliminar mundial', 500);
            }
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Manejar operaciones de categorías
 */
function handleCategorias($method, $request, $input) {
    // Requiere auth para POST, PUT, DELETE (solo admin)
    $currentUser = null;
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
        $currentUser = requireAuth();
        requireAdmin($currentUser);
    }
    
    switch ($method) {
        case 'GET':
            if (isset($request[1])) {
                // Obtener categoría específica
                $id = (int)$request[1];
                $categoria = executeSelect(
                    "SELECT * FROM Categoria WHERE idCategoria = ?",
                    [$id]
                );
                
                if ($categoria) {
                    sendResponse($categoria[0], 200, 'Categoría encontrada');
                } else {
                    sendError('Categoría no encontrada', 404);
                }
            } else {
                // Obtener todas las categorías activas
                $categorias = executeSelect(
                    "SELECT * FROM Categoria WHERE activa = TRUE ORDER BY nombre ASC"
                );
                sendResponse($categorias, 200, 'Categorías obtenidas correctamente');
            }
            break;
        
        case 'POST':
            // Crear categoría (solo admin)
            if (!$input || empty($input['nombre'])) {
                sendError('Datos incompletos. Se requiere: nombre');
            }
            
            $id = executeQuery(
                "INSERT INTO Categoria (nombre, descripcion, color) VALUES (?, ?, ?)",
                [
                    $input['nombre'],
                    $input['descripcion'] ?? null,
                    $input['color'] ?? '#000000'
                ]
            );
            
            if ($id) {
                sendResponse(['idCategoria' => $id], 201, 'Categoría creada correctamente');
            } else {
                sendError('Error al crear categoría', 500);
            }
            break;
        
        case 'PUT':
            // Actualizar categoría (solo admin)
            if (!isset($request[1])) {
                sendError('ID de categoría requerido', 400);
            }
            
            $id = (int)$request[1];
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            // Construir query dinámico
            $updates = [];
            $params = [];
            
            if (isset($input['nombre'])) {
                $updates[] = "nombre = ?";
                $params[] = $input['nombre'];
            }
            if (isset($input['descripcion'])) {
                $updates[] = "descripcion = ?";
                $params[] = $input['descripcion'];
            }
            if (isset($input['color'])) {
                $updates[] = "color = ?";
                $params[] = $input['color'];
            }
            if (isset($input['activa'])) {
                $updates[] = "activa = ?";
                $params[] = $input['activa'];
            }
            
            if (empty($updates)) {
                sendError('No hay campos para actualizar', 400);
            }
            
            $params[] = $id;
            $result = executeQuery(
                "UPDATE Categoria SET " . implode(', ', $updates) . " WHERE idCategoria = ?",
                $params
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Categoría actualizada correctamente');
            } else {
                sendError('Error al actualizar categoría', 500);
            }
            break;
        
        case 'DELETE':
            // Desactivar categoría (solo admin)
            if (!isset($request[1])) {
                sendError('ID de categoría requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Soft delete - solo desactivar
            $result = executeQuery(
                "UPDATE Categoria SET activa = FALSE WHERE idCategoria = ?",
                [$id]
            );
            
            if ($result !== false) {
                sendResponse(null, 200, 'Categoría desactivada correctamente');
            } else {
                sendError('Error al desactivar categoría', 500);
            }
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

// Nota: Las funciones getDBConnection(), executeSelect() y executeQuery()
// están definidas en config/database.php que ya está incluido arriba
?>