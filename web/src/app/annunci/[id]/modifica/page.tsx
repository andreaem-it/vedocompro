'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adsApi, lookupApi } from '@/lib/api';
import { Ad, Category, Photo } from '@/types';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const schema = z.object({
  name: z.string().min(3).max(100),
  categoryId: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
  description: z.string().min(10),
  objCondition: z.enum(['new', 'like_new', 'good', 'acceptable', 'for_parts']),
  region: z.string().min(1),
  provincia: z.string().min(1),
  location: z.string().min(1),
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

export default function ModificaAnnuncioPage() {
  const router = useRouter();
  const params = useParams();
  const adId = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const { data: ad } = useQuery({
    queryKey: ['ad', adId],
    queryFn: () => adsApi.getById(adId).then((r) => r.data as Ad),
    enabled: !!adId,
  });

  useEffect(() => {
    if (ad && user && ad.user.id !== user.id) {
      router.replace('/profilo');
    }
  }, [ad, user, router]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then((r) => r.data as Category[]),
  });

  const { data: regioni } = useQuery({
    queryKey: ['regions'],
    queryFn: () => lookupApi.regions().then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (ad) {
      reset({
        name: ad.name,
        categoryId: ad.category.id,
        price: parseFloat(ad.price),
        description: ad.description,
        objCondition: ad.objCondition as any,
        region: ad.region,
        provincia: ad.provincia,
        location: ad.location,
      });
    }
  }, [ad, reset]);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await adsApi.update(adId, data);
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
      router.push(`/annunci/${adId}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Errore durante il salvataggio');
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('photos', f));
      await adsApi.uploadPhotos(adId, formData);
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Errore upload foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await adsApi.deletePhoto(adId, photoId);
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Errore eliminazione foto');
    }
  };

  if (!user || !ad) return null;

  const flatCategories = categories ? flattenCategories(categories) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-8">Modifica annuncio</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5 mb-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="label">Titolo annuncio</label>
          <input {...register('name')} className="input" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Categoria</label>
            <select {...register('categoryId')} className="input">
              <option value="">Seleziona...</option>
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
          <input {...register('price')} type="number" step="0.01" min="0" className="input" />
        </div>

        <div>
          <label className="label">Descrizione</label>
          <textarea {...register('description')} rows={6} className="input resize-none" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Regione</label>
            <select {...register('region')} className="input">
              <option value="">Seleziona...</option>
              {regioni?.map((r: { id: number; nome: string }) => <option key={r.id} value={r.nome}>{r.nome}</option>)}
            </select>
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

      {/* Photo management */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 mb-4 text-base font-semibold">
          <ImageIcon className="w-5 h-5 text-brand" /> Foto annuncio
        </h2>

        {ad.photos && ad.photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {ad.photos.map((photo: Photo) => (
              <div key={photo.id} className="relative group">
                <Image
                  src={photo.url}
                  alt="Foto annuncio"
                  width={120}
                  height={90}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Nessuna foto aggiunta.</p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadingPhoto}
          className="btn-secondary text-sm"
        >
          <Upload className="w-4 h-4" />
          {uploadingPhoto ? 'Caricamento...' : 'Aggiungi foto'}
        </button>
        <p className="text-xs text-gray-400 mt-1">Max 10 foto, 5MB ciascuna. Formati: JPG, PNG, WebP</p>
      </div>
    </div>
  );
}
