const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/database.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

const createAssignmentsTable = `
CREATE TABLE IF NOT EXISTS assignments (
    taskId TEXT PRIMARY KEY COLLATE NOCASE,
    customerName TEXT COLLATE NOCASE,
    carPlate TEXT COLLATE NOCASE,
    washDay TEXT COLLATE NOCASE,
    washTime TEXT,
    washType TEXT COLLATE NOCASE,
    assignedWorker TEXT COLLATE NOCASE,
    villa TEXT COLLATE NOCASE,
    isLocked TEXT DEFAULT 'FALSE' COLLATE NOCASE,
    scheduleDate TEXT
);
`;

const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_assignments_customer ON assignments(customerName);
CREATE INDEX IF NOT EXISTS idx_assignments_worker ON assignments(assignedWorker);
`;

db.run(createAssignmentsTable, (err) => {
  if (err) {
    console.error('Error creating assignments table:', err);
  } else {
    console.log('Assignments table created successfully');
    
    db.run(createIndexes, (err) => {
      if (err) {
        console.error('Error creating indexes:', err);
      } else {
        console.log('Indexes created successfully');
      }
      db.close();
    });
  }
});