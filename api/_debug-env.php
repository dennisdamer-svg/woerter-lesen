<?php
// TEMPORÄR - nur zur Fehlersuche beim Verbindungsaufbau (Staging-Branch).
// Zeigt KEINE echten Werte, nur ob die Datei existiert, welche Keys sie
// enthält, und die PDO-Fehlermeldung (ohne Passwort) falls die Verbindung
// fehlschlägt. Nach der Fehlersuche wieder entfernen.
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/env.php';

$path = __DIR__ . '/app.env';
$exists = is_file($path);
$env = $exists ? load_env($path) : [];
$masked = [];
foreach ($env as $k => $v) {
    $masked[$k] = $v === '' ? '(leer)' : (preg_match('/^\$?IONOS_/', $v) ? "UNRESOLVED:$v" : '(gesetzt)');
}

$result = ['app_env_exists' => $exists, 'app_env_path' => $path, 'keys' => $masked];

if ($exists) {
    $host = $env['DB_HOST'] ?? '';
    $port = $env['DB_PORT'] ?? '3306';
    $name = $env['DB_DATABASE'] ?? '';
    $user = $env['DB_USERNAME'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';
    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
        new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $result['connection'] = 'ok';
    } catch (Throwable $e) {
        $result['connection'] = 'failed';
        $result['error'] = $e->getMessage();
    }
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
