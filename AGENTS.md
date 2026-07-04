# AGENTS.md

## Commands
- `npm run dev` — nodemon auto-restart (development)
- `npm start` — plain node start
- No test, lint, or typecheck scripts configured.

## Architecture
- **Entrypoint**: `src/app.js` — Express 5.x server on `PORT` (default 3000)
- **Database**: SQLite via `better-sqlite3`, stored at `data/class_vocab.db`, schema auto-created from `src/db/schema.sql` on first require
- **Uploads**: Multer writes to `uploads/` directory

## Frontend
- Static files served from `public/` directory via `express.static`
- `GET /` — vocabulary import form (upload Excel + metadata)
- `GET /tables/` — data browser index, links to each table view

## API
- `POST /api/import/vocabulary` — multipart form: Excel file (`file`) + course/session metadata (`courseCode`, `sessionDate`, `courseName`, `teacherName`, `semester`, `topic`, `rawTranscriptPath`, `cleanedTranscriptPath`, `summary`). `courseCode` and `sessionDate` are required.
- `GET /api/import/vocabulary/priority` — vocabulary list with computed learning-priority scores
- `GET /api/tables/courses` — all courses
- `GET /api/tables/sessions` — all sessions (joined with course info)
- `GET /api/tables/vocabulary` — all vocabulary items
- `GET /api/tables/occurrences` — all occurrences (joined with vocab/session/course)
- `GET /api/tables/reviewlogs` — all review logs (joined with vocab)

## Excel Format
Columns accept either Chinese or English headers. Chinese is the primary:
- 类型 / type — required
- 英文表达 / expression — required
- 中文意思 / chinese_meaning
- 出现频率 / frequency
- 频率等级 / frequency_level
- 课堂原句 / example_sentence
- 重要性评分 / importance_score
- 可复用性评分 / reusability_score
- 熟悉度评分 / familiarity_score
- 建议处理方式 / treatment
- 说话人 / speaker

## Idempotency
Re-importing the same Excel file is safe: courses, sessions, and vocabulary items use `findOrCreate`. Occurrences accumulate frequency on existing rows.

## Key conventions
- CommonJS modules (no ES modules)
- No ORM — raw SQL via `better-sqlite3` prepared statements
- `normalizeExpression()` lowercases, collapses whitespace, and strips trailing punctuation for deduplication
- Filler detection (`is_filler=1`) triggers lower priority weighting
