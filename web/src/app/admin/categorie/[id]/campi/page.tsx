'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListFilter, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { adminCategoriesApi } from '@/lib/api';
import { CategoryField } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  select: 'Scelta multipla',
  text: 'Testo libero',
  number: 'Numero',
};

export default function AdminCategoryFieldsPage() {
  const params = useParams<{ id: string }>();
  const categoryId = parseInt(params.id, 10);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('select');
  const [optionsText, setOptionsText] = useState('');
  const [filterable, setFilterable] = useState(true);
  const [required, setRequired] = useState(false);

  const { data: category } = useQuery({
    queryKey: ['admin-category', categoryId],
    queryFn: () => adminCategoriesApi.getById(categoryId).then((r) => r.data as { id: number; name: string }),
  });

  const { data: fields } = useQuery({
    queryKey: ['admin-category-fields', categoryId],
    queryFn: () => adminCategoriesApi.listFields(categoryId).then((r) => r.data as CategoryField[]),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-category-fields', categoryId] });
    queryClient.invalidateQueries({ queryKey: ['category-fields'] });
  };

  const create = useMutation({
    mutationFn: () =>
      adminCategoriesApi.createField(categoryId, {
        name,
        type,
        options: type === 'select' ? optionsText.split('\n').map((o) => o.trim()).filter(Boolean) : [],
        filterable,
        required,
      }),
    onSuccess: () => {
      setName(''); setOptionsText(''); setError('');
      invalidate();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore');
    },
  });

  const update = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: Record<string, unknown> }) =>
      adminCategoriesApi.updateField(fieldId, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (fieldId: number) => adminCategoriesApi.deleteField(fieldId),
    onSuccess: invalidate,
  });

  const move = (index: number, direction: -1 | 1) => {
    if (!fields) return;
    const target = fields[index + direction];
    const current = fields[index];
    if (!target) return;
    update.mutate({ fieldId: current.id, data: { sortOrder: target.sortOrder ?? 0 } });
    update.mutate({ fieldId: target.id, data: { sortOrder: current.sortOrder ?? 0 } });
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="admin-breadcrumb mb-4">
        <Link href="/admin">Dashboard</Link> / <Link href="/admin/categorie">Categorie</Link> / Campi
      </div>
      <div className="flex items-center gap-2 mb-6">
        <ListFilter className="w-5 h-5 text-brand" />
        <h1>Campi per &quot;{category?.name ?? '…'}&quot;</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        I campi configurati qui compaiono nel form di inserimento annuncio per questa categoria
        e, se filtrabili, come filtri nella ricerca.
      </p>

      {/* Nuovo campo */}
      <div className="card p-5 mb-6 space-y-3">
        <p className="font-medium text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nuovo campo</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Nome campo (es. Marca)" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {type === 'select' && (
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className="input min-h-20 text-sm"
            placeholder={'Un\'opzione per riga, es.\nBosch\nMakita\nAltro'}
          />
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={filterable} onChange={(e) => setFilterable(e.target.checked)} />
            Usabile come filtro in ricerca
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Obbligatorio
          </label>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending} className="btn-primary text-sm">
          Aggiungi campo
        </button>
      </div>

      {/* Lista campi */}
      {!fields?.length ? (
        <div className="card p-8 text-center text-gray-500">Nessun campo configurato per questa categoria.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Campo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Opzioni</th>
                <th className="px-4 py-3">Filtro</th>
                <th className="px-4 py-3">Obblig.</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.map((f, i) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[f.type] ?? f.type}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-56 truncate" title={f.options.join(', ')}>
                    {f.type === 'select' ? f.options.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={f.filterable}
                      onChange={(e) => update.mutate({ fieldId: f.id, data: { filterable: e.target.checked } })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => update.mutate({ fieldId: f.id, data: { required: e.target.checked } })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost p-1 disabled:opacity-30" title="Sposta su">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === fields.length - 1} className="btn-ghost p-1 disabled:opacity-30" title="Sposta giù">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove.mutate(f.id)} className="btn-ghost p-1 text-red-600" title="Elimina campo">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
