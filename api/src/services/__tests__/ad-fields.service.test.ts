import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    advancedField: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';
import { resolveAdFields } from '../ad-fields.service';

const mockFindMany = prisma.advancedField.findMany as ReturnType<typeof vi.fn>;

const MARCA_SELECT = {
  id: 1, name: 'Marca', categoryId: 10, type: 'select',
  options: ['Bosch', 'Makita'], filterable: true, required: false, sortOrder: 1,
};
const PESO_NUMBER = {
  id: 2, name: 'Peso', categoryId: 10, type: 'number',
  options: [], filterable: true, required: false, sortOrder: 2,
};
const TAGLIA_REQUIRED = {
  id: 3, name: 'Taglia', categoryId: 10, type: 'select',
  options: ['S', 'M', 'L'], filterable: true, required: true, sortOrder: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveAdFields', () => {
  it('accetta un campo select con valore tra le opzioni e genera fieldPairs', async () => {
    mockFindMany.mockResolvedValue([MARCA_SELECT]);
    const result = await resolveAdFields(10, ['Marca'], ['Bosch'], false);
    expect(result).toEqual({ fields: ['Marca'], vals: ['Bosch'], fieldPairs: ['Marca:Bosch'] });
  });

  it('rifiuta un valore select fuori dalle opzioni', async () => {
    mockFindMany.mockResolvedValue([MARCA_SELECT]);
    await expect(resolveAdFields(10, ['Marca'], ['DeWalt'], false)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rifiuta un campo number non numerico', async () => {
    mockFindMany.mockResolvedValue([PESO_NUMBER]);
    await expect(resolveAdFields(10, ['Peso'], ['pesante'], false)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('ignora i campi custom non configurati per i non-business', async () => {
    mockFindMany.mockResolvedValue([MARCA_SELECT]);
    const result = await resolveAdFields(10, ['Marca', 'CampoLibero'], ['Bosch', 'X'], false);
    expect(result.fields).toEqual(['Marca']);
  });

  it('accetta i campi custom liberi per i business', async () => {
    mockFindMany.mockResolvedValue([MARCA_SELECT]);
    const result = await resolveAdFields(10, ['Marca', 'CampoLibero'], ['Bosch', 'X'], true);
    expect(result.fields).toEqual(['Marca', 'CampoLibero']);
    expect(result.fieldPairs).toEqual(['Marca:Bosch', 'CampoLibero:X']);
  });

  it('richiede i campi required', async () => {
    mockFindMany.mockResolvedValue([TAGLIA_REQUIRED]);
    await expect(resolveAdFields(10, [], [], false)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('scarta le coppie con chiave o valore vuoto', async () => {
    mockFindMany.mockResolvedValue([MARCA_SELECT]);
    const result = await resolveAdFields(10, ['Marca', ''], ['', 'orfano'], true);
    expect(result.fields).toEqual([]);
    expect(result.fieldPairs).toEqual([]);
  });
});
