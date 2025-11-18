<?php
/**
 * Controlador Base
 * Contiene métodos comunes para todos los controladores
 */

class BaseController {
    
    /**
     * Enviar respuesta JSON exitosa
     */
    protected function sendResponse($data, $status = 200, $message = 'OK') {
        http_response_code($status);
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    /**
     * Enviar respuesta JSON de error
     */
    protected function sendError($message, $status = 400) {
        http_response_code($status);
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    /**
     * Obtener token de autorización de los headers
     */
    protected function getAuthToken() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            return str_replace('Bearer ', '', $headers['Authorization']);
        }
        return null;
    }
    
    /**
     * Validar token JWT básico
     */
    protected function validateToken($token = null) {
        if (!$token) {
            $token = $this->getAuthToken();
        }
        
        if (!$token) {
            return null;
        }
        
        try {
            $decoded = json_decode(base64_decode(str_replace('_', '/', str_replace('-', '+', explode('.', $token)[1]))));
            
            if (!$decoded || !isset($decoded->userId)) {
                return null;
            }
            
            require_once __DIR__ . '/../models/Usuario.php';
            $usuarioModel = new Usuario();
            $usuario = $usuarioModel->obtenerPorId($decoded->userId);
            
            return $usuario;
            
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Requerir autenticación
     */
    protected function requireAuth() {
        $user = $this->validateToken();
        if (!$user) {
            $this->sendError('No autenticado', 401);
        }
        return $user;
    }
    
    /**
     * Requerir permisos de administrador
     */
    protected function requireAdmin($user) {
        if (!$user || $user['rol'] !== 'admin') {
            $this->sendError('Acceso denegado. Requiere privilegios de administrador', 403);
        }
    }
    
    /**
     * Crear token JWT básico
     */
    protected function createToken($userId, $email, $rol) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'userId' => $userId,
            'email' => $email,
            'rol' => $rol,
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60) // 7 días
        ]);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        return $base64UrlHeader . "." . $base64UrlPayload . ".signature";
    }
    
    /**
     * Obtener input JSON de la petición
     */
    protected function getInput() {
        return json_decode(file_get_contents('php://input'), true);
    }
}
