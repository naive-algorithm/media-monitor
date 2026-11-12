-- Upgrade an existing database created before classification run history.
-- Fresh databases use schema.sql instead. Do not run after the manual upgrade.
BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TYPE classification_status RENAME TO article_classification_status;

CREATE TYPE classification_run_status AS ENUM('RUNNING', 'SUCCESS', 'FAILED');

CREATE TABLE classification_runs (
    id SERIAL PRIMARY KEY,
    article_id INT NOT NULL,
    job_id TEXT NOT NULL,
    attempt INT NOT NULL CHECK (attempt > 0),
    classifier_version TEXT NOT NULL,
    status classification_run_status NOT NULL DEFAULT 'RUNNING',
    classification_status article_classification_status,
    failure_stage TEXT,
    failure_reason TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT article_classification_status_matches_run_status CHECK (
        (status = 'SUCCESS' AND classification_status IS NOT NULL)
        OR
        (status IN ('RUNNING', 'FAILED') AND classification_status IS NULL)
    ),
    CONSTRAINT classification_runs_finish_matches_status CHECK (
        (status = 'RUNNING' AND finished_at IS NULL)
        OR
        (status IN ('SUCCESS', 'FAILED') AND finished_at IS NOT NULL)
    )
);

COMMIT;
