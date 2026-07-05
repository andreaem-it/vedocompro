'use client';

import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/lib/api';
import { CategoryField } from '@/types';

// Filtri dinamici per i campi configurati sulla categoria selezionata (es. Marca, Taglia).
// I valori attivi viaggiano nella query string come coppie ripetibili ?ff=Campo:Valore.
export default function CategoryFieldFilters({
  categoryId,
  activePairs,
  onChange,
}: {
  categoryId: string | undefined;
  activePairs: string[];
  onChange: (fieldName: string, value: string | null) => void;
}) {
  const { data: fields } = useQuery({
    queryKey: ['category-fields', categoryId],
    queryFn: () => lookupApi.categoryFields(Number(categoryId)).then((r) => r.data as CategoryField[]),
    enabled: !!categoryId,
  });

  const filterable = fields?.filter((f) => f.filterable) ?? [];
  if (!categoryId || filterable.length === 0) return null;

  const valueFor = (name: string): string => {
    const prefix = `${name}:`;
    const pair = activePairs.find((p) => p.startsWith(prefix));
    return pair ? pair.slice(prefix.length) : '';
  };

  return (
    <>
      {filterable.map((field) => (
        <div key={field.id}>
          <label className="label">{field.name}</label>
          {field.type === 'select' ? (
            <select
              value={valueFor(field.name)}
              onChange={(e) => onChange(field.name, e.target.value || null)}
              className="input text-sm"
            >
              <option value="">Tutti</option>
              {field.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              defaultValue={valueFor(field.name)}
              onBlur={(e) => onChange(field.name, e.target.value || null)}
              className="input text-sm"
              placeholder="Qualsiasi"
            />
          )}
        </div>
      ))}
    </>
  );
}
