<?php
// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'bdm');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    private $connection = null;

    public function getConnection() {
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
            return $this->connection;
            
        } catch(PDOException $e) {
            echo "Error de conexión: " . $e->getMessage();
            return null;
        }
    }

    public function closeConnection() {
        $this->connection = null;
    }

    public function isConnected() {
        return $this->connection !== null;
    }
}

function getDBConnection() {
    $database = new Database();
    return $database->getConnection();
}

function executeSelect($query, $params = []) {
    try {
        $pdo = getDBConnection();
        if (!$pdo) return false;

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
        
    } catch (PDOException $e) {
        error_log("Error en SELECT: " . $e->getMessage());
        return false;
    }
}

function executeQuery($query, $params = []) {
    try {
        $pdo = getDBConnection();
        if (!$pdo) return false;

        $stmt = $pdo->prepare($query);
        $result = $stmt->execute($params);
        
        
        if (stripos($query, 'INSERT') === 0) {
            return $pdo->lastInsertId();
        }
        
        return $result;
        
    } catch (PDOException $e) {
        error_log("Error en query: " . $e->getMessage());
        return false;
    }
}

/**
 * Ejecutar un Stored Procedure que devuelve datos (SELECT)
 * @param string $procedureName Nombre del SP (ej: 'sp_obtener_categorias')
 * @param array $params Parámetros del SP
 * @return array|false Array de resultados o false si falla
 */
function callStoredProcedure($procedureName, $params = []) {
    try {
        $pdo = getDBConnection();
        if (!$pdo) return false;

        // Construir CALL con placeholders
        $placeholders = implode(',', array_fill(0, count($params), '?'));
        $sql = "CALL $procedureName($placeholders)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cerrar el cursor para limpiar
        $stmt->closeCursor();
        
        return $results;
        
    } catch (PDOException $e) {
        error_log("Error en callStoredProcedure ($procedureName): " . $e->getMessage());
        return false;
    }
}

/**
 * Ejecutar un Stored Procedure que modifica datos (INSERT/UPDATE/DELETE)
 * Devuelve el ID insertado o true/false
 * @param string $procedureName Nombre del SP
 * @param array $params Parámetros del SP
 * @return int|bool ID insertado o true/false
 */
function executeSP($procedureName, $params = []) {
    try {
        $pdo = getDBConnection();
        if (!$pdo) return false;

        // Construir CALL con placeholders
        $placeholders = implode(',', array_fill(0, count($params), '?'));
        $sql = "CALL $procedureName($placeholders)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        // Intentar obtener el ID si el SP devuelve un resultado
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Cerrar cursor
        $stmt->closeCursor();
        
        if ($row) {
            // Si el SP devolvió algo, buscar un ID
            $firstValue = reset($row);
            if (is_numeric($firstValue)) {
                return (int)$firstValue;
            }
        }
        
        return $result;
        
    } catch (PDOException $e) {
        error_log("Error en executeSP ($procedureName): " . $e->getMessage());
        return false;
    }
}
?>