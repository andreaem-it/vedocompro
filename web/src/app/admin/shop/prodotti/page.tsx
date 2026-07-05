'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react';
import { adminShopApi } from '@/lib/api';
import { ShopCategory, ShopProduct, ShopProductListResponse, ShopShipment } from '@/types';

interface FormState {
  id: number | null;
  name: string;
  price: string;
  video: string;
  isActive: boolean;
  inStock: string;
  description: string;
  categoryIds: number[];
  shipmentServiceIds: number[];
  existingPics: string[];
}

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  price: '',
  video: '',
  isActive: true,
  inStock: '',
  description: '',
  categoryIds: [],
  shipmentServiceIds: [],
  existingPics: [],
};

export default function AdminShopProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop-products', page],
    queryFn: () => adminShopApi.listProducts({ page: String(page) }).then((r) => r.data as ShopProductListResponse),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-shop-categories'],
    queryFn: () => adminShopApi.listCategories().then((r) => r.data as ShopCategory[]),
  });

  const { data: shipments } = useQuery({
    queryKey: ['admin-shop-shipments'],
    queryFn: () => adminShopApi.listShipments().then((r) => r.data as ShopShipment[]),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-shop-products'] });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setNewFiles([]);
    setShowForm(false);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('price', form.price);
    fd.append('video', form.video);
    fd.append('isActive', String(form.isActive));
    fd.append('inStock', form.inStock);
    fd.append('description', form.description);
    fd.append('categoryIds', form.categoryIds.join(','));
    fd.append('shipmentServiceIds', form.shipmentServiceIds.join(','));
    if (form.id) fd.append('existingPics', form.existingPics.join(','));
    newFiles.forEach((file) => fd.append('pics', file));
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: () => adminShopApi.createProduct(buildFormData()),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => adminShopApi.updateProduct(id, buildFormData()),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminShopApi.deleteProduct(id),
    onSuccess: invalidate,
  });

  const startEdit = (product: ShopProduct) => {
    setForm({
      id: product.id,
      name: product.name,
      price: product.price,
      video: product.video ?? '',
      isActive: product.isActive,
      inStock: product.inStock !== null ? String(product.inStock) : '',
      description: product.description,
      categoryIds: product.categories.map((c) => c.id),
      shipmentServiceIds: product.shipmentServices.map((s) => s.id),
      existingPics: product.pics ?? [],
    });
    setNewFiles([]);
    setShowForm(true);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id) {
      updateMutation.mutate(form.id);
    } else {
      createMutation.mutate();
    }
  };

  const toggleMultiSelect = (field: 'categoryIds' | 'shipmentServiceIds', id: number) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter((v) => v !== id) : [...f[field], id],
    }));
  };

  const removeExistingPic = (pic: string) => {
    setForm((f) => ({ ...f, existingPics: f.existingPics.filter((p) => p !== pic) }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8">
      <Link href="/admin/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand mb-4">
        <ArrowLeft className="w-4 h-4" /> Dashboard Shop
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1>Prodotti Shop</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuovo prodotto
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>{form.id ? 'Modifica prodotto' : 'Nuovo prodotto'}</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Prezzo (€)</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Quantità disponibile</label>
              <input type="number" min="0" value={form.inStock} onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.value }))} className="input" placeholder="Vuoto = illimitata" />
            </div>
            <div>
              <label className="label">URL video (opzionale)</label>
              <input value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Prodotto attivo (visibile nel catalogo)</label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Categorie</label>
              <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                {categories?.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm px-1 py-0.5 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(cat.id)}
                      onChange={() => toggleMultiSelect('categoryIds', cat.id)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Metodi di spedizione</label>
              <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                {shipments?.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm px-1 py-0.5 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={form.shipmentServiceIds.includes(s.id)}
                      onChange={() => toggleMultiSelect('shipmentServiceIds', s.id)}
                    />
                    {s.serviceName}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Immagini</label>
            {form.existingPics.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {form.existingPics.map((pic) => (
                  <div key={pic} className="relative w-16 h-16">
                    <Image src={pic} alt="" fill className="object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeExistingPic(pic)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
              className="input"
            />
            {newFiles.length > 0 && <p className="text-xs text-gray-500 mt-1">{newFiles.length} nuove immagini selezionate</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving}>
            {form.id ? 'Salva modifiche' : 'Crea prodotto'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Prodotto</th>
              <th className="px-4 py-3">Prezzo</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.products.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nessun prodotto</td></tr>
            ) : (
              data.products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    {product.pics?.[0] && (
                      <Image src={product.pics[0]} alt="" width={32} height={32} className="rounded object-cover" />
                    )}
                    {product.name}
                  </td>
                  <td className="px-4 py-3">€{parseFloat(product.price).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-gray-500">{product.inStock ?? 'Illimitato'}</td>
                  <td className="px-4 py-3">
                    {product.isActive
                      ? <span className="badge bg-green-100 text-green-700">Attivo</span>
                      : <span className="badge bg-gray-100 text-gray-600">Disattivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(product)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare il prodotto "${product.name}"?`)) deleteMutation.mutate(product.id);
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

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">Precedente</button>
          <span>Pagina {page} di {data.pagination.pages}</span>
          <button disabled={page === data.pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">Successiva</button>
        </div>
      )}
    </div>
  );
}
