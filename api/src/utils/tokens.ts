import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { JwtPayload } from '../types';

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
