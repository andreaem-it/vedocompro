import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { config } from './config';

const app = express();

// Dietro Vercel/proxy: req.ip deve leggere X-Forwarded-For (usato dal rate limit auth)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.appUrl, credentials: true }));
// Il webhook Stripe verifica la firma sul body grezzo: il raw parser va montato
// PRIMA di express.json (body-parser salta i parser successivi se il body è già letto).
app.use('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
