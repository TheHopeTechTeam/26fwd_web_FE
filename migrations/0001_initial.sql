-- FORWARD 2026: D1 Database Initial Schema
-- Adheres strictly to the Data Minimization Principle (個資最小化):
-- forward_cards contains NO IP addresses or IP hashes.
-- Transient IP hashes are stored only in submission_rate_limits for abuse prevention.

CREATE TABLE IF NOT EXISTS forward_cards (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  text_gratitude TEXT NOT NULL,
  text_anticipate TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'hidden')) DEFAULT 'pending',
  agreed_to_publish INTEGER NOT NULL CHECK (agreed_to_publish IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_forward_cards_status_created
  ON forward_cards(status, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS submission_rate_limits (
  ip_hash TEXT NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour')),
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_type, window_start)
);
