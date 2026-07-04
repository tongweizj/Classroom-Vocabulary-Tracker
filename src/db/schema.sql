CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT NOT NULL UNIQUE,
    course_name TEXT,
    teacher_name TEXT,
    semester TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    session_date TEXT NOT NULL,
    topic TEXT,
    raw_transcript_path TEXT,
    cleaned_transcript_path TEXT,
    summary TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(course_id, session_date, topic)
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    expression TEXT NOT NULL,
    normalized_expression TEXT NOT NULL,
    chinese_meaning TEXT,
    importance_score INTEGER,
    reusability_score INTEGER,
    familiarity_score INTEGER,
    treatment TEXT,
    is_filler INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, normalized_expression)
);

CREATE TABLE IF NOT EXISTS item_occurrences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    frequency INTEGER DEFAULT 1,
    frequency_level INTEGER,
    example_sentence TEXT,
    speaker TEXT DEFAULT 'Teacher',
    source_type TEXT DEFAULT 'ai_import',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES vocabulary_items(id),
    FOREIGN KEY (session_id) REFERENCES class_sessions(id),
    UNIQUE(item_id, session_id)
);

CREATE TABLE IF NOT EXISTS review_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    review_date TEXT NOT NULL,
    familiarity_before INTEGER,
    familiarity_after INTEGER,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES vocabulary_items(id)
);