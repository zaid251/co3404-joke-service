// src/db/index.js
const mode = (process.env.DB_MODE || 'MYSQL').toUpperCase();

let adapter;
if (mode === 'MONGO') {
  console.log('[ETL DB Factory] Using MongoDB adapter');
  adapter = require('./mongo');
} else {
  console.log('[ETL DB Factory] Using MySQL adapter');
  adapter = require('./mysql');
}

module.exports = adapter;
