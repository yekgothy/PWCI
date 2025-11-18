<?php
/**
 * Modelo Interaccion
 * Maneja todas las operaciones relacionadas con likes y dislikes
 */

require_once __DIR__ . '/Database.php';

class Interaccion {
    private $db;
    
    public $idInteraccion;
    public $tipo;
    public $fecha;
    public $idUsuario;
    public $idPublicacion;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Crear o actualizar una interacción (like/dislike)
     * @return int ID de la interacción
     */
    public function crear() {
        return $this->db->executeProcedure('sp_crear_interaccion', [
            $this->tipo,
            $this->idUsuario,
            $this->idPublicacion
        ]);
    }
    
    /**
     * Obtener interacción de un usuario en una publicación
     * @param int $idUsuario
     * @param int $idPublicacion
     * @return array|null
     */
    public function obtenerPorUsuarioPublicacion($idUsuario, $idPublicacion) {
        $resultado = $this->db->callProcedure('sp_obtener_interaccion_usuario', [$idUsuario, $idPublicacion]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Eliminar una interacción
     * @param int $idUsuario
     * @param int $idPublicacion
     * @return bool
     */
    public function eliminar($idUsuario, $idPublicacion) {
        return $this->db->executeProcedure('sp_eliminar_interaccion', [$idUsuario, $idPublicacion]);
    }
    
    /**
     * Contar interacciones de una publicación
     * @param int $idPublicacion
     * @return array Con totalLikes y totalDislikes
     */
    public function contarPorPublicacion($idPublicacion) {
        $resultado = $this->db->callProcedure('sp_contar_interacciones', [$idPublicacion]);
        return !empty($resultado) ? $resultado[0] : ['totalLikes' => 0, 'totalDislikes' => 0];
    }
}
