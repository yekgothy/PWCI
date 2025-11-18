<?php
/**
 * Modelo Usuario
 * Maneja todas las operaciones relacionadas con usuarios
 * Cumple con arquitectura MVC y POO
 */

require_once __DIR__ . '/Database.php';

class Usuario {
    private $db;
    
    // Propiedades del usuario
    public $idUsuario;
    public $nombreCompleto;
    public $correoElectronico;
    public $contrasena;
    public $fechaNacimiento;
    public $genero;
    public $paisNacimiento;
    public $nacionalidad;
    public $foto;
    public $rol;
    public $activo;
    public $fechaRegistro;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Registrar un nuevo usuario
     * @return int ID del usuario creado
     */
    public function registrar() {
        return $this->db->executeProcedure('sp_registrar_usuario', [
            $this->nombreCompleto,
            $this->correoElectronico,
            $this->contrasena,
            $this->fechaNacimiento,
            $this->foto
        ]);
    }
    
    /**
     * Login - Obtener usuario por email
     * @param string $email
     * @return array|null Datos del usuario o null
     */
    public function login($email) {
        $resultado = $this->db->callProcedure('sp_login', [$email]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Obtener usuario por ID
     * @param int $id
     * @return array|null
     */
    public function obtenerPorId($id) {
        $resultado = $this->db->callProcedure('sp_obtener_usuario_por_id', [$id]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Obtener usuario por email
     * @param string $email
     * @return array|null
     */
    public function obtenerPorEmail($email) {
        $resultado = $this->db->callProcedure('sp_obtener_usuario_por_email', [$email]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Obtener todos los usuarios (solo admin)
     * @return array
     */
    public function obtenerTodos() {
        return $this->db->callProcedure('sp_obtener_todos_usuarios', []);
    }
    
    /**
     * Actualizar perfil de usuario
     * @param int $id
     * @param string $nombreCompleto
     * @param string $fechaNacimiento
     * @return bool
     */
    public function actualizarPerfil($id, $nombreCompleto, $fechaNacimiento) {
        return $this->db->executeProcedure('sp_actualizar_perfil_usuario', [
            $id,
            $nombreCompleto,
            $fechaNacimiento
        ]);
    }
    
    /**
     * Actualizar foto de perfil
     * @param int $id
     * @param string $foto
     * @return bool
     */
    public function actualizarFoto($id, $foto) {
        return $this->db->executeProcedure('sp_actualizar_foto_perfil', [$id, $foto]);
    }
    
    /**
     * Obtener estadísticas de un usuario
     * @param int $id
     * @return array|null
     */
    public function obtenerEstadisticas($id) {
        $resultado = $this->db->callProcedure('sp_obtener_estadisticas_usuario', [$id]);
        return !empty($resultado) ? $resultado[0] : null;
    }
}
