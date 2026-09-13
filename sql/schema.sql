-- Wörter lesen und schreiben – Fortschritts-Datenbank
-- Wird einmalig über phpMyAdmin (SQL-Tab) in der Deploy-Now-Datenbank angelegt.

CREATE TABLE IF NOT EXISTS students (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  display_name  VARCHAR(100) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Jeder Übungsversuch (ein Datensatz pro Runde/Wort/Modus-Durchgang).
CREATE TABLE IF NOT EXISTS attempts (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  student_id          INT NOT NULL,
  word_id             VARCHAR(64) NOT NULL,   -- entspricht der id aus wordlists.js, z.B. "de-teller"
  list_id             VARCHAR(64) NOT NULL,
  mode                VARCHAR(20) NOT NULL,   -- "bild_uebung" | "blitzlesen" | "schreiben"
  correct_first_try   TINYINT(1) NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_word_mode (student_id, word_id, mode),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leitner-Stand pro Schüler/Wort/Modus – steuert Spaced Repetition
-- (welches Wort ist als nächstes fällig).
CREATE TABLE IF NOT EXISTS word_state (
  student_id  INT NOT NULL,
  word_id     VARCHAR(64) NOT NULL,
  mode        VARCHAR(20) NOT NULL,
  box         TINYINT NOT NULL DEFAULT 1,     -- Leitner-Box 1-5
  due_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, word_id, mode),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
