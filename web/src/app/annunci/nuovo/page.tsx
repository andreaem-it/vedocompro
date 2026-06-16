'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { adsApi, lookupApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(3, 'Minimo 3 caratteri').max(100),
  categoryId: z.coerce.number().min(1, 'Seleziona una categoria'),
  price: z.coerce.number().min(0, 'Prezzo non valido'),
  description: z.string().min(10, 'Minimo 10 caratteri'),
  objCondition: z.enum(['new', 'like_new', 'good', 'acceptable', 'for_parts']),
  region: z.string().min(1, 'Campo obbligatorio'),
  provincia: z.string().min(1, 'Campo obbligatorio'),
  location: z.string().min(1, 'Campo obbligatorio'),
});
type FormData = z.infer<typeof schema>;

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

export default function NuovoAnnuncioPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [createdAdId, setCreatedAdId] = useState<number | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?redirect=/annunci/nuovo');
  }, [user, authLoading, router]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then((r) => r.data as Category[]),
  });

  const { data: regioni } = useQuery({
    queryKey: ['regions'],
    queryFn: () => lookupApi.regions().then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await adsApi.create(data);
      setCreatedAdId(res.data.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore durante la pubblicazione');
    }
  };

  const handleUploadPhotos = async () => {
    if (!photoFiles || photoFiles.length === 0 || !createdAdId) return;
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      Array.from(photoFiles).forEach((file) => formData.append('photos', file));
      const res = await adsApi.uploadPhotos(createdAdId, formData);
      const urls = res.data?.photos?.map((p: { url: string }) => p.url) ?? [];
      setUploadedPhotos(urls);
      setPhotoFiles(null);
    } catch {
      setError('Errore durante il caricamento delle foto.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  if (!user) return null;

  if (createdAdId !== null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Annuncio pubblicato con successo!
        </div>

        <div className="card p-6">
          <h2 className="mb-4">Aggiungi foto</h2>
          <p className="text-sm text-gray-600 mb-4">Aggiungi delle foto per rendere il tuo annuncio più attraente.</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

          {uploadedPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {uploadedPhotos.map((url, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end mb-6">
            <div className="flex-1">
              <label className="label">Seleziona foto (multiplo)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="input text-sm"
                onChange={(e) => setPhotoFiles(e.target.files)}
              />
            </div>
            <button
              onClick={handleUploadPhotos}
              disabled={uploadingPhotos || !photoFiles?.length}
              className="btn-primary"
            >
              {uploadingPhotos ? 'Caricamento...' : 'Carica foto'}
            </button>
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <button onClick={() => router.push(`/annunci/${createdAdId}`)} className="btn-primary">
              Vai all&apos;annuncio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const flatCategories = categories ? flattenCategories(categories) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-2">Pubblica un annuncio</h1>
      <p className="text-gray-600 mb-8">Compila i campi sottostanti per pubblicare il tuo annuncio gratuitamente.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="label">Titolo annuncio</label>
          <input {...register('name')} className="input" placeholder="es. iPhone 13 Pro 256GB" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Categoria</label>
            <select {...register('categoryId')} className="input">
              <option value="">Seleziona...</option>
              {flatCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="label">Condizione</label>
            <select {...register('objCondition')} className="input">
              <option value="">Seleziona...</option>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.objCondition && <p className="text-red-500 text-xs mt-1">{errors.objCondition.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Prezzo (€)</label>
          <input {...register('price')} type="number" step="0.01" min="0" className="input" placeholder="0.00" />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <label className="label">Descrizione</label>
          <textarea {...register('description')} rows={6} className="input resize-none" placeholder="Descrivi il tuo prodotto..." />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Regione</label>
            <select {...register('region')} className="input">
              <option value="">Seleziona...</option>
              {regioni?.map((r: { id: number; nome: string }) => <option key={r.id} value={r.nome}>{r.nome}</option>)}
            </select>
            {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
          </div>
          <div>
            <label className="label">Provincia</label>
            <input {...register('provincia')} className="input" placeholder="es. Milano" />
            {errors.provincia && <p className="text-red-500 text-xs mt-1">{errors.provincia.message}</p>}
          </div>
          <div>
            <label className="label">Città</label>
            <input {...register('location')} className="input" placeholder="es. Milano" />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
          </div>
        </div>

        <div className="border-t pt-5 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Pubblicazione...' : 'Pubblica annuncio'}
          </button>
        </div>
      </form>
    </div>
  );
}
