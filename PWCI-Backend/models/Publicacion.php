<?php
/**
 * Modelo Publicacion
 * Maneja todas las operaciones relacionadas con publicaciones
 * Cumple con arquitectura MVC y POO
 */

require_once __DIR__ . '/Database.php';

class Publicacion {
    private $db;
    
    // Propiedades de la publicación
    public $idPublicacion;
    public $titulo;
    public $contenido;
    public $urlMultimedia;
    public $fechaPublicacion;
    public $fechaAprobacion;
    public $estado;
    public $likes;
    public $dislikes;
    public $idUsuario;
    public $idCategoria;
    public $idMundial;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Crear una nueva publicación
     * @return int ID de la publicación creada
     */
    public function crear() {
        return $this->db->executeProcedure('sp_crear_publicacion', [
            $this->titulo,
            $this->contenido,
            $this->urlMultimedia,
            $this->idUsuario,
            $this->idCategoria,
            $this->idMundial
        ]);
    }
    
    /**
     * Obtener publicaciones aprobadas (feed)
     * @param int $limite
     * @param int $offset
     * @return array
     */
    public function obtenerAprobadas($limite = 50, $offset = 0) {
        return $this->db->callProcedure('sp_obtener_publicaciones_aprobadas', [$limite, $offset]);
    }
    
    /**
     * Obtener publicaciones por estado
     * @param string $estado pendiente|aprobada|rechazada
     * @return array
     */
    public function obtenerPorEstado($estado) {
        return $this->db->callProcedure('sp_obtener_publicaciones_por_estado', [$estado]);
    }
    
    /**
     * Obtener publicación por ID
     * @param int $id
     * @return array|null
     */
    public function obtenerPorId($id) {
        $resultado = $this->db->callProcedure('sp_obtener_publicacion_por_id', [$id]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Obtener publicaciones de un usuario
     * @param int $idUsuario
     * @return array
     */
    public function obtenerPorUsuario($idUsuario) {
        return $this->db->callProcedure('sp_obtener_publicaciones_usuario', [$idUsuario]);
    }
    
    /**
     * Obtener publicaciones pendientes (admin)
     * @return array
     */
    public function obtenerPendientes() {
        return $this->db->callProcedure('sp_obtener_publicaciones_pendientes', []);
    }
    
    /**
     * Actualizar publicación
     * @param int $id
     * @return bool
     */
    public function actualizar($id) {
        return $this->db->executeProcedure('sp_actualizar_publicacion', [
            $id,
            $this->titulo,
            $this->contenido,
            $this->urlMultimedia,
            $this->idCategoria,
            $this->idMundial
        ]);
    }
    
    /**
     * Actualizar estado de publicación
     * @param int $id
     * @param string $estado
     * @return bool
     */
    public function actualizarEstado($id, $estado) {
        return $this->db->executeProcedure('sp_actualizar_estado_publicacion', [$id, $estado]);
    }
    
    /**
     * Aprobar publicación (admin)
     * @param int $id
     * @return bool
     */
    public function aprobar($id) {
        return $this->db->executeProcedure('sp_aprobar_publicacion', [$id]);
    }
    
    /**
     * Rechazar publicación (admin)
     * @param int $id
     * @return bool
     */
    public function rechazar($id) {
        return $this->db->executeProcedure('sp_rechazar_publicacion', [$id]);
    }
    
    /**
     * Eliminar publicación
     * @param int $id
     * @return bool
     */
    public function eliminar($id) {
        return $this->db->executeProcedure('sp_eliminar_publicacion', [$id]);
    }
}
