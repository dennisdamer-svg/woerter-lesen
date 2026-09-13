<?php
// CSV-Export aller Übungsversuche für die Lehrkraft-Auswertung
// (Import in Excel, Pivot-Tabelle o. Ä.). Geschützt über ein einfaches
// Passwort aus der .env-Datei (ADMIN_PASSWORD) - kein Schüler-Login,
// nur ein geteiltes Lehrkraft-Passwort.
require_once __DIR__ . '/_bootstrap.php';

$env = array_merge($_ENV, load_env(__DIR__ . '/.env'));
$adminPassword = $env['ADMIN_PASSWORD'] ?? '';
$given = $_GET['password'] ?? '';

if ($adminPassword === '' || !hash_equals($adminPassword, (string)$given)) {
    respond(['error' => 'unauthorized'], 401);
}

$stmt = db()->query('
    SELECT a.created_at, s.display_name AS schueler, a.list_id, a.word_id, a.mode, a.correct_first_try
    FROM attempts a
    JOIN students s ON s.id = a.student_id
    ORDER BY a.created_at
');

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="fortschritt.csv"');
$out = fopen('php://output', 'w');
fputcsv($out, ['Datum', 'Schueler', 'Liste', 'Wort', 'Modus', 'Richtig beim ersten Versuch'], ';');
foreach ($stmt as $row) {
    fputcsv($out, [
        $row['created_at'],
        $row['schueler'],
        $row['list_id'],
        $row['word_id'],
        $row['mode'],
        $row['correct_first_try'] ? 'ja' : 'nein',
    ], ';');
}
fclose($out);
