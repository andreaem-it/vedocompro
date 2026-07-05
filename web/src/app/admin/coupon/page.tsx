'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Copy, Check, Ticket } from 'lucide-react';
import { adminCouponsApi } from '@/lib/api';
import { Coupon, CouponListResponse } from '@/types';

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [value, setValue] = useState('');
  const [assigned, setAssigned] = useState('');
  const [generatedCoupon, setGeneratedCoupon] = useState<Coupon | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: () => adminCouponsApi.listCoupons({ page: String(page) }).then((r) => r.data as CouponListResponse),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });

  const resetForm = () => {
    setValue('');
    setAssigned('');
    setShowForm(false);
  };

  const generateMutation = useMutation({
    mutationFn: () => adminCouponsApi.generateCoupon({ value: parseFloat(value), assigned: assigned || undefined }).then((r) => r.data as Coupon),
    onSuccess: (coupon) => {
      invalidate();
      setGeneratedCoupon(coupon);
      setValue('');
      setAssigned('');
      setCopied(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCouponsApi.deleteCoupon(id),
    onSuccess: invalidate,
  });

  const startCreate = () => {
    setGeneratedCoupon(null);
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available, ignore
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1>Coupon Sconto</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Genera nuovo coupon
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>Genera nuovo coupon</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!generatedCoupon ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Valore (€)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="input"
                    placeholder="es. 10"
                  />
                </div>
                <div>
                  <label className="label">Assegnato a (opzionale)</label>
                  <input
                    value={assigned}
                    onChange={(e) => setAssigned(e.target.value)}
                    className="input"
                    placeholder="username o email"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generazione...' : 'Genera coupon'}
              </button>
              {generateMutation.isError && (
                <p className="text-sm text-red-600">Errore durante la generazione del coupon.</p>
              )}
            </form>
          ) : (
            <div className="text-center py-4">
              <Ticket className="w-8 h-8 text-brand mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">Coupon generato con successo</p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-brand/10 text-brand text-lg font-semibold px-4 py-2 rounded-lg">
                  {generatedCoupon.code}
                </code>
                <button
                  type="button"
                  onClick={() => copyCode(generatedCoupon.code)}
                  className="btn-secondary"
                  title="Copia codice"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Valore: <strong>€{generatedCoupon.value.toLocaleString('it-IT')}</strong>
                {generatedCoupon.assigned && <> &middot; Assegnato a: <strong>{generatedCoupon.assigned}</strong></>}
              </p>
              <button type="button" onClick={startCreate} className="btn-secondary mt-4">
                Genera un altro coupon
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Valore</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Assegnato a</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.coupons.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nessun coupon</td></tr>
            ) : (
              data.coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium font-mono">{coupon.code}</td>
                  <td className="px-4 py-3">€{coupon.value.toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3">
                    {coupon.valid === 1
                      ? <span className="badge bg-green-100 text-green-700">Valido</span>
                      : <span className="badge bg-gray-100 text-gray-600">Usato</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{coupon.assigned || '—'}</td>
                  <td className="px-4 py-3">
                    {coupon.valid === 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare il coupon "${coupon.code}"?`)) deleteMutation.mutate(coupon.id);
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
