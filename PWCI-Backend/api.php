<?php
/**
 * API RESTful para PWCI (Plataforma Web Copa del Mundo)
 * REFACTORIZADO: Usa SOLO Stored Procedures - NO SQL directo
 * Cumple con requisitos de evaluación académica
 * 
 * @version 2.0
 * @author PWCI Team
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

// ============================================
// UTILIDADES
// ============================================

function sendResponse($data, $status = 200, $message = 'OK') {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => null
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        return str_replace('Bearer ', '', $headers['Authorization']);
    }
    return null;
}

function validateToken($token = null) {
    if (!$token) {
        $token = getAuthToken();
    }
    
    if (!$token) {
        return null;
    }
    
    try {
        $decoded = json_decode(base64_decode(str_replace('_', '/', str_replace('-', '+', explode('.', $token)[1]))));
        
        if (!$decoded || !isset($decoded->userId)) {
            return null;
        }
        
        $usuario = callStoredProcedure('sp_obtener_usuario_por_id', [$decoded->userId]);
        
        if (empty($usuario)) {
            return null;
        }
        
        return $usuario[0];
        
    } catch (Exception $e) {
        return null;
    }
}

function requireAuth() {
    $user = validateToken();
    if (!$user) {
        sendError('No autenticado', 401);
    }
    return $user;
}

function requireAdmin($user) {
    if (!$user || $user['rol'] !== 'admin') {
        sendError('Acceso denegado. Requiere privilegios de administrador', 403);
    }
}

function createToken($userId, $email, $rol) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'userId' => $userId,
        'email' => $email,
        'rol' => $rol,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60)
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    return $base64UrlHeader . "." . $base64UrlPayload . ".signature";
}

// ============================================
// ROUTING
// ============================================

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/PWCI/PWCI-Backend/api.php', '', $uri);
$request = explode('/', trim($uri, '/'));

$input = json_decode(file_get_contents('php://input'), true);

// Soporte para /auth/login y /login, /auth/register y /register
$endpoint = $request[0] ?? '';
if ($endpoint === 'auth' && isset($request[1])) {
    $endpoint = $request[1]; // Usar login o register directamente
    array_shift($request); // Remover 'auth' del array
    $request = array_values($request); // Reindexar
}

// Manejar endpoints especiales de admin y interacciones
if ($endpoint === 'publicaciones' && isset($request[2])) {
    $action = $request[2];
    // Admin endpoints
    if (in_array($action, ['aprobar', 'rechazar', 'pendientes'])) {
        handlePublicacionesAdmin($method, $request, $input);
    }
    // Interacción endpoints: /publicaciones/{id}/like, /publicaciones/{id}/dislike, /publicaciones/{id}/interaccion
    if ($action === 'like') {
        handleLike($method, $request, $input);
    }
    if ($action === 'dislike') {
        handleDislike($method, $request, $input);
    }
    if ($action === 'interaccion') {
        handleDeleteInteraccion($method, $request, $input);
    }
}

switch ($endpoint) {
    case 'register':
        handleRegister($method, $input);
        break;
    case 'login':
        handleLogin($method, $input);
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
    case 'categorias':
        handleCategorias($method, $request, $input);
        break;
    case 'mundiales':
        handleMundiales($method, $request, $input);
        break;
    case 'interacciones':
        handleInteracciones($method, $request, $input);
        break;
    default:
        sendError('Endpoint no encontrado', 404);
}

// ============================================
// HANDLERS - AUTENTICACIÓN
// ============================================

function handleRegister($method, $input) {
    if ($method !== 'POST') {
        sendError('Método no permitido', 405);
    }
    
    // Normalizar campos (aceptar email/correoElectronico y contrasenia/contrasena)
    if (isset($input['email'])) $input['correoElectronico'] = $input['email'];
    if (isset($input['contrasenia'])) $input['contrasena'] = $input['contrasenia'];
    
    if (!$input || empty($input['nombreCompleto']) || empty($input['correoElectronico']) || empty($input['contrasena']) || empty($input['fechaNacimiento'])) {
        sendError('Datos incompletos. Se requiere: nombreCompleto, correoElectronico, contrasena, fechaNacimiento');
    }
    
    // Validar edad (mínimo 12 años)
    $fechaNac = new DateTime($input['fechaNacimiento']);
    $hoy = new DateTime();
    $edad = $hoy->diff($fechaNac)->y;
    
    if ($edad < 12) {
        sendError('Debes tener al menos 12 años para registrarte', 400);
    }
    
    // Verificar si el email ya existe
    $existente = callStoredProcedure('sp_obtener_usuario_por_email', [$input['correoElectronico']]);
    if (!empty($existente)) {
        sendError('El email ya está registrado', 409);
    }
    
    // Hashear contraseña
    $hashedPassword = password_hash($input['contrasena'], PASSWORD_DEFAULT);
    
    // Crear usuario
    $idUsuario = executeSP('sp_registrar_usuario', [
        $input['nombreCompleto'],
        $input['correoElectronico'],
        $hashedPassword,
        $input['fechaNacimiento'],
        $input['foto'] ?? null
    ]);
    
    if ($idUsuario) {
        $token = createToken($idUsuario, $input['correoElectronico'], 'usuario');
        
        sendResponse([
            'token' => $token,
            'user' => [
                'idUsuario' => $idUsuario,
                'nombreCompleto' => $input['nombreCompleto'],
                'correoElectronico' => $input['correoElectronico'],
                'rol' => 'usuario'
            ]
        ], 201, 'Usuario registrado correctamente');
    } else {
        sendError('Error al registrar usuario', 500);
    }
}

function handleLogin($method, $input) {
    if ($method !== 'POST') {
        sendError('Método no permitido', 405);
    }
    
    // Normalizar campos (aceptar email/correoElectronico y contrasenia/contrasena)
    if (isset($input['email'])) $input['correoElectronico'] = $input['email'];
    if (isset($input['contrasenia'])) $input['contrasena'] = $input['contrasenia'];
    
    if (!$input || empty($input['correoElectronico']) || empty($input['contrasena'])) {
        // DEBUG: Ver qué datos llegaron
        error_log('LOGIN ERROR - Input recibido: ' . json_encode($input));
        sendError('Email y contraseña son requeridos');
    }
    
    // DEBUG: Log del email que se está buscando
    error_log('LOGIN - Buscando email: ' . $input['correoElectronico']);
    
    $usuarios = callStoredProcedure('sp_login', [$input['correoElectronico']]);
    
    // DEBUG: Ver resultado del SP
    error_log('LOGIN - Usuarios encontrados: ' . (is_array($usuarios) ? count($usuarios) : 0));
    
    if (empty($usuarios)) {
        error_log('LOGIN ERROR - Usuario no encontrado para email: ' . $input['correoElectronico']);
        sendError('Credenciales inválidas', 401);
    }
    
    $usuario = $usuarios[0];
    
    if (!password_verify($input['contrasena'], $usuario['contrasena'])) {
        sendError('Credenciales inválidas', 401);
    }
    
    $token = createToken($usuario['idUsuario'], $usuario['correoElectronico'], $usuario['rol']);
    
    unset($usuario['contrasena']);
    
    sendResponse([
        'token' => $token,
        'user' => $usuario
    ], 200, 'Login exitoso');
}

// ============================================
// HANDLERS - USUARIOS
// ============================================

function handleUsuarios($method, $request, $input) {
    $currentUser = requireAuth();
    
    switch ($method) {
        case 'GET':
            if (isset($request[1])) {
                // Obtener usuario específico
                $id = (int)$request[1];
                
                $usuario = callStoredProcedure('sp_obtener_usuario_por_id', [$id]);
                
                if (empty($usuario)) {
                    sendError('Usuario no encontrado', 404);
                }
                
                unset($usuario[0]['contrasena']);  // CORREGIDO: era 'contrasenia'
                
                // Obtener estadísticas
                $stats = callStoredProcedure('sp_obtener_estadisticas_usuario', [$id]);
                $usuario[0]['estadisticas'] = $stats[0] ?? null;
                
                // Obtener publicaciones del usuario
                $publicaciones = callStoredProcedure('sp_obtener_publicaciones_usuario', [$id]);
                $usuario[0]['publicaciones'] = $publicaciones;
                
                sendResponse($usuario[0], 200, 'Usuario encontrado');
            } else {
                // Obtener TODOS los usuarios (para admin)
                if ($currentUser['rol'] === 'admin') {
                    $usuarios = callStoredProcedure('sp_obtener_todos_usuarios', []);
                    sendResponse($usuarios, 200, 'Usuarios obtenidos correctamente');
                } else {
                    sendError('ID de usuario requerido', 400);
                }
            }
            break;
            
        case 'PUT':
            if (!isset($request[1])) {
                sendError('ID de usuario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Solo puede editar su propio perfil o ser admin
            if ($currentUser['idUsuario'] !== $id && $currentUser['rol'] !== 'admin') {
                sendError('No autorizado', 403);
            }
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            // Actualizar perfil
            if (isset($input['nombreCompleto']) || isset($input['fechaNacimiento'])) {
                $result = executeSP('sp_actualizar_perfil_usuario', [
                    $id,
                    $input['nombreCompleto'] ?? null,
                    $input['fechaNacimiento'] ?? null
                ]);
            }
            
            // Actualizar foto - CORREGIDO: acepta 'foto' o 'fotoPerfil'
            if (isset($input['foto']) || isset($input['fotoPerfil'])) {
                $foto = $input['foto'] ?? $input['fotoPerfil'];
                $result = executeSP('sp_actualizar_foto_perfil', [$id, $foto]);
            }
            
            sendResponse(null, 200, 'Perfil actualizado correctamente');
            break;
            
        default:
            sendError('Método no permitido', 405);
    }
}

// ============================================
// HANDLERS - PUBLICACIONES
// ============================================

function handlePublicaciones($method, $request, $input) {
    switch ($method) {
        case 'GET':
            if (isset($request[1]) && is_numeric($request[1])) {
                // Obtener publicación específica
                $id = (int)$request[1];
                
                $publicacion = callStoredProcedure('sp_obtener_publicacion_por_id', [$id]);
                
                if (empty($publicacion)) {
                    sendError('Publicación no encontrada', 404);
                }
                
                // Detectar interacción del usuario si está autenticado
                $currentUser = validateToken();
                if ($currentUser) {
                    $interaccion = callStoredProcedure('sp_obtener_interaccion_usuario', [
                        $currentUser['idUsuario'],
                        $id
                    ]);
                    $publicacion[0]['userInteraction'] = !empty($interaccion) ? $interaccion[0]['tipo'] : null;
                }
                
                // Obtener comentarios
                $comentarios = callStoredProcedure('sp_obtener_comentarios', [$id]);
                $publicacion[0]['comentarios'] = $comentarios;
                
                sendResponse($publicacion[0], 200, 'Publicación encontrada');
            } else {
                // Obtener feed de publicaciones
                $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 50;
                $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
                $estado = isset($_GET['estado']) ? $_GET['estado'] : 'aprobada';
                
                // Si pide un estado específico (pendiente, aprobada, rechazada), usar el nuevo SP
                if (in_array($estado, ['pendiente', 'aprobada', 'rechazada'])) {
                    $publicaciones = callStoredProcedure('sp_obtener_publicaciones_por_estado', [$estado]);
                } else {
                    // Por defecto, solo aprobadas - SIN PARÁMETROS
                    $publicaciones = callStoredProcedure('sp_obtener_publicaciones_aprobadas', []);
                }
                
                // Agregar interacción del usuario si está autenticado
                $currentUser = validateToken();
                if ($currentUser && !empty($publicaciones)) {
                    foreach ($publicaciones as &$pub) {
                        $interaccion = callStoredProcedure('sp_obtener_interaccion_usuario', [
                            $currentUser['idUsuario'],
                            $pub['idPublicacion']
                        ]);
                        $pub['userInteraction'] = !empty($interaccion) ? $interaccion[0]['tipo'] : null;
                    }
                }
                
                sendResponse($publicaciones, 200, 'Publicaciones obtenidas correctamente');
            }
            break;
            
        case 'POST':
            $currentUser = requireAuth();
            
            if (!$input || empty($input['titulo']) || empty($input['contenido'])) {
                sendError('Datos incompletos. Se requiere: titulo, contenido', 400);
            }
            
            if (empty($input['idCategoria']) || empty($input['idMundial'])) {
                sendError('Se requiere categoría y mundial', 400);
            }
            
            // CORREGIDO: Aceptar urlMultimedia o imagenURL
            $urlMultimedia = $input['urlMultimedia'] ?? $input['imagenURL'] ?? null;
            
            $idPublicacion = executeSP('sp_crear_publicacion', [
                $input['titulo'],
                $input['contenido'],
                $urlMultimedia,
                $currentUser['idUsuario'],
                (int)$input['idCategoria'],
                (int)$input['idMundial']
            ]);
            
            if ($idPublicacion) {
                sendResponse(['idPublicacion' => $idPublicacion], 201, 'Publicación creada. Pendiente de aprobación');
            } else {
                sendError('Error al crear publicación', 500);
            }
            break;
            
        case 'PUT':
            $currentUser = requireAuth();
            
            if (!isset($request[1])) {
                sendError('ID de publicación requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que sea el autor o admin
            $pub = callStoredProcedure('sp_obtener_publicacion_por_id', [$id]);
            if (empty($pub)) {
                sendError('Publicación no encontrada', 404);
            }
            
            if ($pub[0]['idUsuario'] !== $currentUser['idUsuario'] && $currentUser['rol'] !== 'admin') {
                sendError('No autorizado', 403);
            }
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            // Si solo se está actualizando el estado (admin aprobando/rechazando)
            if (isset($input['estado']) && !isset($input['titulo']) && !isset($input['contenido'])) {
                $result = executeSP('sp_actualizar_estado_publicacion', [
                    $id,
                    $input['estado']
                ]);
                
                sendResponse(null, 200, 'Estado actualizado correctamente');
                break;
            }
            
            // Actualización completa de la publicación
            // CORREGIDO: Aceptar urlMultimedia o imagenURL
            $urlMultimedia = $input['urlMultimedia'] ?? $input['imagenURL'] ?? null;
            
            $result = executeSP('sp_actualizar_publicacion', [
                $id,
                $input['titulo'] ?? $pub[0]['titulo'],
                $input['contenido'] ?? $pub[0]['contenido'],
                $urlMultimedia,
                $input['idCategoria'] ?? $pub[0]['idCategoria'],
                $input['idMundial'] ?? $pub[0]['idMundial']
            ]);
            
            sendResponse(null, 200, 'Publicación actualizada correctamente');
            break;
            
        case 'DELETE':
            $currentUser = requireAuth();
            
            if (!isset($request[1])) {
                sendError('ID de publicación requerido', 400);
            }
            
            $id = (int)$request[1];
            
            // Verificar que sea el autor o admin
            $pub = callStoredProcedure('sp_obtener_publicacion_por_id', [$id]);
            if (empty($pub)) {
                sendError('Publicación no encontrada', 404);
            }
            
            if ($pub[0]['idUsuario'] !== $currentUser['idUsuario'] && $currentUser['rol'] !== 'admin') {
                sendError('No autorizado', 403);
            }
            
            $result = executeSP('sp_eliminar_publicacion', [$id]);
            
            sendResponse(null, 200, 'Publicación eliminada correctamente');
            break;
            
        default:
            sendError('Método no permitido', 405);
    }
}

// ============================================
// HANDLERS - PUBLICACIONES ADMIN
// ============================================

function handlePublicacionesAdmin($method, $request, $input) {
    $currentUser = requireAuth();
    requireAdmin($currentUser);
    
    $action = $request[2];
    
    if ($action === 'aprobar' && $method === 'PUT') {
        $id = (int)$request[1];
        $result = executeSP('sp_aprobar_publicacion', [$id]);
        sendResponse(null, 200, 'Publicación aprobada');
    } elseif ($action === 'rechazar' && $method === 'PUT') {
        $id = (int)$request[1];
        $result = executeSP('sp_rechazar_publicacion', [$id]);
        sendResponse(null, 200, 'Publicación rechazada');
    } elseif ($action === 'pendientes' && $method === 'GET') {
        $pendientes = callStoredProcedure('sp_obtener_publicaciones_pendientes', []);
        sendResponse($pendientes, 200, 'Publicaciones pendientes obtenidas');
    } else {
        sendError('Acción no válida', 400);
    }
}

// ============================================
// HANDLERS - COMENTARIOS
// ============================================

function handleComentarios($method, $request, $input) {
    switch ($method) {
        case 'GET':
            if (isset($_GET['idPublicacion'])) {
                // Obtener comentarios de una publicación específica
                $idPublicacion = (int)$_GET['idPublicacion'];
                $comentarios = callStoredProcedure('sp_obtener_comentarios', [$idPublicacion]);
                sendResponse($comentarios, 200, 'Comentarios obtenidos correctamente');
            } else {
                // Obtener TODOS los comentarios (para admin dashboard)
                $comentarios = callStoredProcedure('sp_obtener_todos_comentarios', []);
                sendResponse($comentarios, 200, 'Todos los comentarios obtenidos');
            }
            break;
            
        case 'POST':
            $currentUser = requireAuth();
            
            if (!$input || empty($input['contenido']) || empty($input['idPublicacion'])) {
                sendError('Datos incompletos. Se requiere: contenido, idPublicacion');
            }
            
            $idComentario = executeSP('sp_crear_comentario', [
                $input['contenido'],
                $currentUser['idUsuario'],
                $input['idPublicacion']
            ]);
            
            if ($idComentario) {
                sendResponse(['idComentario' => $idComentario], 201, 'Comentario creado correctamente');
            } else {
                sendError('Error al crear comentario', 500);
            }
            break;
            
        case 'PUT':
            $currentUser = requireAuth();
            
            if (!isset($request[1])) {
                sendError('ID de comentario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            if (!$input || empty($input['contenido'])) {
                sendError('Contenido requerido', 400);
            }
            
            $result = executeSP('sp_actualizar_comentario', [$id, $input['contenido']]);
            
            sendResponse(null, 200, 'Comentario actualizado correctamente');
            break;
            
        case 'DELETE':
            $currentUser = requireAuth();
            
            if (!isset($request[1])) {
                sendError('ID de comentario requerido', 400);
            }
            
            $id = (int)$request[1];
            
            $result = executeSP('sp_eliminar_comentario', [$id]);
            
            sendResponse(null, 200, 'Comentario eliminado correctamente');
            break;
            
        default:
            sendError('Método no permitido', 405);
    }
}

// ============================================
// HANDLERS - CATEGORÍAS
// ============================================

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
                $categoria = callStoredProcedure('sp_obtener_categoria_por_id', [$id]);
                
                if (empty($categoria)) {
                    sendError('Categoría no encontrada', 404);
                }
                
                sendResponse($categoria[0], 200, 'Categoría encontrada');
            } else {
                // Obtener todas las categorías
                $categorias = callStoredProcedure('sp_obtener_categorias', []);
                sendResponse($categorias, 200, 'Categorías obtenidas correctamente');
            }
            break;
        
        case 'POST':
            if (!$input || empty($input['nombre'])) {
                sendError('Datos incompletos. Se requiere: nombre');
            }
            
            $id = executeSP('sp_crear_categoria', [
                $input['nombre'],
                $input['descripcion'] ?? null,
                $input['color'] ?? '#000000'
            ]);
            
            if ($id) {
                sendResponse(['idCategoria' => $id], 201, 'Categoría creada correctamente');
            } else {
                sendError('Error al crear categoría', 500);
            }
            break;
        
        case 'PUT':
            if (!isset($request[1])) {
                sendError('ID de categoría requerido', 400);
            }
            
            $id = (int)$request[1];
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            $result = executeSP('sp_actualizar_categoria', [
                $id,
                $input['nombre'] ?? null,
                $input['descripcion'] ?? null,
                $input['color'] ?? null,
                isset($input['activa']) ? (int)$input['activa'] : null
            ]);
            
            sendResponse(null, 200, 'Categoría actualizada correctamente');
            break;
        
        case 'DELETE':
            if (!isset($request[1])) {
                sendError('ID de categoría requerido', 400);
            }
            
            $id = (int)$request[1];
            
            $result = executeSP('sp_eliminar_categoria', [$id]);
            
            sendResponse(null, 200, 'Categoría eliminada correctamente');
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

// ============================================
// HANDLERS - MUNDIALES
// ============================================

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
                $mundial = callStoredProcedure('sp_obtener_mundial_por_id', [$id]);
                
                if (empty($mundial)) {
                    sendError('Mundial no encontrado', 404);
                }
                
                sendResponse($mundial[0], 200, 'Mundial encontrado');
            } else {
                // Obtener todos los mundiales
                $mundiales = callStoredProcedure('sp_obtener_mundiales', []);
                sendResponse($mundiales, 200, 'Mundiales obtenidos correctamente');
            }
            break;
        
        case 'POST':
            if (!$input || empty($input['anio']) || empty($input['paisSede'])) {
                sendError('Datos incompletos. Se requiere: anio, paisSede');
            }
            
            $id = executeSP('sp_crear_mundial', [
                $input['anio'],
                $input['paisSede'],
                $input['logo'] ?? null,
                $input['nombreOficial'] ?? null,
                $input['descripcion'] ?? null,
                $input['fechaInicio'] ?? null,
                $input['fechaFin'] ?? null,
                $input['numeroEquipos'] ?? 32,
                $input['estado'] ?? 'proximo'
            ]);
            
            if ($id) {
                sendResponse(['idMundial' => $id], 201, 'Mundial creado correctamente');
            } else {
                sendError('Error al crear mundial', 500);
            }
            break;
        
        case 'PUT':
            if (!isset($request[1])) {
                sendError('ID de mundial requerido', 400);
            }
            
            $id = (int)$request[1];
            
            if (!$input) {
                sendError('Datos requeridos para actualizar', 400);
            }
            
            $result = executeSP('sp_actualizar_mundial', [
                $id,
                $input['anio'] ?? null,
                $input['paisSede'] ?? null,
                $input['logo'] ?? null,
                $input['nombreOficial'] ?? null,
                $input['descripcion'] ?? null,
                $input['fechaInicio'] ?? null,
                $input['fechaFin'] ?? null,
                $input['numeroEquipos'] ?? null,
                $input['estado'] ?? null
            ]);
            
            sendResponse(null, 200, 'Mundial actualizado correctamente');
            break;
        
        case 'DELETE':
            if (!isset($request[1])) {
                sendError('ID de mundial requerido', 400);
            }
            
            $id = (int)$request[1];
            
            $result = executeSP('sp_eliminar_mundial', [$id]);
            
            sendResponse(null, 200, 'Mundial eliminado correctamente');
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

// ============================================
// HANDLERS - INTERACCIONES (LIKES/DISLIKES)
// ============================================

function handleInteracciones($method, $request, $input) {
    $currentUser = requireAuth();
    
    switch ($method) {
        case 'POST':
            if (!$input || empty($input['tipo']) || empty($input['idPublicacion'])) {
                sendError('Datos incompletos. Se requiere: tipo (like/dislike), idPublicacion');
            }
            
            if (!in_array($input['tipo'], ['like', 'dislike'])) {
                sendError('Tipo de interacción inválido. Debe ser: like o dislike', 400);
            }
            
            $id = executeSP('sp_crear_interaccion', [
                $input['tipo'],
                $currentUser['idUsuario'],
                $input['idPublicacion']
            ]);
            
            if ($id) {
                sendResponse(['idInteraccion' => $id], 201, 'Interacción registrada correctamente');
            } else {
                sendError('Error al registrar interacción', 500);
            }
            break;
        
        default:
            sendError('Método no permitido', 405);
    }
}

// Endpoint específico para dar like: POST /publicaciones/{id}/like
function handleLike($method, $request, $input) {
    if ($method !== 'POST') {
        sendError('Método no permitido', 405);
    }
    
    $currentUser = requireAuth();
    $idPublicacion = (int)$request[1];
    
    if (!$idPublicacion) {
        sendError('ID de publicación requerido', 400);
    }
    
    $id = executeSP('sp_crear_interaccion', [
        'like',
        $currentUser['idUsuario'],
        $idPublicacion
    ]);
    
    sendResponse(['idInteraccion' => $id], 200, 'Like registrado correctamente');
}

// Endpoint específico para dar dislike: POST /publicaciones/{id}/dislike
function handleDislike($method, $request, $input) {
    if ($method !== 'POST') {
        sendError('Método no permitido', 405);
    }
    
    $currentUser = requireAuth();
    $idPublicacion = (int)$request[1];
    
    if (!$idPublicacion) {
        sendError('ID de publicación requerido', 400);
    }
    
    $id = executeSP('sp_crear_interaccion', [
        'dislike',
        $currentUser['idUsuario'],
        $idPublicacion
    ]);
    
    sendResponse(['idInteraccion' => $id], 200, 'Dislike registrado correctamente');
}

// Endpoint para eliminar interacción: DELETE /publicaciones/{id}/interaccion
function handleDeleteInteraccion($method, $request, $input) {
    if ($method !== 'DELETE') {
        sendError('Método no permitido', 405);
    }
    
    $currentUser = requireAuth();
    $idPublicacion = (int)$request[1];
    
    if (!$idPublicacion) {
        sendError('ID de publicación requerido', 400);
    }
    
    $result = executeSP('sp_eliminar_interaccion', [
        $currentUser['idUsuario'],
        $idPublicacion
    ]);
    
    sendResponse(null, 200, 'Interacción eliminada correctamente');
}
