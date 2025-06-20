import { GraphQLError } from "graphql";
import type { GraphQLContext } from "@/server/types/context";
import { CaptchaService } from "./Captcha.service";

export const createCaptchaResolvers = () => {
  const captchaService = new CaptchaService();

  return {
    Query: {
      getCaptchaChallenge: async () => {
        try {
          const challenge = await captchaService.generateChallenge();
          return challenge;
        } catch (error) {
          throw new GraphQLError("Failed to generate CAPTCHA challenge");
        }
      },
    },
    Mutation: {
      verifyCaptcha: async (_: unknown, { input }: { input: { token: string; solution: string } }, context: GraphQLContext) => {
        try {
          const isValid = await captchaService.verifyCaptcha(input.token, input.solution);
          return { isValid };
        } catch (error) {
          throw new GraphQLError("CAPTCHA verification failed");
        }
      },
    },
  };
};
