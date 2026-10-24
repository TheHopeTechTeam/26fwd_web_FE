-- FORWARD 2026: model judgment and auto-publish (M1.6, #5; Ian 10/15, 10/19, 10/23)
-- app_settings holds switches that must change without a redeploy. The only one so far is
-- auto_publish: a card the model sees no reason to hold is published without a reviewer only while
-- its value is exactly 'on'. A missing row, any other value or a failed read counts as off, so every
-- card waits for a reviewer (Ian 10/23, option B). It starts off; Ian decides when it is turned on.
-- card_moderations keeps one judgment per card for the audit trail shown in the admin (Ian 10/15):
-- which model and which version of the questions judged it, what it answered, and whether the card
-- was published because of it. It never stores card text, which stays in forward_cards, and a
-- judgment is deleted with its card.
-- Apply this before deploying the code that uses it: the admin list reads card_moderations.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('auto_publish', 'off', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE IF NOT EXISTS card_moderations (
  card_id TEXT PRIMARY KEY REFERENCES forward_cards (id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  -- Null when no valid questions were configured.
  questions_version TEXT,
  -- clear: no reason to hold it. flagged: some reason. The rest: no usable answer.
  outcome TEXT NOT NULL CHECK (outcome IN ('clear', 'flagged', 'questions_missing', 'timeout', 'model_error', 'invalid_output')),
  reason TEXT,
  reason_probability REAL,
  needs_attention_probability REAL,
  auto_published INTEGER NOT NULL CHECK (auto_published IN (0, 1)),
  input_tokens INTEGER,
  latency_ms INTEGER,
  judged_at TEXT NOT NULL
);
