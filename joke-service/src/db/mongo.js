// src/db/mongo.js
const mongoose = require('mongoose');

// ─── Schemas ──────────────────────────────────────────────────────────────────
const TypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true }
});

const JokeSchema = new mongoose.Schema({
  setup:     { type: String, required: true },
  punchline: { type: String, required: true },
  type:      { type: String, required: true, lowercase: true, trim: true }
});

const Type = mongoose.model('Type', TypeSchema);
const Joke = mongoose.model('Joke', JokeSchema);

async function connect() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jokesdb');
  console.log('[MongoDB] Connected successfully');

  // Seed if empty
  const count = await Type.countDocuments();
  if (count === 0) await seedData();
}

async function seedData() {
  const types = ['general', 'dad', 'programming', 'knock-knock', 'sport'];
  for (const t of types) {
    await Type.findOneAndUpdate({ name: t }, { name: t }, { upsert: true });
  }

  const jokes = [
    { setup: "Why don't scientists trust atoms?",            punchline: "Because they make up everything!",              type: 'general' },
    { setup: "I'm reading a book about anti-gravity.",        punchline: "It's impossible to put down!",                  type: 'general' },
    { setup: "Why did the scarecrow win an award?",           punchline: "Because he was outstanding in his field!",      type: 'general' },
    { setup: "I used to hate facial hair...",                 punchline: "But then it grew on me.",                       type: 'dad' },
    { setup: "Why do programmers prefer dark mode?",          punchline: "Because light attracts bugs!",                  type: 'programming' },
    { setup: "How many programmers does it take to change a lightbulb?", punchline: "None, that's a hardware problem!",  type: 'programming' },
    { setup: "Why did the programmer quit his job?",          punchline: "Because he didn't get arrays!",                 type: 'programming' },
    { setup: "Knock knock. Who's there? Lettuce.",            punchline: "Lettuce in, it's cold out here!",               type: 'knock-knock' },
    { setup: "Why can't Cinderella play soccer?",             punchline: "Because she always runs away from the ball!",   type: 'sport' },
  ];

  await Joke.insertMany(jokes);
  console.log('[MongoDB] Seed data inserted');
}

async function getTypes() {
  const types = await Type.find().sort({ name: 1 }).select('name -_id');
  return types.map(t => t.name);
}

async function getJokes(type, count = 1) {
  const n = parseInt(count);
  let jokes;
  if (type === 'any') {
    jokes = await Joke.aggregate([{ $sample: { size: n } }]);
  } else {
    jokes = await Joke.aggregate([
      { $match: { type: type.toLowerCase() } },
      { $sample: { size: n } }
    ]);
  }
  return jokes.map(j => ({ setup: j.setup, punchline: j.punchline, type: j.type }));
}

async function addJoke(setup, punchline, type) {
  const typeLower = type.toLowerCase().trim();
  await Type.findOneAndUpdate({ name: typeLower }, { name: typeLower }, { upsert: true });
  const joke = await Joke.create({ setup, punchline, type: typeLower });
  return joke._id;
}

async function typeExists(type) {
  const t = await Type.findOne({ name: type.toLowerCase().trim() });
  return !!t;
}

module.exports = { connect, getTypes, getJokes, addJoke, typeExists };
