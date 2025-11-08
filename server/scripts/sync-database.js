const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const LOCAL_DB = './database/database.db';
const SERVER_URL = 'https://schedule-v3-server.onrender.com/api';

async function pushToServer() {
  console.log('📤 Pushing local database to server...');
  
  const db = new sqlite3.Database(LOCAL_DB);
  
  try {
    // Get all local data
    const customers = await queryDB(db, 'SELECT * FROM customers');
    const workers = await queryDB(db, 'SELECT * FROM workers');
    const schedule = await queryDB(db, 'SELECT * FROM schedule');
    const history = await queryDB(db, 'SELECT * FROM history');
    
    // Push customers
    for (const customer of customers) {
      await fetch(`${SERVER_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
    }
    
    // Push workers
    for (const worker of workers) {
      await fetch(`${SERVER_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worker)
      });
    }
    
    console.log('✅ Successfully pushed to server!');
    
  } catch (error) {
    console.error('❌ Error pushing to server:', error.message);
  } finally {
    db.close();
  }
}

async function pullFromServer() {
  console.log('📥 Pulling from server to local database...');
  
  try {
    // Get server data
    const customersRes = await fetch(`${SERVER_URL}/customers`);
    const workersRes = await fetch(`${SERVER_URL}/workers`);
    
    const customers = await customersRes.json();
    const workers = await workersRes.json();
    
    // Initialize local database
    const db = new sqlite3.Database(LOCAL_DB);
    
    // Create tables if they don't exist
    await runDB(db, `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      CustomerName TEXT,
      Villa TEXT,
      CarPlates TEXT,
      WashDay TEXT,
      WashTime TEXT,
      Washman_Package TEXT,
      Status TEXT DEFAULT 'Active'
    )`);
    
    await runDB(db, `CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'Active'
    )`);
    
    await runDB(db, 'DELETE FROM customers');
    await runDB(db, 'DELETE FROM workers');
    
    // Insert server data locally
    for (const customer of customers) {
      const fields = Object.keys(customer).filter(k => k !== 'id').join(',');
      const values = Object.values(customer).filter((v, i) => Object.keys(customer)[i] !== 'id').map(() => '?').join(',');
      const data = Object.values(customer).filter((v, i) => Object.keys(customer)[i] !== 'id');
      await runDB(db, `INSERT INTO customers (${fields}) VALUES (${values})`, data);
    }
    
    for (const worker of workers) {
      const fields = Object.keys(worker).filter(k => k !== 'id').join(',');
      const values = Object.values(worker).filter((v, i) => Object.keys(worker)[i] !== 'id').map(() => '?').join(',');
      const data = Object.values(worker).filter((v, i) => Object.keys(worker)[i] !== 'id');
      await runDB(db, `INSERT INTO workers (${fields}) VALUES (${values})`, data);
    }
    
    console.log('✅ Successfully pulled from server!');
    db.close();
    
  } catch (error) {
    console.error('❌ Error pulling from server:', error.message);
  }
}

function queryDB(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runDB(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Command line usage
const command = process.argv[2];

if (command === 'push') {
  pushToServer();
} else if (command === 'pull') {
  pullFromServer();
} else {
  console.log('Usage:');
  console.log('  node sync-database.js push  - Push local DB to server');
  console.log('  node sync-database.js pull  - Pull server DB to local');
}