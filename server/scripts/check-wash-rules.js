const sqlite3 = require('sqlite3').verbose();

const dbPath = './database/database.db';

async function checkWashRules() {
  console.log('🔍 Checking WashRules table...');
  
  const db = new sqlite3.Database(dbPath);
  
  const rules = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM WashRules LIMIT 10', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`Found ${rules.length} sample rules:`);
  rules.forEach((rule, i) => {
    console.log(`${i + 1}. ID: ${rule.RuleId} | Name: "${rule.RuleName}" | Status: ${rule.Status}`);
  });
  
  // Check unique rules
  const uniqueRules = await new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT RuleName, Status FROM WashRules', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`\nUnique rules: ${uniqueRules.length}`);
  uniqueRules.forEach((rule, i) => {
    console.log(`${i + 1}. "${rule.RuleName}" - ${rule.Status}`);
  });
  
  // Check total count
  const total = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM WashRules', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  
  console.log(`\nTotal WashRules: ${total}`);
  
  db.close();
}

checkWashRules();