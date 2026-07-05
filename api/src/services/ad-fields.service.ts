import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

/**
 * Normalizza e valida i campi categoria-specifici di un annuncio.
 *
 * - I campi CONFIGURATI dall'admin per la categoria (AdvancedField) sono compilabili
 *   da tutti i venditori; per type=select il valore deve essere tra le options,
 *   i campi required devono essere presenti.
 * - I campi CUSTOM liberi (non configurati) restano riservati ai Business,
 *   come nel comportamento precedente.
 * - fieldPairs ("Campo:Valore") è la forma denormalizzata usata dal filtro di ricerca.
 */
export async function resolveAdFields(
  categoryId: number,
  rawFields: unknown,
  rawVals: unknown,
  isBusiness: boolean,
): Promise<{ fields: string[]; vals: string[]; fieldPairs: string[] }> {
  const inputFields = Array.isArray(rawFields) ? rawFields.map((f) => String(f).trim()) : [];
  const inputVals = Array.isArray(rawVals) ? rawVals.map((v) => String(v).trim()) : [];

  const configured = await prisma.advancedField.findMany({
    where: { categoryId },
    orderBy: { sortOrder: 'asc' },
  });
  const configuredByName = new Map(configured.map((c) => [c.name, c]));

  const fields: string[] = [];
  const vals: string[] = [];

  for (let i = 0; i < inputFields.length; i += 1) {
    const key = inputFields[i];
    const value = inputVals[i] ?? '';
    if (!key || !value) continue;

    const config = configuredByName.get(key);
    if (config) {
      if (config.type === 'select' && !config.options.includes(value)) {
        throw new AppError(400, `Valore non valido per il campo "${key}"`);
      }
      if (config.type === 'number' && Number.isNaN(parseFloat(value))) {
        throw new AppError(400, `Il campo "${key}" richiede un numero`);
      }
      fields.push(key);
      vals.push(value);
    } else if (isBusiness) {
      // Campo custom libero: solo Business
      fields.push(key);
      vals.push(value);
    }
    // Campo non configurato inviato da un non-business: ignorato silenziosamente
  }

  for (const config of configured) {
    if (config.required && !fields.includes(config.name)) {
      throw new AppError(400, `Il campo "${config.name}" è obbligatorio per questa categoria`);
    }
  }

  return {
    fields,
    vals,
    fieldPairs: fields.map((key, i) => `${key}:${vals[i]}`),
  };
}
