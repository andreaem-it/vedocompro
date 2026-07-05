'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, lookupApi } from '@/lib/api';
import { Category } from '@/types';
import { ArrowLeft } from 'lucide-react';

interface AdminAdFormData {
  name: string;
  categoryId: number;
  price: number;
  description: string;
  objCondition: string;
  region: string;
  provincia: string;
  location: string;
}

const CONDITIONS = [
  { value: 'new', label: 'Nuovo' },
  { value: 'like_new', label: 'Come nuovo' },
  { value: 'good', label: 'Buono' },
  { value: 'acceptable', label: 'Accettabile' },
  { value: 'for_parts', label: 'Per ricambi' },
];

function flattenCategories(cats: Category[], depth = 0): { id: number; label: string }[] {
  return cats.flatMap((c) => [
    { id: c.id, label: `${'— '.repeat(depth)}${c.name}` },
    ...(c.children ? flattenCategories(c.children, depth + 1) : []),
  ]);
}

export default function AdminAdEditPage() {
  const params = useParams();
  const router = useRouter();
  const adId = Number(params.id);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: ad, isLoading } = useQuery({
    queryKey: ['admin-ad', adId],
    queryFn: () => adminApi.getAd(adId).then((r) => r.data),
    enabled: !!adId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then((r) => r.data as Category[]),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<AdminAdFormData>();

  useEffect(() => {
    if (ad) {
      reset({
        name: ad.name,
        categoryId: ad.categoryId,
        price: parseFloat(ad.price),
        description: ad.description,
        objCondition: ad.objCondition,
        region: ad.region,
        provincia: ad.provincia,
        location: ad.location,
      });
    }
  }, [ad, reset]);

  const onSubmit = async (data: AdminAdFormData) => {
    setError('');
    setSaved(false);
    try {
      await adminApi.updateAd(adId, data);
      queryClient.invalidateQueries({ queryKey: ['admin-ad', adId] });
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      setSaved(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore durante il salvataggio');
    }
  };

  if (isLoading || !ad) return <div className="p-8 text-gray-400">Caricamento...</div>;

  const flatCategories = categories ? flattenCategories(categories) : [];

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Torna agli annunci
      </button>
      <h1 className="mb-1">Modifica annuncio #{ad.id}</h1>
      <p className="text-sm text-gray-500 mb-6">Venditore: @{ad.user?.username} ({ad.user?.email})</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {saved && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">Modifiche salvate.</div>}

        <div>
          <label className="label">Titolo</label>
          <input {...register('name')} className="input" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Categoria</label>
            <select {...register('categoryId', { valueAsNumber: true })} className="input">
              {flatCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Condizione</label>
            <select {...register('objCondition')} className="input">
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Prezzo (€)</label>
          <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" min="0" className="input" />
        </div>

        <div>
          <label className="label">Descrizione</label>
          <textarea {...register('description')} rows={6} className="input resize-none" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Regione</label>
            <input {...register('region')} className="input" />
          </div>
          <div>
            <label className="label">Provincia</label>
            <input {...register('provincia')} className="input" />
          </div>
          <div>
            <label className="label">Città</label>
            <input {...register('location')} className="input" />
          </div>
        </div>

        <div className="border-t pt-5 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>
    </div>
  );
}
