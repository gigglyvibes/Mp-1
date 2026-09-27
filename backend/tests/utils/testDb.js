const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

/** Starts an in-memory MongoDB instance and connects Mongoose to it. */
const connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

/** Drops the database, closes the connection, and stops the in-memory server. */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

/** Empties every collection between tests so each test starts from a clean slate. */
const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

module.exports = { connect, closeDatabase, clearDatabase };
