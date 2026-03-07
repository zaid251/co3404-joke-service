// src/db/mysql.js
const mysql = require('mysql2/promise');

let pool;

async function connect() {
  pool = mysql.createPool({
    host:     process.env.MYSQL_HOST || 'localhost',
    port:     parseInt(process.env.MYSQL_PORT) || 3306,
    user:     process.env.MYSQL_USER || 'jokeuser',
    password: process.env.MYSQL_PASSWORD || 'jokepass123',
    database: process.env.MYSQL_DATABASE || 'jokesdb',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
  });

  // Verify connection
  const conn = await pool.getConnection();
  console.log('[MySQL] Connected successfully');
  conn.release();

  await ensureSchema();
  return pool;
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS types (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jokes (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      setup     TEXT NOT NULL,
      punchline TEXT NOT NULL,
      type_id   INT NOT NULL,
      FOREIGN KEY (type_id) REFERENCES types(id)
    )
  `);

  // Seed data if empty
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM types');
  if (rows[0].cnt === 0) {
    await seedData();
  }
}

async function seedData() {
  const types = ['general', 'dad', 'programming', 'knock-knock', 'sport'];
  for (const t of types) {
    await pool.query('INSERT IGNORE INTO types (name) VALUES (?)', [t]);
  }

  const jokes = [
    { setup: "Why don't scientists trust atoms?",            punchline: "Because they make up everything!",           type: 'general' },
    { setup: "I'm reading a book about anti-gravity.",        punchline: "It's impossible to put down!",               type: 'general' },
    { setup: "Why did the scarecrow win an award?",           punchline: "Because he was outstanding in his field!",   type: 'general' },
    { setup: "I used to hate facial hair...",                 punchline: "But then it grew on me.",                    type: 'dad' },
    { setup: "Why did the dad bring a ladder to the bar?",    punchline: "Because he heard the drinks were on the house!", type: 'dad' },
    { setup: "Why do programmers prefer dark mode?",          punchline: "Because light attracts bugs!",               type: 'programming' },
    { setup: "How many programmers does it take to change a lightbulb?", punchline: "None, that's a hardware problem!", type: 'programming' },
    { setup: "Why did the programmer quit his job?",          punchline: "Because he didn't get arrays!",              type: 'programming' },
    { setup: "Knock knock. Who's there? Lettuce.",            punchline: "Lettuce in, it's cold out here!",            type: 'knock-knock' },
    { setup: "Why can't Cinderella play soccer?",             punchline: "Because she always runs away from the ball!", type: 'sport' },
  ];

  for (const j of jokes) {
    const [typeRow] = await pool.query('SELECT id FROM types WHERE name = ?', [j.type]);
    if (typeRow.length > 0) {
      await pool.query(
        'INSERT INTO jokes (setup, punchline, type_id) VALUES (?, ?, ?)',
        [j.setup, j.punchline, typeRow[0].id]
      );
    }
  }
  console.log('[MySQL] Seed data inserted');
}

async function getTypes() {
  const [rows] = await pool.query('SELECT name FROM types ORDER BY name');
  return rows.map(r => r.name);
}

async function getJokes(type, count = 1) {
  let query, params;
  if (type === 'any') {
    query = 'SELECT j.setup, j.punchline, t.name AS type FROM jokes j JOIN types t ON j.type_id = t.id ORDER BY RAND() LIMIT ?';
    params = [parseInt(count)];
  } else {
    query = 'SELECT j.setup, j.punchline, t.name AS type FROM jokes j JOIN types t ON j.type_id = t.id WHERE t.name = ? ORDER BY RAND() LIMIT ?';
    params = [type, parseInt(count)];
  }
  const [rows] = await pool.query(query, params);
  return rows;
}

async function addJoke(setup, punchline, type) {
  // Insert type if not exists
  await pool.query('INSERT IGNORE INTO types (name) VALUES (?)', [type]);
  const [typeRow] = await pool.query('SELECT id FROM types WHERE name = ?', [type]);
  const typeId = typeRow[0].id;
  const [result] = await pool.query(
    'INSERT INTO jokes (setup, punchline, type_id) VALUES (?, ?, ?)',
    [setup, punchline, typeId]
  );
  return result.insertId;
}

async function typeExists(type) {
  const [rows] = await pool.query('SELECT id FROM types WHERE name = ?', [type]);
  return rows.length > 0;
}

module.exports = { connect, getTypes, getJokes, addJoke, typeExists };
