<?php
// Liefert die Liste der Schüler-Profile für den Auswahl-Screen
// ("Wer bist du?"). Profile werden manuell über phpMyAdmin gepflegt
// (siehe sql/schema.sql) - kein Selfservice, keine Logins.
require_once __DIR__ . '/_bootstrap.php';

$stmt = db()->query('SELECT id, display_name FROM students ORDER BY display_name');
respond($stmt->fetchAll());
