import * as svgCaptcha from "svg-captcha";
import { Redis } from "ioredis";
import { envConfig } from "@/config/envConfig";

interface CaptchaChallenge {
  token: string;
  image: string;
  text: string;
}

export class CaptchaService {
  private redis: Redis;
  private verificationAttempts = new Map<string, number>();
  private readonly MAX_ATTEMPTS = 3;

  constructor() {
    this.redis = new Redis(envConfig.REDIS_URL);
  }

  async generateChallenge(): Promise<CaptchaChallenge> {
    const captcha = svgCaptcha.create({
      size: 6,
      ignoreChars: "0o1il",
      noise: 3,
      color: true,
      background: "#f0f0f0",
      width: 200,
      height: 80,
      fontSize: 60,
    });

    const token = this.generateToken();
    const text = captcha.text.toLowerCase();

    await this.redis.set(`captcha:${token}`, text, "EX", 300);

    return {
      token,
      image: captcha.data,
      text,
    };
  }

  async verifyCaptcha(token: string, userInput: string): Promise<boolean> {
    if (!token || !userInput) return false;

    const storedText = await this.redis.get(`captcha:${token}`);
    if (!storedText) return false;

    const isValid = storedText.toLowerCase() === userInput.toLowerCase();

    const attempts = this.verificationAttempts.get(token) || 0;
    this.verificationAttempts.set(token, attempts + 1);

    if (attempts >= this.MAX_ATTEMPTS - 1) {
      await this.redis.del(`captcha:${token}`);
      this.verificationAttempts.delete(token);
    }

    return isValid;
  }

  private generateToken(): string {
    return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  }
}
