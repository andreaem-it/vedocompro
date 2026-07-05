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
import CategoryFieldsInput from '@/components/ads/CategoryFieldsInput';
import {
  Trash2,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Tag,
  Euro,
  MapPin,
  Truck,
  type LucideIcon,
} from 'lucide-react';
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

/** Intestazione di sezione: numero, icona e titolo — stessa resa visiva usata in "Pubblica un annuncio". */
function SectionHeader({ step, icon: Icon, title, hint }: { step: number | string; icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand/10 text-brand-dark font-semibold text-sm flex-shrink-0">
        {step}
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Icon className="w-4 h-4 text-brand" /> {title}
        </h2>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [videoError, setVideoError] = useState('');
  const videoRef = useRef<HTMLInputElement>(null);
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [canBeOrdered, setCanBeOrdered] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [categoryFieldValues, setCategoryFieldValues] = useState<Record<string, string>>({});

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

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
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
      setShippingAvailable(ad.shippingAvailable);
      setShippingCost(ad.shippingCost ?? '');
      setShippingNotes(ad.shippingNotes ?? '');
      setCanBeOrdered(ad.canBeOrdered);
      setAvailableQuantity(ad.availableQuantity ?? 1);
      // Ricostruisce i valori dei campi categoria dai fields/vals salvati
      const pairs: Record<string, string> = {};
      (ad.fields ?? []).forEach((key, i) => { pairs[key] = ad.vals?.[i] ?? ''; });
      setCategoryFieldValues(pairs);
    }
  }, [ad, reset]);

  const selectedRegionName = watch('region');
  const selectedProvinciaName = watch('provincia');
  const selectedCategoryId = Number(watch('categoryId')) || 0;

  const selectedRegion = regioni?.find((r: { id: number; nome: string }) => r.nome === selectedRegionName);

  const { data: province } = useQuery({
    queryKey: ['provinces', selectedRegion?.id],
    queryFn: () => lookupApi.provinces(selectedRegion!.id).then((r) => r.data),
    enabled: !!selectedRegion,
  });

  const selectedProvincia = province?.find((p: { id: number; nome: string }) => p.nome === selectedProvinciaName);

  const { data: comuni } = useQuery({
    queryKey: ['comuni', selectedProvincia?.id],
    queryFn: () => lookupApi.comuni(selectedProvincia!.id).then((r) => r.data),
    enabled: !!selectedProvincia,
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const payload: Record<string, unknown> = {
        ...data,
        shippingAvailable,
        canBeOrdered,
        availableQuantity: user?.isCompany ? availableQuantity : 1,
      };
      // Campi categoria: l'API valida contro la config e rigenera fieldPairs
      const fieldEntries = Object.entries(categoryFieldValues).filter(([, v]) => v.trim() !== '');
      payload.fields = fieldEntries.map(([k]) => k);
      payload.vals = fieldEntries.map(([, v]) => v);
      if (shippingAvailable) {
        payload.shippingCost = shippingCost || null;
        payload.shippingNotes = shippingNotes || null;
      } else {
        payload.shippingCost = null;
        payload.shippingNotes = null;
      }
      await adsApi.update(adId, payload);
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

  const handleUploadVideo = async (file: File) => {
    setUploadingVideo(true);
    setVideoError('');
    try {
      const formData = new FormData();
      formData.append('video', file);
      await adsApi.uploadVideo(adId, formData);
      setVideoUploaded(true);
    } catch (err: any) {
      setVideoError(err.response?.data?.error ?? 'Errore upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  if (!user || !ad) return null;

  const flatCategories = categories ? flattenCategories(categories) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-2">Modifica annuncio</h1>
      <p className="text-gray-600 mb-6">Aggiorna i dati dell&apos;inserzione, poi gestisci foto e video qui sotto.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* 1. Categoria e titolo */}
        <div className="card p-6 space-y-4">
          <SectionHeader step={1} icon={Tag} title="Categoria e titolo" />

          <div>
            <label className="label">Titolo annuncio</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea {...register('description')} rows={6} className="input resize-none" />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Categoria</label>
            <select {...register('categoryId')} className="input">
              <option value="">Seleziona...</option>
              {flatCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <CategoryFieldsInput
            categoryId={selectedCategoryId || undefined}
            values={categoryFieldValues}
            onChange={(name, value) => setCategoryFieldValues((prev) => ({ ...prev, [name]: value }))}
          />
        </div>

        {/* 2. Prezzo e condizione */}
        <div className="card p-6 space-y-4">
          <SectionHeader step={2} icon={Euro} title="Prezzo e condizione" />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Prezzo (€)</label>
              <input {...register('price')} type="number" step="0.01" min="0" className="input" />
            </div>
            <div>
              <label className="label">Condizione</label>
              <select {...register('objCondition')} className="input">
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Posizione */}
        <div className="card p-6 space-y-4">
          <SectionHeader step={3} icon={MapPin} title="Posizione" />

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Regione</label>
              <select
                {...register('region')}
                className="input"
                value={selectedRegionName ?? ''}
                onChange={(e) => {
                  setValue('region', e.target.value);
                  setValue('provincia', '');
                  setValue('location', '');
                }}
              >
                <option value="">Seleziona...</option>
                {regioni?.map((r: { id: number; nome: string }) => <option key={r.id} value={r.nome}>{r.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Provincia</label>
              <select
                {...register('provincia')}
                className="input"
                value={selectedProvinciaName ?? ''}
                disabled={!selectedRegion}
                onChange={(e) => {
                  setValue('provincia', e.target.value);
                  setValue('location', '');
                }}
              >
                <option value="">{selectedRegion ? 'Seleziona...' : 'Scegli prima la regione'}</option>
                {province?.map((p: { id: number; nome: string }) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Città</label>
              <input
                {...register('location')}
                className="input"
                list="comuni-datalist-edit"
                disabled={!selectedProvincia}
                autoComplete="off"
              />
              <datalist id="comuni-datalist-edit">
                {comuni?.map((c: { id: number; comune: string }) => <option key={c.id} value={c.comune} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* 4. Spedizione e vendita */}
        <div className="card p-6 space-y-3">
          <SectionHeader step={4} icon={Truck} title="Spedizione e vendita" />

          {user.isCompany ? (
            <div className="max-w-xs">
              <label className="label">Pezzi disponibili</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="input"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Annuncio privato a pezzo unico: dopo l&apos;acquisto sarà segnato come venduto.
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={canBeOrdered} onChange={(e) => setCanBeOrdered(e.target.checked)} />
            Abilita Compralo subito dalla pagina annuncio
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shippingAvailable} onChange={(e) => setShippingAvailable(e.target.checked)} />
            Disponibile per la spedizione
          </label>
          {shippingAvailable && (
            <div className="grid sm:grid-cols-2 gap-4 pl-1">
              <div>
                <label className="label">Costo spedizione (€, opzionale)</label>
                <input
                  type="number" step="0.01" min="0" placeholder="Da concordare"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Note spedizione (opzionale)</label>
                <input
                  type="text" placeholder="es. Solo corriere, no contrassegno"
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Annulla</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>

      {/* Photo management */}
      <div className="card p-6">
        <SectionHeader step={5} icon={ImageIcon} title="Foto annuncio" />

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

      {/* Video management */}
      <div className="card p-6 mt-6">
        <SectionHeader step={6} icon={VideoIcon} title="Video annuncio" />

        {ad.videos && ad.videos.length > 0 ? (
          <div className="mb-4 space-y-2">
            {ad.videos.map((v) => (
              <video key={v.id} src={v.filename} controls className="w-full max-w-md rounded-lg" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-1">Nessun video approvato (ne puoi avere al massimo uno in attesa di moderazione).</p>
        )}

        <p className="text-xs text-gray-500 mb-4">
          Dopo il caricamento il video viene elaborato automaticamente e deve essere approvato da un moderatore prima di apparire sull&apos;annuncio (può richiedere qualche ora). Formati: MP4, MOV, AVI, WebM — max 200MB.
        </p>

        {videoError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{videoError}</div>}
        {videoUploaded && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            Video caricato! È in fase di elaborazione e sarà visibile dopo l&apos;approvazione di un moderatore.
          </div>
        )}

        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadVideo(file);
          }}
        />
        <button
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="btn-secondary text-sm"
        >
          <Upload className="w-4 h-4" />
          {uploadingVideo ? 'Caricamento...' : 'Carica video'}
        </button>
      </div>
    </div>
  );
}
