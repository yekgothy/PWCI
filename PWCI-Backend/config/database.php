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
?>