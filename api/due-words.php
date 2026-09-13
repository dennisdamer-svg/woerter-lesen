<?php
// Liefert den Leitner-Stand (Box + Fälligkeit) aller bisher geübten Wörter
// eines Schülers in einem Modus. Das Frontend gleicht das mit der Wortliste
// aus wordlists.js ab, um fällige/neue Wörter zuerst zu üben.
require_once __DIR__ . '/_bootstrap.php';

$studentId = (int)($_GET['student_id'] ?? 0);
$mode = trim((string)($_GET['mode'] ?? ''));

if (!$studentId || $mode === '') {
    respond(['error' => 'missing student_id or mode'], 400);
}

$stmt = db()->prepare('SELECT word_id, box, due_at FROM word_state WHERE student_id = ? AND mode = ?');
$stmt->execute([$studentId, $mode]);

$state = [];
foreach ($stmt as $row) {
    $state[$row['word_id']] = ['box' => (int)$row['box'], 'due_at' => $row['due_at']];
}

respond($state);
