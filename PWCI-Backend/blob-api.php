<?php
/**
 * API ENDPOINT PARA MANEJO DE BLOBS
 * Sube y descarga imágenes usando BLOB en MySQL
 */

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config/database.php';

/**
 * Función auxiliar para enviar respuesta JSON
 */
function sendResponse($status, $message, $data = null) {
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

/**
 * Función auxiliar para enviar error
 */
function sendError($message, $status = 400) {
    http_response_code($status);
    sendResponse($status, $message);
}

// Manejar solicitudes
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // ============================================
    // SUBIR IMAGEN (POST)
    // ============================================
    if ($method === 'POST' && $action === 'upload') {
        
        // Validar que se envió un archivo
        if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            sendError('No se recibió ninguna imagen válida');
        }
        
        $file = $_FILES['imagen'];
        $tipo = $_POST['tipo'] ?? ''; // 'perfil' o 'publicacion'
        $id = $_POST['id'] ?? 0;
        
        // Validar tipo
        if (!in_array($tipo, ['perfil', 'publicacion'])) {
            sendError('Tipo inválido. Debe ser "perfil" o "publicacion"');
        }
        
        // Validar que el archivo es una imagen
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $allowedTypes)) {
            sendError('El archivo debe ser una imagen (JPEG, PNG, GIF o WebP)');
        }
        
        // Validar tamaño máximo (5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            sendError('La imagen no debe superar los 5MB');
        }
        
        // Leer el archivo como BLOB
        $imageData = file_get_contents($file['tmp_name']);
        $imageName = $file['name'];
        
        // Guardar en base de datos según tipo
        if ($tipo === 'perfil') {
            $result = callStoredProcedure('sp_subir_foto_blob', [
                $id,
                $imageData,
                $mimeType,
                $imageName
            ]);
        } else {
            $result = callStoredProcedure('sp_subir_multimedia_blob', [
                $id,
                $imageData,
                $mimeType,
                $imageName
            ]);
        }
        
        $filasAfectadas = null;
        if (is_array($result) && isset($result[0]['filasAfectadas'])) {
            $filasAfectadas = (int)$result[0]['filasAfectadas'];
        }

        sendResponse(200, 'Imagen subida correctamente', [
            'tipo' => $tipo,
            'id' => $id,
            'nombre' => $imageName,
            'tamano' => $file['size'],
            'tieneFotoBlob' => $tipo === 'perfil' ? 1 : null,
            'filasAfectadas' => $filasAfectadas
        ]);
    }
    
    // ============================================
    // DESCARGAR IMAGEN (GET)
    // ============================================
    elseif ($method === 'GET' && $action === 'download') {
        
        $tipo = $_GET['tipo'] ?? '';
        $id = $_GET['id'] ?? 0;
        
        if (!in_array($tipo, ['perfil', 'publicacion'])) {
            sendError('Tipo inválido');
        }
        
        // Obtener BLOB de base de datos
        if ($tipo === 'perfil') {
            $result = callStoredProcedure('sp_obtener_foto_blob', [$id]);
            $blobField = 'fotoBlob';
            $mimeField = 'fotoMimeType';
            $nameField = 'fotoNombre';
        } else {
            $result = callStoredProcedure('sp_obtener_multimedia_blob', [$id]);
            $blobField = 'multimediaBlob';
            $mimeField = 'multimediaMimeType';
            $nameField = 'multimediaNombre';
        }
        
        if (!$result || empty($result[0][$blobField])) {
            http_response_code(404);
            sendError('Imagen no encontrada', 404);
        }
        
        $imageData = $result[0][$blobField];
        $mimeType = $result[0][$mimeField];
        $imageName = $result[0][$nameField];
        
        // Enviar la imagen como respuesta
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . $imageName . '"');
        header('Content-Length: ' . strlen($imageData));
        header('Cache-Control: public, max-age=31536000');
        echo $imageData;
        exit;
    }
    
    // ============================================
    // VERIFICAR SI TIENE BLOB (GET)
    // ============================================
    elseif ($method === 'GET' && $action === 'check') {
        
        $id = $_GET['id'] ?? 0;
        $result = callStoredProcedure('sp_verificar_blob_publicacion', [$id]);
        
        if ($result) {
            sendResponse(200, 'Verificación exitosa', $result[0]);
        } else {
            sendError('Publicación no encontrada', 404);
        }
    }
    
    // ============================================
    // ACCIÓN NO VÁLIDA
    // ============================================
    else {
        sendError('Acción no válida. Usa: upload, download, check');
    }
    
} catch (Exception $e) {
    sendError('Error del servidor: ' . $e->getMessage(), 500);
}
