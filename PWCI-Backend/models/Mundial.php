<?php
/**
 * Modelo Mundial
 * Maneja todas las operaciones relacionadas con mundiales
 */

require_once __DIR__ . '/Database.php';

class Mundial {
    private $db;
    
    public $idMundial;
    public $anio;
    public $paisSede;
    public $logo;
    public $nombreOficial;
    public $descripcion;
    public $fechaInicio;
    public $fechaFin;
    public $numeroEquipos;
    public $estado;
    public $fechaCreacion;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Crear un nuevo mundial
     * @return int ID del mundial creado
     */
    public function crear() {
        return $this->db->executeProcedure('sp_crear_mundial', [
            $this->anio,
            $this->paisSede,
            $this->logo,
            $this->nombreOficial,
            $this->descripcion,
            $this->fechaInicio,
            $this->fechaFin,
            $this->numeroEquipos,
            $this->estado
        ]);
    }
    
    /**
     * Obtener todos los mundiales
     * @return array
     */
    public function obtenerTodos() {
        return $this->db->callProcedure('sp_obtener_mundiales', []);
    }
    
    /**
     * Obtener mundial por ID
     * @param int $id
     * @return array|null
     */
    public function obtenerPorId($id) {
        $resultado = $this->db->callProcedure('sp_obtener_mundial_por_id', [$id]);
        return !empty($resultado) ? $resultado[0] : null;
    }
    
    /**
     * Actualizar un mundial
     * @param int $id
     * @return bool
     */
    public function actualizar($id) {
        return $this->db->executeProcedure('sp_actualizar_mundial', [
            $id,
            $this->anio,
            $this->paisSede,
            $this->logo,
            $this->nombreOficial,
            $this->descripcion,
            $this->fechaInicio,
            $this->fechaFin,
            $this->numeroEquipos,
            $this->estado
        ]);
    }
    
    /**
     * Eliminar un mundial
     * @param int $id
     * @return bool
     */
    public function eliminar($id) {
        return $this->db->executeProcedure('sp_eliminar_mundial', [$id]);
    }
}
