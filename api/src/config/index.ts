export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/auth/google/callback',
  },

  facebook: {
    appId: process.env.FACEBOOK_APP_ID ?? '',
    appSecret: process.env.FACEBOOK_APP_SECRET ?? '',
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL ?? 'http://localhost:4000/auth/facebook/callback',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? 'eu-west-1',
    bucket: process.env.AWS_S3_BUCKET ?? '',
  },

  mail: {
    host: process.env.MAIL_HOST ?? 'localhost',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'noreply@vedocompro.it',
  },

  paypal: {
    email: process.env.PAYPAL_EMAIL ?? '',
    mode: process.env.PAYPAL_MODE ?? 'sandbox',
  },

  recaptchaSecret: process.env.RECAPTCHA_SECRET ?? '',
};
