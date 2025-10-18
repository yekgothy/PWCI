<?php
/**
 * Configuración de conexión a la base de datos MySQL
 * 
 * Este archivo contiene la configuración para conectarse a la base de datos BDM
 * usando XAMPP con MySQL
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');      // Servidor de la base de datos (XAMPP usa localhost)
define('DB_NAME', 'bdm');           // Nombre de la base de datos
define('DB_USER', 'root');          // Usuario de MySQL (XAMPP usa 'root' por defecto)
define('DB_PASS', 'root');              // Contraseña (XAMPP no tiene contraseña por defecto)
define('DB_CHARSET', 'utf8mb4');    // Charset para soporte completo de UTF-8

/**
 * Clase para manejar la conexión a la base de datos
 */
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    private $connection = null;

    /**
     * Obtener la conexión a la base de datos
     * @return PDO|null
     */
    public function getConnection() {
        try {
            // Crear la cadena de conexión DSN (Data Source Name)
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            
            // Opciones de PDO para mejor seguridad y rendimiento
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,    // Lanzar excepciones en caso de error
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Fetch asociativo por defecto
                PDO::ATTR_EMULATE_PREPARES => false,             // Usar prepared statements reales
                PDO::ATTR_PERSISTENT => false,                   // No usar conexiones persistentes
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4" // Configurar charset
            ];

            // Crear la conexión PDO
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
            
            return $this->connection;
            
        } catch(PDOException $e) {
            // En caso de error, mostrar mensaje y detener ejecución
            echo "Error de conexión: " . $e->getMessage();
            return null;
        }
    }

    /**
     * Cerrar la conexión a la base de datos
     */
    public function closeConnection() {
        $this->connection = null;
    }

    /**
     * Verificar si la conexión está activa
     * @return bool
     */
    public function isConnected() {
        return $this->connection !== null;
    }
}

/**
 * Función helper para obtener una conexión rápida
 * @return PDO|null
 */
function getDBConnection() {
    $database = new Database();
    return $database->getConnection();
}

/**
 * Función para ejecutar queries SELECT de manera segura
 * @param string $query
 * @param array $params
 * @return array|false
 */
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

/**
 * Función para ejecutar queries INSERT, UPDATE, DELETE
 * @param string $query
 * @param array $params
 * @return bool|int (true/false para UPDATE/DELETE, ID insertado para INSERT)
 */
function executeQuery($query, $params = []) {
    try {
        $pdo = getDBConnection();
        if (!$pdo) return false;

        $stmt = $pdo->prepare($query);
        $result = $stmt->execute($params);
        
        // Si es INSERT, devolver el ID insertado
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