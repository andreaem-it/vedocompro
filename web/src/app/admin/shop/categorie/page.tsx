'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react';
import { adminShopApi } from '@/lib/api';
import { ShopCategory } from '@/types';

interface FormState {
  id: number | null;
  name: string;
  fatherId: string;
}

const EMPTY_FORM: FormState = { id: null, name: '', fatherId: '' };

export default function AdminShopCategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-shop-categories'],
    queryFn: () => adminShopApi.listCategories().then((r) => r.data as ShopCategory[]),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-shop-categories'] });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; fatherId: number | null }) => adminShopApi.createCategory(data),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; fatherId: number | null } }) =>
      adminShopApi.updateCategory(id, data),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminShopApi.deleteCategory(id),
    onSuccess: invalidate,
  });

  const startEdit = (cat: ShopCategory) => {
    setForm({ id: cat.id, name: cat.name, fatherId: cat.fatherId ? String(cat.fatherId) : '' });
    setShowForm(true);
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, fatherId: form.fatherId ? parseInt(form.fatherId, 10) : null };
    if (form.id) {
      updateMutation.mutate({ id: form.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const flat = categories ?? [];

  return (
    <div className="p-8">
      <Link href="/admin/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand mb-4">
        <ArrowLeft className="w-4 h-4" /> Dashboard Shop
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1>Categorie Shop</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuova categoria
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>{form.id ? 'Modifica categoria' : 'Nuova categoria'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
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
                value={form.fatherId}
                onChange={(e) => setForm((f) => ({ ...f, fatherId: e.target.value }))}
                className="input"
              >
                <option value="">Nessuna (categoria radice)</option>
                {flat.filter((c) => c.id !== form.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
            {form.id ? 'Salva modifiche' : 'Crea categoria'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Categoria padre</th>
              <th className="px-4 py-3">Prodotti</th>
              <th className="px-4 py-3">Sottocategorie</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : flat.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nessuna categoria</td></tr>
            ) : (
              flat.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.father?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{cat._count?.products ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{cat._count?.children ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare la categoria "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
