<?php
/**
 * API Básica para el sistema BDM
 * 
 * Este archivo proporciona endpoints básicos para interactuar con la base de datos
 * Incluye operaciones CRUD para las principales entidades
 */

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

/**
 * Función para enviar respuesta JSON
 */
function sendResponse($data, $status = 200, $message = '') {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Función para manejar errores
 */
function sendError($message, $status = 400) {
    sendResponse(null, $status, $message);
}

// Obtener método HTTP y ruta
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
$endpoint = $request[0] ?? '';

// Obtener datos JSON del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

// Router básico
switch ($endpoint) {
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

/**
 * Manejar operaciones de usuarios
 */
function handleUsuarios($method, $request, $input) {
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
                // Obtener todos los usuarios
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
            // Crear nueva publicación
            if (!$input || empty($input['titulo']) || empty($input['contenido']) || 
                empty($input['idUsuario']) || empty($input['idMundial']) || empty($input['idCategoria'])) {
                sendError('Datos incompletos. Se requiere: titulo, contenido, idUsuario, idMundial, idCategoria');
            }
            
            $id = executeQuery(
                "INSERT INTO Publicacion (idUsuario, idMundial, idCategoria, titulo, contenido, urlMultimedia) 
                 VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $input['idUsuario'],
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
            // Crear nuevo comentario
            if (!$input || empty($input['contenido']) || empty($input['idUsuario']) || empty($input['idPublicacion'])) {
                sendError('Datos incompletos. Se requiere: contenido, idUsuario, idPublicacion');
            }
            
            $id = executeQuery(
                "INSERT INTO Comentario (idPublicacion, idUsuario, contenido) VALUES (?, ?, ?)",
                [$input['idPublicacion'], $input['idUsuario'], $input['contenido']]
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
?>