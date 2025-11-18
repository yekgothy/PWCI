<?php
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri_clean = str_replace('/PWCI/PWCI-Backend/api.php', '', $uri);
$request = explode('/', trim($uri_clean, '/'));

echo json_encode([
    'REQUEST_METHOD' => $method,
    'REQUEST_URI_RAW' => $_SERVER['REQUEST_URI'],
    'REQUEST_URI_PATH' => $uri,
    'URI_CLEAN' => $uri_clean,
    'REQUEST_ARRAY' => $request,
    'ENDPOINT' => $request[0] ?? '',
    'GET_PARAMS' => $_GET,
    'POST_PARAMS' => $_POST,
    'PHP_INPUT' => file_get_contents('php://input')
], JSON_PRETTY_PRINT);
