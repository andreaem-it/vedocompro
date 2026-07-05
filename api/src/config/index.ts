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
    // R2 richiede 'auto'; per AWS S3 reale sovrascrivi con la region reale (es. eu-west-1).
    region: process.env.AWS_REGION ?? 'auto',
    // Nome del bucket, NON un URL (es. "vedocompro-uploads").
    bucket: process.env.AWS_S3_BUCKET ?? '',
    // Endpoint S3-compatibile custom (richiesto da R2/altri provider, vuoto = AWS S3 reale).
    // Per R2: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    endpoint: process.env.AWS_S3_ENDPOINT ?? '',
    // Base URL pubblica da cui servire i file (R2 non genera URL bucket.s3.region.amazonaws.com
    // come AWS): il "Public Development URL" (pub-xxxx.r2.dev) o un dominio custom collegato al bucket.
    publicUrl: process.env.AWS_S3_PUBLIC_URL ?? '',
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

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    // Firma dei webhook (whsec_...): generata da `stripe listen` in locale o dalla
    // dashboard Stripe in produzione. Senza, il webhook risponde 503 e la conferma
    // pagamento avviene solo via redirect (GET /payments/stripe/confirm).
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },

  recaptchaSecret: process.env.RECAPTCHA_SECRET ?? '',
  cronSecret: process.env.CRON_SECRET ?? '',

  features: {
    shop: process.env.SHOP_ENABLED === 'true',
    phoneVerificationDevMode: process.env.PHONE_VERIFICATION_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production',
  },
};
