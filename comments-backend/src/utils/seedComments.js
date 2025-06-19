const { MongoClient, ObjectId } = require("mongodb");
const { faker } = require("@faker-js/faker");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_NAME = process.env.MONGODB_NAME || "comment-app";

console.log(process.env);

const sampleAttachments = {
  none: [],
  text: [
    {
      s3Key: "684bcde6f33e9dc5667c44df/attachments/1749798415705-demo.txt",
      filename: "demo.txt",
      mimeType: "text/plain",
      size: 10,
      uploadedAt: null,
    },
  ],
  image: [
    {
      s3Key: "684bcde6f33e9dc5667c44df/attachments/1749798444136-user_demo_avatar.jpg",
      filename: "user_demo_avatar.jpg",
      mimeType: "image/jpeg",
      size: 12176,
      uploadedAt: null,
    },
  ],
};

function getRandomAttachments(createdAt) {
  const randomType = faker.number.int({ min: 0, max: 2 }); // 0 = none, 1 = text, 2 = image

  if (randomType === 0) return sampleAttachments.none;

  const attachments = randomType === 1 ? [...sampleAttachments.text] : [...sampleAttachments.image];

  return attachments.map((attachment) => ({
    ...attachment,
    uploadedAt: createdAt,
  }));
}

async function seedAll() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_NAME);

    await db.collection("users").deleteMany({});
    await db.collection("comments").deleteMany({});

    const users = Array.from({ length: 20 }, () => ({
      _id: new ObjectId(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      passwordHash: "$2a$10$nE.uzQgcQL8Dmsj2CahMTuzdUBjlS0Ldi3pX01xfGakI7YPoyOUBa", // "123456"
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: "684bcb280b4f1edd5fc027af/avatars/1749798126142-user_demo_avatar.jpg",
    }));

    await db.collection("users").insertMany(users);

    const rootComments = Array.from({ length: 50 }, (_, i) => {
      const createdAt = faker.date.recent({ days: 30 });
      return {
        _id: new ObjectId(),
        content: faker.lorem.paragraph() + (i % 4 === 0 ? " 🔥" : ""),
        authorId: users[i % users.length]._id,
        attachments: getRandomAttachments(createdAt),
        createdAt: createdAt,
        updatedAt: new Date(),
      };
    });

    await db.collection("comments").insertMany(rootComments);

    const replies = [];
    rootComments.slice(0, 30).forEach((root) => {
      const replyCount = faker.number.int({ min: 2, max: 5 });

      Array.from({ length: replyCount }).forEach((_, i) => {
        const createdAt = faker.date.between({ from: root.createdAt, to: new Date() });
        replies.push({
          _id: new ObjectId(),
          content: faker.lorem.sentence() + (i % 3 === 0 ? " ❤️" : ""),
          authorId: users[i % users.length]._id,
          parentId: root._id,
          attachments: getRandomAttachments(createdAt),
          createdAt: createdAt,
          updatedAt: new Date(),
        });
      });
    });

    await db.collection("comments").insertMany(replies);

    const nestedReplies = [];
    replies.slice(0, 20).forEach((reply) => {
      const createdAt = faker.date.between({ from: reply.createdAt, to: new Date() });
      nestedReplies.push({
        _id: new ObjectId(),
        content: `${faker.lorem.words(10)}·👀`,
        authorId: users[faker.number.int({ min: 0, max: users.length - 1 })]._id,
        parentId: reply._id,
        attachments: getRandomAttachments(createdAt),
        createdAt: createdAt,
        updatedAt: new Date(),
      });
    });

    await db.collection("comments").insertMany(nestedReplies);

    console.log("Database seeded successfully with attachments!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
  }
}

seedAll();
