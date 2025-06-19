import dotenv from "dotenv";
import { cleanEnv, host, makeValidator, num, port, str, testOnly } from "envalid";

dotenv.config();

const commaSeparatedOrigins = makeValidator<string[]>((input) => {
  if (typeof input !== "string") {
    throw new Error("Expected comma-separated string");
  }
  return input.split(",").map((item) => item.trim());
});

export const envConfig = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(4000) }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:5173") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  MONGODB_URI: str(),
  MONGODB_NAME: str(),
  JWT_SECRET: str({ devDefault: testOnly("very-secure-secret") }),
  REDIS_URL: str({ devDefault: testOnly("redis://localhost:6379") }),
  AWS_ACCESS_KEY_ID: str(),
  AWS_SECRET_ACCESS_KEY: str(),
  AWS_REGION: str({ default: "us-east-1" }),
  AWS_S3_BUCKET_NAME: str(),
  MAX_IMAGE_SIZE: str({ default: "320x240" }),
  MAX_TEXT_FILE_SIZE: num({ default: 100000 }),
});

export type EnvConfig = Readonly<typeof envConfig>;
