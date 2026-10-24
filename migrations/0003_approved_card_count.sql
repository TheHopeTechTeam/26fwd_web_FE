-- FORWARD 2026: keep the approved-card total in a one-row table (#5, D1 read fix, Ian 10/21)
-- The public wall reported total_count by counting every approved card on every load, so each load
-- read about as many rows as there were approved cards. These triggers keep the total as cards are
-- inserted, change status or are deleted, in the same statement, so the wall reads one row instead.
-- The total starts from the cards already approved when this runs. Running it again recounts from
-- the cards and leaves the triggers as they are, so it can also repair a total that has drifted.
-- Order does not matter: until this is applied, the wall falls back to counting (and logs it).

CREATE TABLE IF NOT EXISTS forward_card_counts (
  status TEXT PRIMARY KEY CHECK (status = 'approved'),
  count INTEGER NOT NULL
);

INSERT OR REPLACE INTO forward_card_counts (status, count)
SELECT 'approved', COUNT(*) FROM forward_cards WHERE status = 'approved';

CREATE TRIGGER IF NOT EXISTS forward_cards_count_insert AFTER INSERT ON forward_cards
WHEN NEW.status = 'approved'
BEGIN
  UPDATE forward_card_counts SET count = count + 1 WHERE status = 'approved';
END;

CREATE TRIGGER IF NOT EXISTS forward_cards_count_update AFTER UPDATE OF status ON forward_cards
WHEN (OLD.status = 'approved') <> (NEW.status = 'approved')
BEGIN
  UPDATE forward_card_counts SET count = count + CASE WHEN NEW.status = 'approved' THEN 1 ELSE -1 END
  WHERE status = 'approved';
END;

CREATE TRIGGER IF NOT EXISTS forward_cards_count_delete AFTER DELETE ON forward_cards
WHEN OLD.status = 'approved'
BEGIN
  UPDATE forward_card_counts SET count = count - 1 WHERE status = 'approved';
END;
