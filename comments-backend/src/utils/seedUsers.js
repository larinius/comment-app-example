const { MongoClient } = require("mongodb");
const { faker } = require("@faker-js/faker");

const MONGODB_URI = "mongodb://localhost:27017";
const MONGODB_NAME = "comment-app";

async function seedUsers() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_NAME);

  const users = Array.from({ length: 20 }, () => ({
    email: faker.internet.email(),
    username: faker.internet.userName(),
    passwordHash: "$2a$10$nE.uzQgcQL8Dmsj2CahMTuzdUBjlS0Ldi3pX01xfGakI7YPoyOUBa", // "123456"
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.collection("users").insertMany(users);
  console.log(`Inserted ${users.length} users`);
  await client.close();
}

seedUsers();
