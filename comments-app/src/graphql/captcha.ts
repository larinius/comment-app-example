import { gql } from '@apollo/client';

export const GET_CAPTCHA_CHALLENGE = gql`
  query GetCaptchaChallenge {
    getCaptchaChallenge {
      token
      image
    }
  }
`;

export const VERIFY_CAPTCHA = gql`
  mutation VerifyCaptcha($input: VerifyCaptchaInput!) {
    verifyCaptcha(input: $input) {
      isValid
    }
  }
`;