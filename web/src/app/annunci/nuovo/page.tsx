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
import CategoryFieldsInput from '@/components/ads/CategoryFieldsInput';
import {
  Tag,
  Euro,
  MapPin,
  Truck,
  Briefcase,
  Image as ImageIcon,
  Video as VideoIcon,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

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

const WIZARD_STEPS = ['Categoria e titolo', 'Prezzo e condizione', 'Posizione', 'Spedizione', 'Foto e video'];

// Campi react-hook-form da validare prima di lasciare ciascuno step
const STEP_FIELDS: (keyof FormData)[][] = [
  ['name', 'description', 'categoryId'],
  ['price', 'objCondition'],
  ['region', 'provincia', 'location'],
  [], // spedizione/vendita: tutte opzioni facoltative
];

/** Barra di avanzamento a segmenti, eco del wizard multi-step del template legacy.
 *  Gli step già completati sono cliccabili per tornare indietro. */
function ProgressBar({ currentStep, onStepClick }: { currentStep: number; onStepClick?: (step: number) => void }) {
  return (
    <div className="mb-8">
      <div className="flex gap-2">
        {WIZARD_STEPS.map((label, i) => {
          const clickable = onStepClick && i < currentStep;
          return (
            <button
              key={label}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i)}
              className={`flex-1 text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              title={clickable ? `Torna a: ${label}` : undefined}
            >
              <div className={`h-1.5 rounded-full ${i <= currentStep ? 'bg-brand' : 'bg-gray-200'}`} />
              <p className={`mt-1.5 text-xs font-medium hidden sm:block ${i <= currentStep ? 'text-brand-dark' : 'text-gray-400'} ${clickable ? 'hover:underline' : ''}`}>
                {i + 1}. {label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Intestazione di sezione del form: numero, icona e titolo — replica visivamente gli step del wizard legacy. */
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

export default function NuovoAnnuncioPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState('');
  // Step corrente del wizard (0-3); lo step 4 "Foto e video" è la schermata post-creazione
  const [step, setStep] = useState(0);
  const [createdAdId, setCreatedAdId] = useState<number | null>(null);
  const [createdAdPublished, setCreatedAdPublished] = useState(0);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [videoError, setVideoError] = useState('');

  // Solo per account Business (replica AdsBusinessType vs AdsUserType del legacy)
  const isBusiness = !!user?.isCompany;
  const [publishNow, setPublishNow] = useState(false);
  const [canBeOrdered, setCanBeOrdered] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  // Spedizione: feature nuova, disponibile per tutti i venditori (non solo Business)
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');

  // Campi categoria-specifici configurati da admin, per tutti i venditori
  const [categoryFieldValues, setCategoryFieldValues] = useState<Record<string, string>>({});

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

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const LAST_STEP = STEP_FIELDS.length - 1;

  const handleNext = async () => {
    // Valida solo i campi dello step corrente prima di avanzare
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, LAST_STEP));
  };

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
      const payload: Record<string, unknown> = { ...data };
      payload.shippingAvailable = shippingAvailable;
      if (shippingAvailable) {
        if (shippingCost) payload.shippingCost = shippingCost;
        if (shippingNotes) payload.shippingNotes = shippingNotes;
      }
      payload.canBeOrdered = canBeOrdered;
      payload.availableQuantity = isBusiness ? availableQuantity : 1;

      // Campi categoria (per tutti) + custom liberi (solo business)
      const fieldEntries = Object.entries(categoryFieldValues).filter(([, v]) => v.trim() !== '');
      const fields = fieldEntries.map(([k]) => k);
      const vals = fieldEntries.map(([, v]) => v);
      if (isBusiness) {
        payload.published = publishNow ? 1 : 0;
        const filled = customFields.filter((f) => f.key.trim() !== '');
        fields.push(...filled.map((f) => f.key));
        vals.push(...filled.map((f) => f.value));
      }
      payload.fields = fields;
      payload.vals = vals;
      const res = await adsApi.create(payload);
      setCreatedAdId(res.data.id);
      setCreatedAdPublished(res.data.published);
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

  const handleUploadVideo = async () => {
    if (!videoFile || !createdAdId) return;
    setUploadingVideo(true);
    setVideoError('');
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      await adsApi.uploadVideo(createdAdId, formData);
      setVideoUploaded(true);
      setVideoFile(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setVideoError(e.response?.data?.error ?? 'Errore durante il caricamento del video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  if (!user) return null;

  if (createdAdId !== null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="mb-2">Pubblica un annuncio</h1>
        <p className="text-gray-600 mb-6">Ultimo passo: aggiungi foto e video per attirare più compratori.</p>

        <ProgressBar currentStep={4} />

        <div className="mb-6 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {createdAdPublished === 1
              ? 'Annuncio pubblicato con successo!'
              : 'Annuncio creato! Sarà visibile non appena un moderatore lo approverà.'}
          </span>
        </div>

        <div className="card p-6">
          <SectionHeader step={5} icon={ImageIcon} title="Foto" hint="Aggiungi delle foto per rendere il tuo annuncio più attraente." />

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

        </div>

        <div className="card p-6 mt-6">
          <SectionHeader
            step={6}
            icon={VideoIcon}
            title="Video (opzionale)"
            hint="Un video aiuta i compratori a vedere l'oggetto da più angolazioni e aumenta le possibilità di vendita."
          />
          <ul className="text-xs text-gray-500 list-disc pl-4 mb-4 space-y-0.5">
            <li>Formati supportati: MP4, MOV, AVI, WebM — massimo 200MB.</li>
            <li>Dopo il caricamento il video viene elaborato automaticamente (convertito e compresso) dal sistema.</li>
            <li>Come le foto, il video deve essere approvato da un moderatore prima di essere visibile sull&apos;annuncio: questo può richiedere qualche ora.</li>
          </ul>

          {videoError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{videoError}</div>}

          {videoUploaded ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Video caricato! È in fase di elaborazione e sarà visibile sull&apos;annuncio dopo l&apos;approvazione di un moderatore.
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="label">Seleziona un video</label>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  className="input text-sm"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <button
                onClick={handleUploadVideo}
                disabled={uploadingVideo || !videoFile}
                className="btn-primary"
              >
                {uploadingVideo ? 'Caricamento...' : 'Carica video'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => router.push(`/annunci/${createdAdId}`)} className="btn-primary">
            Vai all&apos;annuncio
          </button>
        </div>
      </div>
    );
  }

  const flatCategories = categories ? flattenCategories(categories) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-2">Pubblica un annuncio</h1>
      <p className="text-gray-600 mb-6">Compila i campi sottostanti per pubblicare il tuo annuncio gratuitamente.</p>

      <ProgressBar currentStep={step} onStepClick={setStep} />

      <form
        onSubmit={step === LAST_STEP ? handleSubmit(onSubmit) : (e) => { e.preventDefault(); handleNext(); }}
        className="space-y-6"
      >
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* 1. Descrizione: titolo, descrizione, categoria */}
        <div className={`card p-6 space-y-4 ${step === 0 ? '' : 'hidden'}`}>
          <SectionHeader
            step={1}
            icon={Tag}
            title="Categoria e titolo"
            hint="Scegli un titolo preciso e la categoria giusta: gli utenti potrebbero non trovare l'inserzione se la categoria è sbagliata."
          />

          <div>
            <label className="label">Titolo annuncio</label>
            <input {...register('name')} className="input" placeholder="es. iPhone 13 Pro 256GB" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea {...register('description')} rows={6} className="input resize-none" placeholder="Descrivi il tuo prodotto, pregi e difetti, caratteristiche tecniche..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Categoria</label>
            <select {...register('categoryId')} className="input">
              <option value="">Seleziona...</option>
              {flatCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>

          <CategoryFieldsInput
            categoryId={selectedCategoryId || undefined}
            values={categoryFieldValues}
            onChange={(name, value) => setCategoryFieldValues((prev) => ({ ...prev, [name]: value }))}
          />
        </div>

        {/* 2. Prezzo e ubicazione */}
        <div className={`card p-6 space-y-4 ${step === 1 ? '' : 'hidden'}`}>
          <SectionHeader
            step={2}
            icon={Euro}
            title="Prezzo e condizione"
            hint="Dai un prezzo realistico all'oggetto e specificane la condizione: evita di vendere come nuovo un oggetto usato."
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Prezzo (€)</label>
              <input {...register('price')} type="number" step="0.01" min="0" className="input" placeholder="0.00" />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
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
        </div>

        {/* 3. Posizione */}
        <div className={`card p-6 space-y-4 ${step === 2 ? '' : 'hidden'}`}>
          <SectionHeader
            step={3}
            icon={MapPin}
            title="Posizione"
            hint="Indica dove si trova l'oggetto: una posizione indicativa è sufficiente, eviterai di fornire troppi dati."
          />

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
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
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
              {errors.provincia && <p className="text-red-500 text-xs mt-1">{errors.provincia.message}</p>}
            </div>
            <div>
              <label className="label">Città</label>
              <input
                {...register('location')}
                className="input"
                list="comuni-datalist"
                placeholder={selectedProvincia ? 'es. Milano' : 'Scegli prima la provincia'}
                disabled={!selectedProvincia}
                autoComplete="off"
              />
              <datalist id="comuni-datalist">
                {comuni?.map((c: { id: number; comune: string }) => <option key={c.id} value={c.comune} />)}
              </datalist>
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
            </div>
          </div>
        </div>

        {/* 4. Spedizione e vendita */}
        <div className={`card p-6 space-y-3 ${step === 3 ? '' : 'hidden'}`}>
          <SectionHeader step={4} icon={Truck} title="Spedizione e vendita" hint="Funzioni disponibili per tutti i venditori." />

          {isBusiness ? (
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
              Gli annunci non Business sono pezzi unici: dopo l&apos;acquisto verranno segnati come venduti.
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

        {/* Opzioni Business (condizionale, mostrate nell'ultimo step) */}
        {isBusiness && (
          <div className={`card p-6 space-y-4 ${step === 3 ? '' : 'hidden'}`}>
            <SectionHeader step="+" icon={Briefcase} title="Opzioni Business" hint="Disponibili solo per account aziendali." />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              Pubblica immediatamente (salta la moderazione)
            </label>

            <div>
              <label className="label">Campi personalizzati</label>
              {customFields.map((f, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="input"
                    placeholder="Nome campo (es. Marca)"
                    value={f.key}
                    onChange={(e) => setCustomFields((prev) => prev.map((p, idx) => (idx === i ? { ...p, key: e.target.value } : p)))}
                  />
                  <input
                    className="input"
                    placeholder="Valore (es. Bosch)"
                    value={f.value}
                    onChange={(e) => setCustomFields((prev) => prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p)))}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomFields((prev) => prev.filter((_, idx) => idx !== i))}
                    className="btn-secondary px-3"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomFields((prev) => [...prev, { key: '', value: '' }])}
                className="btn-secondary text-sm"
              >
                + Aggiungi campo
              </button>
            </div>
          </div>
        )}

        {step === LAST_STEP && (
          <p className="text-xs text-gray-500 text-center">
            Dopo aver pubblicato potrai aggiungere foto e video nel passo successivo. L&apos;annuncio sarà visibile non appena un moderatore lo avrà approvato.
          </p>
        )}

        <div className="flex justify-between gap-3">
          {step === 0 ? (
            <button type="button" onClick={() => router.back()} className="btn-secondary">Annulla</button>
          ) : (
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="btn-secondary">
              ← Indietro
            </button>
          )}
          {step < LAST_STEP ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              Avanti →
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Pubblicazione...' : 'Pubblica annuncio'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
