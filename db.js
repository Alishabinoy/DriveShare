const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb://127.0.0.1:27017");

let db;

async function connectDB() {
  if (db) return db;

  await client.connect();
  db = client.db("driveshare");

  console.log("MongoDB connected!");

  return db;
}

module.exports = connectDB;