<?php

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BDM API - Sistema de Base de Datos Mundial</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .header p {
            color: #666;
            font-size: 1.2em;
        }
        .badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin: 0 5px;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .link-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #007bff;
            transition: transform 0.2s;
        }
        .link-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .link-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .link-card p {
            margin: 0 0 15px 0;
            color: #666;
            font-size: 0.9em;
        }
        .link-card a {
            color: #007bff;
            text-decoration: none;
            font-weight: bold;
        }
        .link-card a:hover {
            text-decoration: underline;
        }
        .status {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 BDM API</h1>
            <p>Sistema de Base de Datos Mundial</p>
            <div>
                <span class="badge">PHP 8.0+</span>
                <span class="badge">MySQL</span>
                <span class="badge">REST API</span>
            </div>
        </div>

        <div class="status">
            <h3>📊 Estado del Sistema</h3>
            <?php
            // Verificar estado básico
            try {
                require_once 'config/database.php';
                $pdo = getDBConnection();
                if ($pdo) {
                    echo "<p>✅ <strong>Base de datos:</strong> Conectada correctamente</p>";
                    
                    // Contar tablas usando SHOW TABLES (comando de sistema, no es query de datos)
                    $stmt = $pdo->query("SHOW TABLES");
                    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    echo "<p>📋 <strong>Tablas disponibles:</strong> " . count($tables) . "</p>";
                    
                    // Contar usuarios usando stored procedure
                    $stmt = $pdo->prepare("CALL sp_contar_usuarios()");
                    $stmt->execute();
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $users = $result['total'] ?? 0;
                    echo "<p>👥 <strong>Usuarios registrados:</strong> " . $users . "</p>";
                    $stmt->closeCursor();
                    
                } else {
                    echo "<p>❌ <strong>Base de datos:</strong> Error de conexión</p>";
                }
            } catch (Exception $e) {
                echo "<p>⚠️ <strong>Error:</strong> " . $e->getMessage() . "</p>";
            }
            ?>
            <p>🕒 <strong>Último check:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
        </div>

        <div class="section">
            <h2>🌐 Endpoints de la API</h2>
            <div class="links">
                <div class="link-card">
                    <h3>Estado de la API</h3>
                    <p>Verificar que la API esté funcionando correctamente</p>
                    <a href="api.php/status" target="_blank">api.php/status</a>
                </div>
                
                <div class="link-card">
                    <h3>Usuarios</h3>
                    <p>Gestión de usuarios del sistema</p>
                    <a href="api.php/usuarios" target="_blank">api.php/usuarios</a>
                </div>
                
                <div class="link-card">
                    <h3>Publicaciones</h3>
                    <p>Publicaciones de los usuarios</p>
                    <a href="api.php/publicaciones" target="_blank">api.php/publicaciones</a>
                </div>
                
                <div class="link-card">
                    <h3>Comentarios</h3>
                    <p>Comentarios en las publicaciones</p>
                    <a href="api.php/comentarios/1" target="_blank">api.php/comentarios/{id}</a>
                </div>
                
                <div class="link-card">
                    <h3>Mundiales</h3>
                    <p>Información de mundiales de fútbol</p>
                    <a href="api.php/mundiales" target="_blank">api.php/mundiales</a>
                </div>
                
                <div class="link-card">
                    <h3>Categorías</h3>
                    <p>Categorías para clasificar publicaciones</p>
                    <a href="api.php/categorias" target="_blank">api.php/categorias</a>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🛠️ Herramientas de Desarrollo</h2>
            <div class="links">
                <div class="link-card">
                    <h3>Test de Conexión</h3>
                    <p>Verificar conexión a la base de datos</p>
                    <a href="utils/test_connection.php" target="_blank">utils/test_connection.php</a>
                </div>
                
                <div class="link-card">
                    <h3>phpMyAdmin</h3>
                    <p>Gestión de base de datos</p>
                    <a href="../phpmyadmin" target="_blank">phpmyadmin</a>
                </div>
                
                <div class="link-card">
                    <h3>Documentación</h3>
                    <p>Guía de instalación y uso</p>
                    <a href="docs/SETUP_RAPIDO.md" target="_blank">Guía Rápida</a>
                </div>
                
                <div class="link-card">
                    <h3>Modelo ER</h3>
                    <p>Diagrama de la base de datos</p>
                    <a href="assets/MODELO E-R.jpg" target="_blank">Ver Diagrama</a>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>🚀 BDM Backend API - Desarrollado con PHP y MySQL</p>
            <p><small>Fecha de generación: <?php echo date('Y-m-d H:i:s'); ?></small></p>
        </div>
    </div>
</body>
</html>