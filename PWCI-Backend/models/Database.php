<?php
/**
 * Clase Database - Manejo de conexión a la base de datos
 * Implementa Singleton pattern para una única instancia
 * Cumple con requisitos de POO para evaluación académica
 */

class Database {
    private static $instance = null;
    private $connection;
    
    // Configuración de la base de datos
    private $host = 'localhost';
    private $dbname = 'BDM';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    
    /**
     * Constructor privado para implementar Singleton
     */
    private function __construct() {
        $this->connect();
    }
    
    /**
     * Obtener instancia única de la base de datos
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Establecer conexión con la base de datos
     */
    private function connect() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }
    
    /**
     * Obtener la conexión PDO
     * @return PDO
     */
    public function getConnection() {
        return $this->connection;
    }
    
    /**
     * Ejecutar un Stored Procedure que devuelve resultados (SELECT)
     * @param string $procedureName Nombre del procedimiento almacenado
     * @param array $params Parámetros del procedimiento
     * @return array Resultados del procedimiento
     */
    public function callProcedure($procedureName, $params = []) {
        try {
            $placeholders = str_repeat('?,', count($params));
            $placeholders = rtrim($placeholders, ',');
            
            $sql = "CALL {$procedureName}({$placeholders})";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            $results = $stmt->fetchAll();
            $stmt->closeCursor();
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception("Error al ejecutar procedimiento {$procedureName}: " . $e->getMessage());
        }
    }
    
    /**
     * Ejecutar un Stored Procedure que NO devuelve resultados o devuelve ID (INSERT/UPDATE/DELETE)
     * @param string $procedureName Nombre del procedimiento almacenado
     * @param array $params Parámetros del procedimiento
     * @return int|bool ID insertado o TRUE si exitoso
     */
    public function executeProcedure($procedureName, $params = []) {
        try {
            $placeholders = str_repeat('?,', count($params));
            $placeholders = rtrim($placeholders, ',');
            
            $sql = "CALL {$procedureName}({$placeholders})";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            
            // Intentar obtener el ID insertado
            $result = $stmt->fetch();
            $stmt->closeCursor();
            
            if ($result && isset($result['idUsuario'])) return (int)$result['idUsuario'];
            if ($result && isset($result['idPublicacion'])) return (int)$result['idPublicacion'];
            if ($result && isset($result['idCategoria'])) return (int)$result['idCategoria'];
            if ($result && isset($result['idMundial'])) return (int)$result['idMundial'];
            if ($result && isset($result['idComentario'])) return (int)$result['idComentario'];
            if ($result && isset($result['idInteraccion'])) return (int)$result['idInteraccion'];
            
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error al ejecutar procedimiento {$procedureName}: " . $e->getMessage());
        }
    }
    
    /**
     * Prevenir clonación de la instancia
     */
    private function __clone() {}
    
    /**
     * Prevenir deserialización de la instancia
     */
    public function __wakeup() {
        throw new Exception("No se puede deserializar un Singleton");
    }
}
