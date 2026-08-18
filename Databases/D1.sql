CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    session_date TEXT,
    raw_notes TEXT NOT NULL,
    summary TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entities (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,       -- character, location, faction, item, quest
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,    -- Markdown
    first_session_id INTEGER,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mentions (
    session_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    context TEXT,
    PRIMARY KEY (session_id, entity_id)
);

CREATE TABLE relationships (
    id INTEGER PRIMARY KEY,
    source_entity_id INTEGER NOT NULL,
    target_entity_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL,
    description TEXT
);
