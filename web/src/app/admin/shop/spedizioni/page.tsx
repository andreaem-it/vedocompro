'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react';
import { adminShopApi } from '@/lib/api';
import { ShopShipment } from '@/types';

interface FormState {
  id: number | null;
  serviceName: string;
  basePrice: string;
  expectedDelivery: string;
  serviceLogo: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  serviceName: '',
  basePrice: '',
  expectedDelivery: '',
  serviceLogo: '',
  isActive: true,
};

export default function AdminShopShipmentsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['admin-shop-shipments'],
    queryFn: () => adminShopApi.listShipments().then((r) => r.data as ShopShipment[]),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-shop-shipments'] });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      adminShopApi.createShipment({
        serviceName: form.serviceName,
        basePrice: form.basePrice,
        expectedDelivery: form.expectedDelivery,
        serviceLogo: form.serviceLogo || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) =>
      adminShopApi.updateShipment(id, {
        serviceName: form.serviceName,
        basePrice: form.basePrice,
        expectedDelivery: form.expectedDelivery,
        serviceLogo: form.serviceLogo || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminShopApi.deleteShipment(id),
    onSuccess: invalidate,
  });

  const startEdit = (s: ShopShipment) => {
    setForm({
      id: s.id,
      serviceName: s.serviceName,
      basePrice: s.basePrice,
      expectedDelivery: s.expectedDelivery,
      serviceLogo: s.serviceLogo ?? '',
      isActive: s.isActive,
    });
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8">
      <Link href="/admin/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand mb-4">
        <ArrowLeft className="w-4 h-4" /> Dashboard Shop
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1>Metodi di spedizione</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuovo metodo
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>{form.id ? 'Modifica metodo di spedizione' : 'Nuovo metodo di spedizione'}</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome servizio</label>
              <input required value={form.serviceName} onChange={(e) => setForm((f) => ({ ...f, serviceName: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Prezzo base (€)</label>
              <input required type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Tempi di consegna (es. 2-4 giorni)</label>
              <input required value={form.expectedDelivery} onChange={(e) => setForm((f) => ({ ...f, expectedDelivery: e.target.value }))} className="input" placeholder="2-4" />
            </div>
            <div>
              <label className="label">URL logo (opzionale)</label>
              <input value={form.serviceLogo} onChange={(e) => setForm((f) => ({ ...f, serviceLogo: e.target.value }))} className="input" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shipActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="shipActive" className="text-sm text-gray-700">Metodo attivo (selezionabile per i prodotti)</label>
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving}>
            {form.id ? 'Salva modifiche' : 'Crea metodo'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Servizio</th>
              <th className="px-4 py-3">Prezzo base</th>
              <th className="px-4 py-3">Tempi di consegna</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !shipments?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nessun metodo di spedizione</td></tr>
            ) : (
              shipments.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.serviceName}</td>
                  <td className="px-4 py-3">€{parseFloat(s.basePrice).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-gray-500">{s.expectedDelivery} giorni</td>
                  <td className="px-4 py-3">
                    {s.isActive
                      ? <span className="badge bg-green-100 text-green-700">Attivo</span>
                      : <span className="badge bg-gray-100 text-gray-600">Disattivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(s)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare il metodo "${s.serviceName}"?`)) deleteMutation.mutate(s.id);
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
