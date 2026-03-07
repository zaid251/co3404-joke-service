// src/cache.js
// Manages the types file cache — if joke service is down, we serve from here
const fs   = require('fs');
const path = require('path');

const CACHE_PATH = process.env.TYPES_CACHE_PATH || './cache/types.json';

function ensureCacheDir() {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveTypes(types) {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_PATH, JSON.stringify(types, null, 2));
    console.log('[Cache] Types saved to file cache:', types);
  } catch (err) {
    console.error('[Cache] Failed to save types:', err.message);
  }
}

function loadTypes() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      console.log('[Cache] Types loaded from file cache');
      return data;
    }
  } catch (err) {
    console.error('[Cache] Failed to load types:', err.message);
  }
  return null;
}

function cacheExists() {
  return fs.existsSync(CACHE_PATH);
}

module.exports = { saveTypes, loadTypes, cacheExists };
