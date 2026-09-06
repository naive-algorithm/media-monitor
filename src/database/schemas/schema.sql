CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    collector_type TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_collected_at TIMESTAMP
);

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    external_id TEXT NOT NULL UNIQUE,
    published_at TIMESTAMP NOT NULL
);