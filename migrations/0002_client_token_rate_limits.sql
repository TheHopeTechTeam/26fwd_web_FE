-- FORWARD 2026: Client Token rate limiting (#5)
-- submission_rate_limits now holds three kinds of rows, each keyed by a prefix plus a salted
-- SHA-256 hex digest. Neither IPs nor tokens are stored in plain text, and forward_cards still
-- has no link to any of these rows.
--   ip:<hash of the client IP>      card submissions per IP
--   iss:<hash of the client IP>     new Client Tokens issued per IP
--   tok:<hash of the Client Token>  card submissions per Client Token
-- last_submit_ms (Unix ms of the last request a row let through) lets "one card a minute" mean a
-- real 60 seconds instead of resetting at every clock minute.
-- Rows written under 0001 keep their bare IP hashes; nothing reads them any more, and the 24-hour
-- cleanup removes them.
-- Apply this right before deploying the code that uses it: card submissions fail in between.

ALTER TABLE submission_rate_limits RENAME COLUMN ip_hash TO limiter_key;
ALTER TABLE submission_rate_limits ADD COLUMN last_submit_ms INTEGER;
