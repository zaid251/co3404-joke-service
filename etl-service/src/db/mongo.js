// src/db/mongo.js
const mongoose = require('mongoose');

const TypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true }
});
const JokeSchema = new mongoose.Schema({
  setup:      { type: String, required: true },
  punchline:  { type: String, required: true },
  type:       { type: String, required: true, lowercase: true, trim: true },
  created_at: { type: Date, default: Date.now }
});

const Type = mongoose.model('Type', TypeSchema);
const Joke = mongoose.model('Joke', JokeSchema);

async function connect() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jokesdb');
  console.log('[ETL MongoDB] Connected successfully');
}

async function insertJoke(setup, punchline, type) {
  const typeLower = type.toLowerCase().trim();

  // Upsert type (no duplicates)
  await Type.findOneAndUpdate(
    { name: typeLower },
    { name: typeLower },
    { upsert: true, new: true }
  );

  const joke = await Joke.create({ setup, punchline, type: typeLower });
  console.log(`[ETL MongoDB] Joke inserted (id: ${joke._id}) type: ${typeLower}`);
  return { jokeId: joke._id };
}

async function typeExists(type) {
  const t = await Type.findOne({ name: type.toLowerCase().trim() });
  return !!t;
}

module.exports = { connect, insertJoke, typeExists };
