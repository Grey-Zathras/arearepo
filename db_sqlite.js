// db.js
const fs = require('fs');

const path = './database';
if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
    console.log('Folder "database" created.');
}

const database = require('better-sqlite3')(`./database/rooms.db`);
const initDatabase = `
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL, 
    code TEXT NOT NULL, 
    lang TEXT NOT NULL,
    priv INTEGER DEFAULT 0 NOT NULL,
    stat integer DEFAULT 0 NOT NULL,
    cards text,
    states text,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code  
ON rooms(code);
`;



database.exec(initDatabase);

//export default database;

module.exports = database;




