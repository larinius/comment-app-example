export const captchaTypeDefs = `
  type CaptchaChallenge {
    token: String!
    image: String!
  }

  type CaptchaVerificationResult {
    isValid: Boolean!
  }

  input VerifyCaptchaInput {
    token: String!
    solution: String!
  }

  type Query {
    getCaptchaChallenge: CaptchaChallenge!
  }

  type Mutation {
    verifyCaptcha(input: VerifyCaptchaInput!): CaptchaVerificationResult!
  }
`;
