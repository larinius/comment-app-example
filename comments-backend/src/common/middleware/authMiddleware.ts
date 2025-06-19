import { envConfig } from "@/config/envConfig";
import { UserService } from "@/features/user/User.service";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Db } from "mongodb";

export const createAuthMiddleware = (getDb: Db) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const db = getDb;
    const userService = new UserService(db);

    try {
      const isBlacklisted = await userService.isTokenBlacklisted(token);
      if (isBlacklisted) return next();

      const decoded = jwt.verify(token, envConfig.JWT_SECRET) as {
        id: string;
        email: string;
        username: string;
      };
      req.user = decoded;
      req.token = token;
    } catch (err) {
      console.error("JWT verification error:", err);
    }

    next();
  };
};
