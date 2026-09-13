<?php
// Lädt Key=Value-Paare aus einer .env-Datei. Die Datei selbst wird nicht
// eingecheckt (siehe .gitignore) - sie entsteht erst beim Deploy aus
// .deploy-now/woerter-lesen/api/.env.template (IONOS ersetzt dort die
// $IONOS_DB_*-Platzhalter durch echte Werte).
function load_env(string $path): array {
    $vars = [];
    if (!is_file($path)) return $vars;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $vars[trim($key)] = trim($value, "\"' \t");
    }
    return $vars;
}
