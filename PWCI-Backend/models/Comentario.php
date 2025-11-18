<?php
/**
 * Modelo Comentario
 * Maneja todas las operaciones relacionadas con comentarios
 */

require_once __DIR__ . '/Database.php';

class Comentario {
    private $db;
    
    public $idComentario;
    public $contenido;
    public $fechaComentario;
    public $editado;
    public $fechaEdicion;
    public $activo;
    public $idUsuario;
    public $idPublicacion;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Crear un nuevo comentario
     * @return int ID del comentario creado
     */
    public function crear() {
        return $this->db->executeProcedure('sp_crear_comentario', [
            $this->contenido,
            $this->idUsuario,
            $this->idPublicacion
        ]);
    }
    
    /**
     * Obtener comentarios de una publicación
     * @param int $idPublicacion
     * @return array
     */
    public function obtenerPorPublicacion($idPublicacion) {
        return $this->db->callProcedure('sp_obtener_comentarios', [$idPublicacion]);
    }
    
    /**
     * Obtener todos los comentarios del sistema (admin)
     * @return array
     */
    public function obtenerTodos() {
        return $this->db->callProcedure('sp_obtener_todos_comentarios', []);
    }
    
    /**
     * Actualizar un comentario
     * @param int $id
     * @param string $contenido
     * @return bool
     */
    public function actualizar($id, $contenido) {
        return $this->db->executeProcedure('sp_actualizar_comentario', [$id, $contenido]);
    }
    
    /**
     * Eliminar un comentario (soft delete)
     * @param int $id
     * @return bool
     */
    public function eliminar($id) {
        return $this->db->executeProcedure('sp_eliminar_comentario', [$id]);
    }
}
