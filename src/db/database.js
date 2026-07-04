const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../../data/class_vocab.db");
const schemaPath = path.join(__dirname, "./schema.sql");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

module.exports = db;