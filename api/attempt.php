<?php
// Loggt einen Übungsversuch und aktualisiert die Leitner-Box für
// Spaced Repetition. Wird nach jeder Runde (Bild-Übung/Blitzlesen/
// Wort schreiben) vom Frontend aufgerufen.
require_once __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'method not allowed'], 405);
}

$in = json_input();
$studentId = (int)($in['student_id'] ?? 0);
$wordId = trim((string)($in['word_id'] ?? ''));
$listId = trim((string)($in['list_id'] ?? ''));
$mode = trim((string)($in['mode'] ?? ''));
$correct = !empty($in['correct_first_try']);

if (!$studentId || $wordId === '' || $listId === '' || $mode === '') {
    respond(['error' => 'missing fields'], 400);
}

$pdo = db();

$pdo->prepare('INSERT INTO attempts (student_id, word_id, list_id, mode, correct_first_try)
                VALUES (?, ?, ?, ?, ?)')
    ->execute([$studentId, $wordId, $listId, $mode, $correct ? 1 : 0]);

// Leitner-System (5 Boxen): richtig -> eine Box weiter (längeres Intervall),
// falsch -> zurück auf Box 1 (bald wieder fällig).
$stmt = $pdo->prepare('SELECT box FROM word_state WHERE student_id = ? AND word_id = ? AND mode = ?');
$stmt->execute([$studentId, $wordId, $mode]);
$currentBox = $stmt->fetchColumn();
$box = $correct ? min(5, ($currentBox !== false ? (int)$currentBox : 1) + 1) : 1;

$intervalDaysByBox = [1 => 0, 2 => 1, 3 => 3, 4 => 7, 5 => 14];
$dueAt = (new DateTime())->modify('+' . $intervalDaysByBox[$box] . ' days')->format('Y-m-d H:i:s');

$pdo->prepare('INSERT INTO word_state (student_id, word_id, mode, box, due_at)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE box = VALUES(box), due_at = VALUES(due_at)')
    ->execute([$studentId, $wordId, $mode, $box, $dueAt]);

respond(['ok' => true, 'box' => $box, 'due_at' => $dueAt]);
