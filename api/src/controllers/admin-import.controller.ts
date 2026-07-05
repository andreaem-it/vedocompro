import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

type ImportEntity = 'users' | 'ads' | 'payments';
type CsvRow = Record<string, string>;

const MAX_IMPORT_ROWS = 1000;

const REQUIRED_HEADERS: Record<ImportEntity, string[]> = {
  users: ['email', 'username', 'nome'],
  ads: ['titolo', 'categoria', 'venditore_id', 'prezzo', 'regione', 'provincia', 'comune', 'condizione'],
  payments: ['transazione', 'utente_id', 'prodotto_id', 'importo', 'valuta', 'stato', 'email_pagamento'],
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, '').toLowerCase();
}

function rowsFromCsv(csv: string) {
  const matrix = parseCsv(csv);
  if (matrix.length < 2) throw new AppError(400, 'CSV vuoto o senza righe dati');
  const headers = matrix[0].map(normalizeHeader);
  const rows = matrix.slice(1, MAX_IMPORT_ROWS + 1).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, (values[index] ?? '').trim()]),
  ));
  return { headers, rows };
}

function rowError(line: number, field: string, message: string) {
  return { line, field, message };
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function decimalValue(value: string): Prisma.Decimal | null {
  if (!value || !/^\d+([.,]\d{1,2})?$/.test(value.trim())) return null;
  return new Prisma.Decimal(value.replace(',', '.'));
}

function boolValue(value: string) {
  if (!value) return false;
  return ['1', 'true', 'vero', 'si', 'sì', 'yes'].includes(value.toLowerCase());
}

function missingHeaders(entity: ImportEntity, headers: string[]) {
  return REQUIRED_HEADERS[entity].filter((header) => !headers.includes(header));
}

async function validateUsers(rows: CsvRow[]) {
  const emails = rows.map((row) => row.email?.toLowerCase()).filter(Boolean);
  const usernames = rows.map((row) => row.username?.toLowerCase()).filter(Boolean);
  const existing = await prisma.user.findMany({
    where: { OR: [{ email: { in: emails } }, { username: { in: usernames } }] },
    select: { email: true, username: true },
  });
  const existingEmails = new Set(existing.map((user) => user.email.toLowerCase()));
  const existingUsernames = new Set(existing.map((user) => user.username.toLowerCase()));
  const seenEmails = new Set<string>();
  const seenUsernames = new Set<string>();

  return rows.map((row, index) => {
    const line = index + 2;
    const errors = [];
    const warnings = [];
    const email = row.email?.toLowerCase() ?? '';
    const username = row.username?.toLowerCase() ?? '';

    if (!email || !isEmail(email)) errors.push(rowError(line, 'email', 'Email mancante o non valida'));
    if (!username || username.length < 3) errors.push(rowError(line, 'username', 'Username mancante o troppo corto'));
    if (!row.nome) errors.push(rowError(line, 'nome', 'Nome obbligatorio'));
    if (existingEmails.has(email)) errors.push(rowError(line, 'email', 'Email già presente'));
    if (existingUsernames.has(username)) errors.push(rowError(line, 'username', 'Username già presente'));
    if (seenEmails.has(email)) errors.push(rowError(line, 'email', 'Email duplicata nel CSV'));
    if (seenUsernames.has(username)) errors.push(rowError(line, 'username', 'Username duplicato nel CSV'));
    if (!row.password) warnings.push(rowError(line, 'password', 'Password assente: in import reale servirebbe generarla o inviare reset'));
    if (row.crediti_gold && !Number.isInteger(Number(row.crediti_gold))) errors.push(rowError(line, 'crediti_gold', 'Valore intero richiesto'));
    if (row.crediti_silver && !Number.isInteger(Number(row.crediti_silver))) errors.push(rowError(line, 'crediti_silver', 'Valore intero richiesto'));
    if (row.crediti_bronze && !Number.isInteger(Number(row.crediti_bronze))) errors.push(rowError(line, 'crediti_bronze', 'Valore intero richiesto'));

    seenEmails.add(email);
    seenUsernames.add(username);
    return { line, status: errors.length ? 'error' : warnings.length ? 'warning' : 'ready', errors, warnings };
  });
}

async function validateAds(rows: CsvRow[]) {
  const categoryNames = rows.map((row) => row.categoria).filter(Boolean);
  const sellerIds = rows.map((row) => Number(row.venditore_id)).filter((id) => Number.isInteger(id));
  const [categories, users] = await Promise.all([
    prisma.category.findMany({ where: { name: { in: categoryNames } }, select: { name: true } }),
    prisma.user.findMany({ where: { id: { in: sellerIds } }, select: { id: true } }),
  ]);
  const categorySet = new Set(categories.map((category) => category.name.toLowerCase()));
  const userSet = new Set(users.map((user) => user.id));
  const allowedConditions = new Set(['new', 'like_new', 'good', 'acceptable', 'for_parts']);

  return rows.map((row, index) => {
    const line = index + 2;
    const errors = [];
    const warnings = [];
    const sellerId = Number(row.venditore_id);
    const price = decimalValue(row.prezzo);

    if (!row.titolo || row.titolo.length < 3) errors.push(rowError(line, 'titolo', 'Titolo mancante o troppo corto'));
    if (!row.categoria || !categorySet.has(row.categoria.toLowerCase())) errors.push(rowError(line, 'categoria', 'Categoria non trovata'));
    if (!Number.isInteger(sellerId) || !userSet.has(sellerId)) errors.push(rowError(line, 'venditore_id', 'Venditore non trovato'));
    if (!price || price.lt(0)) errors.push(rowError(line, 'prezzo', 'Prezzo non valido'));
    if (!row.regione) errors.push(rowError(line, 'regione', 'Regione obbligatoria'));
    if (!row.provincia) errors.push(rowError(line, 'provincia', 'Provincia obbligatoria'));
    if (!row.comune) errors.push(rowError(line, 'comune', 'Comune obbligatorio'));
    if (!allowedConditions.has(row.condizione)) errors.push(rowError(line, 'condizione', 'Condizione non valida'));
    if (!row.descrizione) warnings.push(rowError(line, 'descrizione', 'Descrizione assente: import reale dovrebbe richiederla'));
    if (!row.pubblicato) warnings.push(rowError(line, 'pubblicato', 'Pubblicazione non indicata: default previsto non pubblicato'));
    if (boolValue(row.pubblicato) && !row.descrizione) warnings.push(rowError(line, 'pubblicato', 'Annuncio pubblicabile solo dopo controllo descrizione/media'));

    return { line, status: errors.length ? 'error' : warnings.length ? 'warning' : 'ready', errors, warnings };
  });
}

async function validatePayments(rows: CsvRow[]) {
  const userIds = rows.map((row) => Number(row.utente_id)).filter((id) => Number.isInteger(id));
  const productIds = rows.map((row) => Number(row.prodotto_id)).filter((id) => Number.isInteger(id));
  const txns = rows.map((row) => row.transazione).filter(Boolean);
  const [users, products, payments] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } }),
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } }),
    prisma.payment.findMany({ where: { paypalTxnId: { in: txns } }, select: { paypalTxnId: true } }),
  ]);
  const userSet = new Set(users.map((user) => user.id));
  const productMap = new Map(products.map((product) => [product.id, product.price]));
  const existingTxns = new Set(payments.map((payment) => payment.paypalTxnId));
  const seenTxns = new Set<string>();

  return rows.map((row, index) => {
    const line = index + 2;
    const errors = [];
    const warnings = [];
    const userId = Number(row.utente_id);
    const productId = Number(row.prodotto_id);
    const amount = decimalValue(row.importo);

    if (!row.transazione) errors.push(rowError(line, 'transazione', 'Transazione obbligatoria'));
    if (existingTxns.has(row.transazione)) errors.push(rowError(line, 'transazione', 'Transazione già registrata'));
    if (seenTxns.has(row.transazione)) errors.push(rowError(line, 'transazione', 'Transazione duplicata nel CSV'));
    if (!Number.isInteger(userId) || !userSet.has(userId)) errors.push(rowError(line, 'utente_id', 'Utente non trovato'));
    if (!Number.isInteger(productId) || !productMap.has(productId)) errors.push(rowError(line, 'prodotto_id', 'Prodotto non trovato'));
    if (!amount || amount.lte(0)) errors.push(rowError(line, 'importo', 'Importo non valido'));
    if (row.valuta !== 'EUR') errors.push(rowError(line, 'valuta', 'Solo EUR supportato'));
    if (!row.stato) errors.push(rowError(line, 'stato', 'Stato pagamento obbligatorio'));
    if (!row.email_pagamento || !isEmail(row.email_pagamento)) errors.push(rowError(line, 'email_pagamento', 'Email pagamento non valida'));
    const productPrice = productMap.get(productId);
    if (productPrice && amount && !productPrice.equals(amount)) warnings.push(rowError(line, 'importo', 'Importo diverso dal prezzo prodotto attuale'));

    seenTxns.add(row.transazione);
    return { line, status: errors.length ? 'error' : warnings.length ? 'warning' : 'ready', errors, warnings };
  });
}

export const adminImportController = {
  async dryRun(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entity = req.params.entity as ImportEntity;
      if (!['users', 'ads', 'payments'].includes(entity)) throw new AppError(400, 'Tipo import non supportato');

      const csv = typeof req.body.csv === 'string' ? req.body.csv.trim() : '';
      if (!csv) throw new AppError(400, 'CSV richiesto');

      const { headers, rows } = rowsFromCsv(csv);
      const missing = missingHeaders(entity, headers);
      if (missing.length > 0) {
        throw new AppError(400, `Intestazioni mancanti: ${missing.join(', ')}`);
      }

      const rowResults = entity === 'users'
        ? await validateUsers(rows)
        : entity === 'ads'
        ? await validateAds(rows)
        : await validatePayments(rows);

      const summary = {
        totalRows: rows.length,
        readyRows: rowResults.filter((row) => row.status === 'ready').length,
        warningRows: rowResults.filter((row) => row.status === 'warning').length,
        errorRows: rowResults.filter((row) => row.status === 'error').length,
        truncated: parseCsv(csv).length - 1 > MAX_IMPORT_ROWS,
      };

      res.json({ entity, summary, rows: rowResults });
    } catch (err) {
      next(err);
    }
  },
};
