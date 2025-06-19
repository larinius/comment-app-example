import { type Db, MongoClient } from "mongodb";
import { envConfig } from "./envConfig";

let cachedDb: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!connectionPromise) {
    connectionPromise = (async () => {
      try {
        const client = await MongoClient.connect(envConfig.MONGODB_URI);
        const db = client.db(envConfig.MONGODB_NAME);
        cachedDb = db;
        return db;
      } catch (error) {
        connectionPromise = null;
        throw error;
      }
    })();
  }

  return connectionPromise;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (connectionPromise) return await connectionPromise;
  throw new Error("Database not connected. Call connectToDatabase first.");
}
