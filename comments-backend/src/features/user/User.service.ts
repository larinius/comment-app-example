import bcrypt from "bcryptjs";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";
import { type Db, ObjectId } from "mongodb";
import { envConfig } from "../../config/envConfig";
import type { UserDocument } from "./User.model";

export class UserService {
  constructor(private db: Db) {}
  private redis = new Redis(envConfig.REDIS_URL);

  private get collection() {
    return this.db.collection<UserDocument>("users");
  }

  async createUser(email: string, username: string, password: string, avatarKey?: string) {
    const existingUser = await this.collection.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: UserDocument = {
      email,
      username,
      passwordHash,
      ...(avatarKey && { avatar: avatarKey }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(user);

    const insertedUser = {
      id: result.insertedId.toString(),
      email: user.email,
      username: user.username,
      ...(user.avatar && { avatar: user.avatar }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: insertedUser,
      token: this.generateToken(insertedUser),
    };
  }

  async login(email: string, password: string) {
    const user = await this.collection.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const userWithId = { ...user, id: user._id.toString() };
    return {
      user: userWithId,
      token: this.generateToken(userWithId),
    };
  }

  async logout(token: string): Promise<boolean> {
    try {
      await this.redis.set(`blacklist:${token}`, "1", "EX", 86400);
      return true;
    } catch (error) {
      throw new Error("Logout failed");
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.exists(`blacklist:${token}`);
    return result === 1;
  }

  async findById(id: string) {
    const user = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!user) return null;

    return {
      ...user,
      id: user._id.toString(),
      avatarKey: user.avatar,
    };
  }
  async findByEmail(email: string) {
    const user = await this.collection.findOne({ email });
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  }

  private generateToken(user: { id: string; email: string; username: string }) {
    return jwt.sign({ id: user.id, email: user.email, username: user.username }, envConfig.JWT_SECRET, {
      expiresIn: "1d",
    });
  }

  async setAvatar(userId: string, avatarKey: string) {
    await this.collection.updateOne({ _id: new ObjectId(userId) }, { $set: { avatar: avatarKey, updatedAt: new Date() } });
    return this.findById(userId);
  }
}
