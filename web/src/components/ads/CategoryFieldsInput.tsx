'use client';

import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/lib/api';
import { CategoryField } from '@/types';

// Campi configurati dall'admin per la categoria selezionata, compilabili da tutti i
// venditori nel form annuncio (es. Marca, Taglia). I valori vengono inviati come
// fields/vals nella create/update.
export default function CategoryFieldsInput({
  categoryId,
  values,
  onChange,
}: {
  categoryId: number | undefined;
  values: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
}) {
  const { data: fields } = useQuery({
    queryKey: ['category-fields', String(categoryId)],
    queryFn: () => lookupApi.categoryFields(categoryId!).then((r) => r.data as CategoryField[]),
    enabled: !!categoryId,
  });

  if (!categoryId || !fields?.length) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.id}>
          <label className="label">
            {field.name}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.type === 'select' ? (
            <select
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="input"
            >
              <option value="">Seleziona…</option>
              {field.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="input"
            />
          )}
        </div>
      ))}
    </div>
  );
}
