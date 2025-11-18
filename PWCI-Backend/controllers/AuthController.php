<?php
/**
 * Controlador de Autenticación
 * Maneja registro y login de usuarios
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Usuario.php';

class AuthController extends BaseController {
    private $usuarioModel;
    
    public function __construct() {
        $this->usuarioModel = new Usuario();
    }
    
    /**
     * Registrar un nuevo usuario
     * POST /register
     */
    public function register() {
        $input = $this->getInput();
        
        // Normalizar campos (aceptar email/correoElectronico y contrasenia/contrasena)
        if (isset($input['email'])) $input['correoElectronico'] = $input['email'];
        if (isset($input['contrasenia'])) $input['contrasena'] = $input['contrasenia'];
        
        // Validar datos requeridos
        if (empty($input['nombreCompleto']) || empty($input['correoElectronico']) || 
            empty($input['contrasena']) || empty($input['fechaNacimiento'])) {
            $this->sendError('Datos incompletos. Se requiere: nombreCompleto, correoElectronico, contrasena, fechaNacimiento');
        }
        
        // Validar edad mínima (12 años)
        $fechaNac = new DateTime($input['fechaNacimiento']);
        $hoy = new DateTime();
        $edad = $hoy->diff($fechaNac)->y;
        
        if ($edad < 12) {
            $this->sendError('Debes tener al menos 12 años para registrarte', 400);
        }
        
        // Verificar si el email ya existe
        $existente = $this->usuarioModel->obtenerPorEmail($input['correoElectronico']);
        if ($existente) {
            $this->sendError('El email ya está registrado', 409);
        }
        
        // Hashear contraseña
        $hashedPassword = password_hash($input['contrasena'], PASSWORD_DEFAULT);
        
        // Crear usuario
        $this->usuarioModel->nombreCompleto = $input['nombreCompleto'];
        $this->usuarioModel->correoElectronico = $input['correoElectronico'];
        $this->usuarioModel->contrasena = $hashedPassword;
        $this->usuarioModel->fechaNacimiento = $input['fechaNacimiento'];
        $this->usuarioModel->foto = $input['foto'] ?? null;
        
        try {
            $idUsuario = $this->usuarioModel->registrar();
            
            $token = $this->createToken($idUsuario, $input['correoElectronico'], 'usuario');
            
            $this->sendResponse([
                'token' => $token,
                'user' => [
                    'idUsuario' => $idUsuario,
                    'nombreCompleto' => $input['nombreCompleto'],
                    'correoElectronico' => $input['correoElectronico'],
                    'rol' => 'usuario'
                ]
            ], 201, 'Usuario registrado correctamente');
        } catch (Exception $e) {
            $this->sendError('Error al registrar usuario: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Login de usuario
     * POST /login
     */
    public function login() {
        $input = $this->getInput();
        
        // Normalizar campos
        if (isset($input['email'])) $input['correoElectronico'] = $input['email'];
        if (isset($input['contrasenia'])) $input['contrasena'] = $input['contrasenia'];
        
        if (empty($input['correoElectronico']) || empty($input['contrasena'])) {
            $this->sendError('Email y contraseña son requeridos');
        }
        
        try {
            $usuario = $this->usuarioModel->login($input['correoElectronico']);
            
            if (!$usuario) {
                $this->sendError('Credenciales incorrectas', 401);
            }
            
            if (!password_verify($input['contrasena'], $usuario['contrasena'])) {
                $this->sendError('Credenciales incorrectas', 401);
            }
            
            if (!$usuario['activo']) {
                $this->sendError('Usuario inactivo', 403);
            }
            
            $token = $this->createToken($usuario['idUsuario'], $usuario['correoElectronico'], $usuario['rol']);
            
            unset($usuario['contrasena']);
            
            $this->sendResponse([
                'token' => $token,
                'user' => $usuario
            ], 200, 'Login exitoso');
        } catch (Exception $e) {
            $this->sendError('Error en el login: ' . $e->getMessage(), 500);
        }
    }
}
