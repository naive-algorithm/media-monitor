BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE ingestion_runs
    ADD COLUMN failure_stage TEXT,
    ADD COLUMN failure_reason TEXT,
    ADD COLUMN error_message TEXT;

COMMIT;
