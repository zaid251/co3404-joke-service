// src/db/index.js  — Database Factory
// Switches between MySQL and MongoDB based on DB_MODE env variable
// Usage: const db = require('./db'); await db.connect();

const mode = (process.env.DB_MODE || 'MYSQL').toUpperCase();

let adapter;

if (mode === 'MONGO') {
  console.log('[DB Factory] Using MongoDB adapter');
  adapter = require('./mongo');
} else {
  console.log('[DB Factory] Using MySQL adapter');
  adapter = require('./mysql');
}

module.exports = adapter;
