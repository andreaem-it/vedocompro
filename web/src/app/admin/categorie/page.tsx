'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, X, FolderTree, ListFilter } from 'lucide-react';
import { adminCategoriesApi } from '@/lib/api';
import { AdCategory } from '@/types';
import { AxiosError } from 'axios';

interface FormState {
  id: number | null;
  name: string;
  parentId: string;
}

const EMPTY_FORM: FormState = { id: null, name: '', parentId: '' };

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoriesApi.list().then((r) => r.data as AdCategory[]),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const extractError = (err: unknown) =>
    (err as AxiosError<{ error?: string }>)?.response?.data?.error ?? 'Si è verificato un errore';

  const createMutation = useMutation({
    mutationFn: (data: { name: string; parentId: number | null }) => adminCategoriesApi.create(data),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
      setError(null);
    },
    onError: (err) => setError(extractError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; parentId: number | null } }) =>
      adminCategoriesApi.update(id, data),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
      setError(null);
    },
    onError: (err) => setError(extractError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCategoriesApi.remove(id),
    onSuccess: () => {
      invalidate();
      setError(null);
    },
    onError: (err) => setError(extractError(err)),
  });

  const parents = categories ?? [];

  // Flat list of parent categories usable as "padre" options in the select,
  // excluding the category currently being edited (cannot be its own parent).
  const parentOptions = parents.filter((c) => c.id !== form.id);

  const startEdit = (cat: AdCategory) => {
    setForm({ id: cat.id, name: cat.name, parentId: cat.parentId ? String(cat.parentId) : '' });
    setShowForm(true);
    setError(null);
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, parentId: form.parentId ? parseInt(form.parentId, 10) : null };
    if (form.id) {
      updateMutation.mutate({ id: form.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (cat: AdCategory) => {
    if (confirm(`Eliminare la categoria "${cat.name}"?`)) {
      deleteMutation.mutate(cat.id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1>Categorie Annunci</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuova categoria
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>{form.id ? 'Modifica categoria' : 'Nuova categoria'}</h3>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Categoria padre</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="input"
              >
                <option value="">Nessuna, è una categoria padre</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {form.id ? 'Salva modifiche' : 'Crea categoria'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Annunci</th>
              <th className="px-4 py-3">Sottocategorie</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : parents.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nessuna categoria</td></tr>
            ) : (
              parents.map((parent) => (
                <CategoryRow
                  key={parent.id}
                  parent={parent}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({
  parent,
  onEdit,
  onDelete,
}: {
  parent: AdCategory;
  onEdit: (cat: AdCategory) => void;
  onDelete: (cat: AdCategory) => void;
}) {
  const children = parent.children ?? [];
  return (
    <>
      <tr className="hover:bg-gray-50 bg-gray-50/50">
        <td className="px-4 py-3 font-semibold">
          <span className="inline-flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-brand" />
            {parent.name}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-500">
          <span className="badge bg-brand/10 text-brand">{parent._count?.ads ?? 0}</span>
        </td>
        <td className="px-4 py-3 text-gray-500">{children.length}</td>
        <td className="px-4 py-3">
          <RowActions cat={parent} onEdit={onEdit} onDelete={onDelete} />
        </td>
      </tr>
      {children.map((child) => (
        <tr key={child.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 pl-10 text-gray-700">— {child.name}</td>
          <td className="px-4 py-3 text-gray-500">
            <span className="badge bg-gray-100 text-gray-600">{child._count?.ads ?? 0}</span>
          </td>
          <td className="px-4 py-3 text-gray-400">—</td>
          <td className="px-4 py-3">
            <RowActions cat={child} onEdit={onEdit} onDelete={onDelete} />
          </td>
        </tr>
      ))}
    </>
  );
}

function RowActions({
  cat,
  onEdit,
  onDelete,
}: {
  cat: AdCategory;
  onEdit: (cat: AdCategory) => void;
  onDelete: (cat: AdCategory) => void;
}) {
  return (
    <div className="flex gap-1">
      <Link
        href={`/admin/categorie/${cat.id}/campi`}
        className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
        title="Campi categoria (filtri ricerca)"
      >
        <ListFilter className="w-4 h-4" />
      </Link>
      <button
        onClick={() => onEdit(cat)}
        className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
        title="Modifica"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(cat)}
        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Elimina"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
