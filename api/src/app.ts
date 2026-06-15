import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { config } from './config';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.appUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
