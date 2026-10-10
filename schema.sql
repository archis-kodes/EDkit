-- Run this once in the Turso dashboard (SQL console) or with: turso db shell <db-name> < schema.sql

CREATE TABLE IF NOT EXISTS kits (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT    NOT NULL,
  college            TEXT    NOT NULL,
  whatsapp           TEXT    NOT NULL,                       -- e.g. 919876543210
  price              REAL    NOT NULL CHECK (price >= 0),
  secret_hash        TEXT    NOT NULL,                       -- salted scrypt hash, never the plain code
  active             INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),  -- 1 = visible, 0 = hidden

  drafter            INTEGER NOT NULL DEFAULT 0,
  scale              INTEGER NOT NULL DEFAULT 0,
  roll_and_draw      INTEGER NOT NULL DEFAULT 0,
  pencils            INTEGER NOT NULL DEFAULT 0,
  compass            INTEGER NOT NULL DEFAULT 0,
  protector          INTEGER NOT NULL DEFAULT 0,
  set_squares        INTEGER NOT NULL DEFAULT 0,
  french_curves      INTEGER NOT NULL DEFAULT 0,
  clips              INTEGER NOT NULL DEFAULT 0,
  drawing_notebook   INTEGER NOT NULL DEFAULT 0,
  chart_paper_holder INTEGER NOT NULL DEFAULT 0,

  created_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_kits_active_created ON kits (active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kits_whatsapp       ON kits (whatsapp);
