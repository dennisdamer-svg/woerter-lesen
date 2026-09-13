<?php
require_once __DIR__ . '/env.php';

// Öffnet (und cached) die PDO-Verbindung zur MariaDB. Zugangsdaten kommen
// aus der .env-Datei, die IONOS beim Deploy generiert (siehe env.php).
function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $env = array_merge($_ENV, load_env(__DIR__ . '/.env'));
    $host = $env['DB_HOST'] ?? '';
    $port = $env['DB_PORT'] ?? '3306';
    $name = $env['DB_DATABASE'] ?? '';
    $user = $env['DB_USERNAME'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}
