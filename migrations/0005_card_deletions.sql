-- FORWARD 2026: deleting a card from the admin (#35; Ian 11/02)
-- A reviewer can delete a card only while it is hidden, so it has already left the wall. The card
-- goes together with its judgment (card_moderations) and its status history (card_status_changes),
-- and one row here records that a deletion happened: which card, when and by whom. As in the status
-- history, "by whom" is only a reviewer, because reviewers share one admin token. The row holds no
-- card text, and card_id has no foreign key because the card it names is gone.
-- Apply this before deploying the code that uses it: deleting a card writes this table, so without
-- it every delete fails and no card is deleted.

CREATE TABLE IF NOT EXISTS card_deletions (
  id INTEGER PRIMARY KEY,
  card_id TEXT NOT NULL,
  -- reviewer: anyone with the admin token.
  actor TEXT NOT NULL CHECK (actor IN ('reviewer')),
  deleted_at TEXT NOT NULL
);
