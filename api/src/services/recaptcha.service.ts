import { config } from '../config';
import { AppError } from '../middleware/error.middleware';

export async function verifyRecaptcha(token?: string): Promise<void> {
  if (!config.recaptchaSecret) return;
  if (!token) throw new AppError(400, 'Verifica reCAPTCHA richiesta');

  const params = new URLSearchParams({
    secret: config.recaptchaSecret,
    response: token,
  });

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const result = await response.json() as { success?: boolean; score?: number };

  if (!result.success) {
    throw new AppError(400, 'Verifica reCAPTCHA non superata');
  }
}
