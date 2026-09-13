<?php
// Gemeinsamer Kopf für alle Endpunkte: JSON-Antworten, DB-Verbindung,
// kleine Helfer. App und API laufen auf derselben Domain - kein CORS nötig.
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

function json_input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
