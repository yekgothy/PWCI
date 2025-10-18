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
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Manejar operaciones de publicaciones
 */
function handlePublicaciones($method, $request, $input) {
    // Las publicaciones públicas pueden verse sin auth, pero crear requiere auth
    $currentUser = null;
    
    // Solo requiere auth para POST (crear publicación)
    if ($method === 'POST') {
        $currentUser = requireAuth();
    }
    
    switch ($method) {
        case 'GET':
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
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Manejar operaciones de comentarios
 */
function handleComentarios($method, $request, $input) {
    // Comentar requiere autenticación
    $currentUser = null;
    if ($method === 'POST') {
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
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Manejar operaciones de mundiales
 */
function handleMundiales($method, $request, $input) {
    switch ($method) {
        case 'GET':
            $mundiales = executeSelect(
                "SELECT * FROM Mundial ORDER BY anio DESC"
            );
            sendResponse($mundiales, 200, 'Mundiales obtenidos correctamente');
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

/**
 * Manejar operaciones de categorías
 */
function handleCategorias($method, $request, $input) {
    switch ($method) {
        case 'GET':
            $categorias = executeSelect(
                "SELECT * FROM Categoria WHERE activa = TRUE ORDER BY nombre ASC"
            );
            sendResponse($categorias, 200, 'Categorías obtenidas correctamente');
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

// Nota: Las funciones getDBConnection(), executeSelect() y executeQuery()
// están definidas en config/database.php que ya está incluido arriba
?>