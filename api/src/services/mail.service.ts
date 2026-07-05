import nodemailer from 'nodemailer';
import { config } from '../config';
import { prisma } from '../lib/prisma';

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.port === 465,
  auth: {
    user: config.mail.user,
    pass: config.mail.password,
  },
});

async function send(to: string, subject: string, html: string, from = config.mail.from): Promise<void> {
  await transporter.sendMail({ from, to, subject, html });
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Cerca un template admin (AdminDefaultMail) per `type`. Se esiste, sostituisce i placeholder
 * `{{...}}` indicati e invia quel template (title come subject, message come corpo HTML).
 * Se non esiste alcun record con quel `type`, ritorna false e il chiamante deve usare il fallback hardcoded.
 */
async function sendFromTemplate(
  to: string,
  type: number,
  placeholders: Record<string, string>,
): Promise<boolean> {
  const template = await prisma.adminDefaultMail.findFirst({ where: { type } });
  if (!template) return false;

  let subject = template.title;
  let html = template.message;
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    subject = subject.split(placeholder).join(value);
    html = html.split(placeholder).join(value);
  }

  await send(to, subject, html);
  return true;
}

export const mailService = {
  send,

  isConfigured(): boolean {
    return Boolean(process.env.MAIL_HOST && process.env.MAIL_FROM);
  },

  async sendWelcome(to: string, username: string): Promise<void> {
    // type=3: template admin opzionale per il messaggio di benvenuto (placeholder {{username}})
    const sentFromTemplate = await sendFromTemplate(to, 3, { username });
    if (sentFromTemplate) return;

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

  async sendVerifyEmail(to: string, code: string): Promise<void> {
    const link = `${config.appUrl}/verifica/${code}`;
    await send(
      to,
      'Verifica il tuo account VedoCompro',
      `<h2>Conferma il tuo indirizzo email</h2>
       <p>Grazie per esserti registrato su VedoCompro. Clicca il link qui sotto per attivare il tuo account:</p>
       <p><a href="${link}">${link}</a></p>
       <p>Se non hai creato tu questo account, ignora questa email.</p>`,
    );
  },

  async sendAdPendingReview(to: string, adTitle: string, adId: number): Promise<void> {
    await send(
      to,
      'Nuovo annuncio da moderare',
      `<h2>Nuovo annuncio in attesa di moderazione</h2>
       <p>L'annuncio "<strong>${adTitle}</strong>" è stato pubblicato da un utente ed è in attesa di approvazione.</p>
       <p><a href="${config.appUrl}/admin/annunci">Vai al pannello di moderazione</a></p>`,
    );
  },

  async sendAdApproved(to: string, adTitle: string, adId: number): Promise<void> {
    // type=2 (legacy AdminDefaultMails): template admin per l'approvazione annuncio, se presente
    const sentFromTemplate = await sendFromTemplate(to, 2, { adTitle, adId: String(adId) });
    if (sentFromTemplate) return;

    await send(
      to,
      'Il tuo annuncio è stato approvato',
      `<h2>Annuncio approvato</h2>
       <p>Il tuo annuncio "<strong>${adTitle}</strong>" è stato verificato ed è ora online.</p>
       <p><a href="${config.appUrl}/annunci/${adId}">Vai all'annuncio</a></p>`,
    );
  },

  async sendAdRejected(to: string, adTitle: string): Promise<void> {
    // type=1 (legacy AdminDefaultMails): template admin per il rifiuto annuncio, se presente
    const sentFromTemplate = await sendFromTemplate(to, 1, { adTitle });
    if (sentFromTemplate) return;

    await send(
      to,
      'Il tuo annuncio non è stato approvato',
      `<h2>Annuncio non approvato</h2>
       <p>Il tuo annuncio "<strong>${adTitle}</strong>" non ha superato la moderazione ed è stato disattivato.</p>
       <p>Puoi modificarlo dal tuo profilo e ripubblicarlo.</p>`,
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

  async sendInternalMessageNotify(to: string, fromUsername: string, message: string): Promise<void> {
    await send(
      to,
      'Hai un nuovo messaggio su VedoCompro',
      `<h2>Hai un nuovo messaggio</h2>
       <p><strong>${fromUsername}</strong> ti ha scritto:</p>
       <div style="padding:12px;border-left:4px solid #4396c1;background:#f5f8fb">${message}</div>
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

  async sendMarketplaceOrderUpdate(
    to: string,
    subject: string,
    adTitle: string,
    message: string,
    orderId: number,
  ): Promise<void> {
    await send(
      to,
      subject,
      `<h2>${escapeHtml(subject)}</h2>
       <p>${escapeHtml(message)}</p>
       <p>Ordine #${orderId} - <strong>${escapeHtml(adTitle)}</strong></p>
       <p><a href="${config.appUrl}/profilo/acquisti-vendite">Vai ad acquisti e vendite</a></p>`,
    );
  },

  async sendMarketplacePaymentSubmitted(
    to: string,
    adTitle: string,
    orderId: number,
    provider: string,
    paymentIntentId?: string | null,
  ): Promise<void> {
    await send(
      to,
      'Pagamento ordine da verificare',
      `<h2>Pagamento ordine da verificare</h2>
       <p>Il compratore ha dichiarato di aver inviato il pagamento per l'ordine #${orderId}.</p>
       <p>Annuncio: <strong>${escapeHtml(adTitle)}</strong></p>
       <p>Metodo: ${escapeHtml(provider)}${paymentIntentId ? `<br />Riferimento: ${escapeHtml(paymentIntentId)}` : ''}</p>
       <p><a href="${config.appUrl}/profilo/acquisti-vendite">Apri l'ordine</a></p>`,
    );
  },

  async sendSavedSearchAlert(
    to: string,
    username: string,
    searchName: string,
    totalMatches: number,
    searchUrl: string,
    ads: Array<{ id: number; name: string; price: unknown; location: string; region: string }>,
  ): Promise<void> {
    const rows = ads.map((ad) => {
      const price = ad.price ? ` - EUR ${escapeHtml(String(ad.price))}` : '';
      const place = [ad.location, ad.region].filter(Boolean).join(', ');
      return `<li><a href="${config.appUrl}/annunci/${ad.id}">${escapeHtml(ad.name)}</a>${price}${place ? ` <small>(${escapeHtml(place)})</small>` : ''}</li>`;
    }).join('');

    await send(
      to,
      `Nuovi annunci per "${searchName}"`,
      `<h2>Ciao ${escapeHtml(username)}, ci sono nuovi annunci per la tua ricerca</h2>
       <p>Abbiamo trovato ${totalMatches} ${totalMatches === 1 ? 'nuovo annuncio' : 'nuovi annunci'} per "<strong>${escapeHtml(searchName)}</strong>".</p>
       ${rows ? `<ul>${rows}</ul>` : ''}
       <p><a href="${searchUrl}">Apri la ricerca salvata</a></p>
       <p style="color:#6b7280;font-size:12px">Puoi modificare o mettere in pausa questi alert dal tuo profilo.</p>`,
    );
  },

  // Eventi offerta (trattativa prezzo): destinatario e testo variano per evento,
  // il link porta sempre a /profilo/offerte dove si può rispondere.
  async sendOfferNotification(
    to: string,
    subject: string,
    message: string,
    adTitle: string,
  ): Promise<void> {
    await send(
      to,
      subject,
      `<h2>${escapeHtml(subject)}</h2>
       <p>${escapeHtml(message)}</p>
       <p>Annuncio: <strong>${escapeHtml(adTitle)}</strong></p>
       <p><a href="${config.appUrl}/profilo/offerte">Vai alle tue offerte</a></p>`,
    );
  },

  // Eventi contestazione ordine: apertura, nuovo messaggio, decisione admin.
  async sendDisputeNotification(
    to: string,
    subject: string,
    message: string,
    orderId: number,
  ): Promise<void> {
    await send(
      to,
      subject,
      `<h2>${escapeHtml(subject)}</h2>
       <p>${escapeHtml(message)}</p>
       <p>Riferimento: ordine #${orderId}</p>
       <p><a href="${config.appUrl}/profilo/acquisti-vendite">Apri la contestazione</a></p>`,
    );
  },
};
