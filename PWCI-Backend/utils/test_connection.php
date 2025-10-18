<?php
/**
 * Archivo para probar la conexión a la base de datos MySQL
 * 
 * Este archivo verifica que la conexión con la base de datos funcione correctamente
 * y muestra información básica sobre las tablas disponibles
 */

// Incluir el archivo de configuración de la base de datos
require_once '../config/database.php';

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba de Conexión MySQL - BDM</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            color: #28a745;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .error {
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .info {
            color: #0c5460;
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-success { background-color: #28a745; }
        .status-error { background-color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 Prueba de Conexión MySQL - Base de Datos BDM</h1>
        
        <?php
        // Intentar conectar a la base de datos
        echo "<h2>1. Probando conexión a la base de datos...</h2>";
        
        $database = new Database();
        $pdo = $database->getConnection();
        
        if ($pdo) {
            echo '<div class="success">';
            echo '<span class="status-indicator status-success"></span>';
            echo '<strong>¡Conexión exitosa!</strong> Se ha establecido correctamente la conexión con la base de datos BDM.';
            echo '</div>';
            
            // Mostrar información de la conexión
            echo '<div class="info">';
            echo '<h3>📊 Información de la conexión:</h3>';
            echo '<ul>';
            echo '<li><strong>Servidor:</strong> ' . DB_HOST . '</li>';
            echo '<li><strong>Base de datos:</strong> ' . DB_NAME . '</li>';
            echo '<li><strong>Usuario:</strong> ' . DB_USER . '</li>';
            echo '<li><strong>Charset:</strong> ' . DB_CHARSET . '</li>';
            echo '</ul>';
            echo '</div>';
            
            // Listar las tablas de la base de datos
            echo "<h2>2. Tablas disponibles en la base de datos:</h2>";
            
            try {
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                if (!empty($tables)) {
                    echo '<table>';
                    echo '<thead><tr><th>Nombre de la Tabla</th><th>Número de Registros</th><th>Estado</th></tr></thead>';
                    echo '<tbody>';
                    
                    foreach ($tables as $table) {
                        // Contar registros en cada tabla
                        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
                        $count = $countStmt->fetchColumn();
                        
                        echo '<tr>';
                        echo '<td><strong>' . htmlspecialchars($table) . '</strong></td>';
                        echo '<td>' . number_format($count) . ' registros</td>';
                        echo '<td><span class="status-indicator status-success"></span>Activa</td>';
                        echo '</tr>';
                    }
                    
                    echo '</tbody>';
                    echo '</table>';
                } else {
                    echo '<div class="info">No se encontraron tablas en la base de datos. Asegúrate de haber ejecutado el archivo database.sql</div>';
                }
                
            } catch (PDOException $e) {
                echo '<div class="error">Error al obtener las tablas: ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
            
            // Probar una consulta básica
            echo "<h2>3. Prueba de consulta básica:</h2>";
            
            try {
                // Intentar hacer una consulta simple a la tabla Usuario (si existe)
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM Usuario");
                $result = $stmt->fetch();
                
                echo '<div class="success">';
                echo '<span class="status-indicator status-success"></span>';
                echo '<strong>Consulta exitosa!</strong> La tabla Usuario tiene ' . $result['total'] . ' registros.';
                echo '</div>';
                
            } catch (PDOException $e) {
                echo '<div class="info">Nota: No se pudo consultar la tabla Usuario. Esto es normal si aún no has ejecutado el archivo database.sql</div>';
            }
            
            // Información adicional
            echo "<h2>4. Siguientes pasos:</h2>";
            echo '<div class="info">';
            echo '<h3>✅ Para completar la configuración:</h3>';
            echo '<ol>';
            echo '<li><strong>Crear la base de datos:</strong> Ve a phpMyAdmin (http://localhost/phpmyadmin) y ejecuta el archivo database.sql</li>';
            echo '<li><strong>Verificar conexión:</strong> Recarga esta página para ver las tablas creadas</li>';
            echo '<li><strong>Desarrollar API:</strong> Usa las funciones de database.php para crear tus endpoints</li>';
            echo '</ol>';
            echo '</div>';
            
        } else {
            echo '<div class="error">';
            echo '<span class="status-indicator status-error"></span>';
            echo '<strong>Error de conexión!</strong> No se pudo conectar a la base de datos.';
            echo '</div>';
            
            echo '<div class="info">';
            echo '<h3>🔧 Posibles soluciones:</h3>';
            echo '<ul>';
            echo '<li>Verifica que XAMPP esté ejecutándose (Apache y MySQL)</li>';
            echo '<li>Confirma que MySQL esté corriendo en el puerto 3306</li>';
            echo '<li>Verifica las credenciales en config/database.php</li>';
            echo '<li>Asegúrate de que la base de datos "BDM" exista</li>';
            echo '</ul>';
            echo '</div>';
        }
        ?>
        
        <hr style="margin: 30px 0;">
        <p><small>📅 Generado el: <?php echo date('Y-m-d H:i:s'); ?></small></p>
    </div>
</body>
</html>