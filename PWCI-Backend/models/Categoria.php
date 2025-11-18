<?php
/**
 * Modelo Categoria
 * Maneja todas las operaciones relacionadas con categorías
 */

require_once __DIR__ . '/Database.php';

class Categoria {
    private $db;
    
    public $idCategoria;
    public $nombre;
    public $descripcion;
    public $color;
    public $activa;
    public $fechaCreacion;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Crear una nueva categoría
     * @return int ID de la categoría creada
     */
    public function crear() {
        return $this->db->executeProcedure('sp_crear_categoria', [
            $this->nombre,
            $this->descripcion,
            $this->color
        ]);
    }
    
    /**
     * Obtener todas las categorías activas
     * @return array
     */
    public function obtenerTodas() {
        return $this->db->callProcedure('sp_obtener_categorias', []);
    }
    
    /**
     * Obtener categoría por ID
     * @param int $id
     * @return array|null
     */
    public function obtenerPorId($id) {
        $resultado = $this->db->callProcedure('sp_obtener_categoria_por_id', [$id]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Actualizar una categoría
     * @param int $id
     * @return bool
     */
    public function actualizar($id) {
        return $this->db->executeProcedure('sp_actualizar_categoria', [
            $id,
            $this->nombre,
            $this->descripcion,
            $this->color,
            $this->activa
        ]);
    }
    
    /**
     * Eliminar una categoría (soft delete)
     * @param int $id
     * @return bool
     */
    public function eliminar($id) {
        return $this->db->executeProcedure('sp_eliminar_categoria', [$id]);
    }
}
