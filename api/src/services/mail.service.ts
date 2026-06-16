import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.port === 465,
  auth: {
    user: config.mail.user,
    pass: config.mail.password,
  },
});

async function send(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({ from: config.mail.from, to, subject, html });
}

export const mailService = {
  async sendWelcome(to: string, username: string): Promise<void> {
    await send(
      to,
      'Benvenuto su VedoCompro!',
      `<h2>Ciao ${username}!</h2>
       <p>Il tuo account è stato creato con successo.</p>
       <p>Puoi ora pubblicare annunci e acquistare prodotti su <a href="${config.appUrl}">VedoCompro</a>.</p>`,
    );
  },

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const link = `${config.appUrl}/reset-password?token=${token}`;
    await send(
      to,
      'Reset password VedoCompro',
      `<h2>Reset della tua password</h2>
       <p>Hai richiesto il reset della password. Clicca il link qui sotto (valido 1 ora):</p>
       <p><a href="${link}">${link}</a></p>
       <p>Se non hai richiesto il reset, ignora questa email.</p>`,
    );
  },

  async sendNewMessage(to: string, fromUsername: string, adTitle: string): Promise<void> {
    await send(
      to,
      `Nuovo messaggio da ${fromUsername} su VedoCompro`,
      `<h2>Hai un nuovo messaggio</h2>
       <p><strong>${fromUsername}</strong> ti ha scritto riguardo all'annuncio "<strong>${adTitle}</strong>".</p>
       <p><a href="${config.appUrl}/messaggi">Leggi il messaggio</a></p>`,
    );
  },

  async sendOrderNotification(to: string, type: 'sold' | 'purchased', adTitle: string): Promise<void> {
    const subject = type === 'sold' ? 'Il tuo annuncio è stato venduto!' : 'Acquisto confermato!';
    const body =
      type === 'sold'
        ? `Il tuo annuncio "<strong>${adTitle}</strong>" è stato acquistato.`
        : `Hai acquistato "<strong>${adTitle}</strong>" con successo.`;

    await send(to, subject, `<h2>${subject}</h2><p>${body}</p><p><a href="${config.appUrl}/profilo">Vai al tuo profilo</a></p>`);
  },
};
