CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    collector_type TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_collected_at TIMESTAMPTZ
);

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    external_id TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT unique_external_id_per_source UNIQUE (external_id, source_id)
);

CREATE TYPE ingestion_status AS ENUM('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'SKIPPED');

CREATE TABLE ingestion_runs (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES sources(id),
    job_id TEXT NOT NULL,
    attempt INT NOT NULL CHECK (attempt > 0),
    total INT CHECK (total >= 0),
    imported INT NOT NULL DEFAULT 0 CHECK (imported >= 0),
    rejected INT NOT NULL DEFAULT 0 CHECK (rejected >= 0),
    skipped INT NOT NULL DEFAULT 0 CHECK (skipped >= 0),
    status ingestion_status NOT NULL DEFAULT 'RUNNING',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
