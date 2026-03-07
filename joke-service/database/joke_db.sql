-- CO3404 Distributed Systems — Joke Database Schema & Seed Data
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS jokesdb;
USE jokesdb;

-- ── Types table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS types (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  CONSTRAINT uq_type_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Jokes table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jokes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  setup     TEXT NOT NULL,
  punchline TEXT NOT NULL,
  type_id   INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_joke_type FOREIGN KEY (type_id) REFERENCES types(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: types ──────────────────────────────────────────────────────────────
INSERT IGNORE INTO types (name) VALUES
  ('general'),
  ('dad'),
  ('programming'),
  ('knock-knock'),
  ('sport');

-- ── Seed: jokes ──────────────────────────────────────────────────────────────
INSERT INTO jokes (setup, punchline, type_id) VALUES
  ("Why don't scientists trust atoms?",                     "Because they make up everything!",                (SELECT id FROM types WHERE name='general')),
  ("I'm reading a book about anti-gravity.",                "It's impossible to put down!",                    (SELECT id FROM types WHERE name='general')),
  ("Why did the scarecrow win an award?",                   "Because he was outstanding in his field!",        (SELECT id FROM types WHERE name='general')),
  ("What do you call a fake noodle?",                       "An impasta!",                                     (SELECT id FROM types WHERE name='general')),
  ("Why did the bicycle fall over?",                        "Because it was two-tired!",                       (SELECT id FROM types WHERE name='general')),
  ("I used to hate facial hair...",                         "But then it grew on me.",                         (SELECT id FROM types WHERE name='dad')),
  ("Why did the dad bring a ladder to the bar?",            "Because he heard the drinks were on the house!",  (SELECT id FROM types WHERE name='dad')),
  ("I'm on a seafood diet.",                                "I see food and I eat it.",                        (SELECT id FROM types WHERE name='dad')),
  ("Why do programmers prefer dark mode?",                  "Because light attracts bugs!",                    (SELECT id FROM types WHERE name='programming')),
  ("How many programmers does it take to change a lightbulb?", "None, that's a hardware problem!",            (SELECT id FROM types WHERE name='programming')),
  ("Why did the programmer quit his job?",                  "Because he didn't get arrays!",                   (SELECT id FROM types WHERE name='programming')),
  ("A SQL query walks into a bar.",                         "Walks up to two tables and asks: 'Can I JOIN you?'", (SELECT id FROM types WHERE name='programming')),
  ("Knock knock. Who's there? Lettuce.",                    "Lettuce in, it's cold out here!",                 (SELECT id FROM types WHERE name='knock-knock')),
  ("Knock knock. Who's there? Cow says.",                   "Cow says who? No silly, cow says moo!",           (SELECT id FROM types WHERE name='knock-knock')),
  ("Why can't Cinderella play soccer?",                     "Because she always runs away from the ball!",     (SELECT id FROM types WHERE name='sport')),
  ("Why do golfers carry an extra pair of pants?",          "In case they get a hole in one!",                 (SELECT id FROM types WHERE name='sport'));
