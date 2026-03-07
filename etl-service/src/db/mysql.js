// src/db/mysql.js
const mysql = require('mysql2/promise');

let pool;

async function connect() {
  pool = mysql.createPool({
    host:               process.env.MYSQL_HOST     || 'localhost',
    port:               parseInt(process.env.MYSQL_PORT) || 3306,
    user:               process.env.MYSQL_USER     || 'jokeuser',
    password:           process.env.MYSQL_PASSWORD || 'jokepass123',
    database:           process.env.MYSQL_DATABASE || 'jokesdb',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
  });

  const conn = await pool.getConnection();
  console.log('[ETL MySQL] Connected successfully');
  conn.release();
}

async function insertJoke(setup, punchline, type) {
  // Insert type if not already exists (no duplicates)
  await pool.query('INSERT IGNORE INTO types (name) VALUES (?)', [type.toLowerCase().trim()]);

  // Get type id
  const [typeRows] = await pool.query('SELECT id FROM types WHERE name = ?', [type.toLowerCase().trim()]);
  if (!typeRows.length) throw new Error(`Type not found after insert: ${type}`);
  const typeId = typeRows[0].id;

  // Insert joke
  const [result] = await pool.query(
    'INSERT INTO jokes (setup, punchline, type_id) VALUES (?, ?, ?)',
    [setup, punchline, typeId]
  );

  console.log(`[ETL MySQL] Joke inserted (id: ${result.insertId}) type: ${type}`);
  return { jokeId: result.insertId, typeId };
}

async function typeExists(type) {
  const [rows] = await pool.query('SELECT id FROM types WHERE name = ?', [type.toLowerCase().trim()]);
  return rows.length > 0;
}

module.exports = { connect, insertJoke, typeExists };
