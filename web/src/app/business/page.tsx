'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, TrendingUp, BarChart3, Building2, Globe, BadgeCheck, HeadphonesIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { businessApi } from '@/lib/api';
import { BusinessRequest } from '@/types';

const FEATURES = [
  { icon: TrendingUp, title: 'Visibilità aumentata', desc: 'I tuoi annunci appaiono in cima ai risultati di ricerca.' },
  { icon: BarChart3, title: 'Statistiche avanzate', desc: 'Monitora visualizzazioni, click e performance dei tuoi annunci.' },
  { icon: Building2, title: 'Logo aziendale', desc: 'Mostra il logo della tua azienda in ogni annuncio e nel profilo.' },
  { icon: Globe, title: 'Sito web nel profilo', desc: 'Link diretto al tuo sito web dalla tua pagina profilo.' },
  { icon: BadgeCheck, title: 'Badge Business', desc: 'Certificazione visibile che aumenta la fiducia degli acquirenti.' },
  { icon: HeadphonesIcon, title: 'Supporto prioritario', desc: 'Assistenza dedicata con tempi di risposta garantiti.' },
];

const PLANS = [
  {
    id: 1,
    name: 'Mensile',
    tag: 'Scelta Economica',
    price: '19,99',
    period: '/mese',
    color: 'border-gray-300',
    badge: 'bg-gray-100 text-gray-700',
    features: ['Annunci illimitati', 'Il tuo logo negli annunci', 'Badge utente verificato', 'Box con informazioni azienda', 'Assistenza telefonica'],
  },
  {
    id: 2,
    name: 'Annuale',
    tag: 'Scelta Migliore',
    price: '199,99',
    period: '/anno',
    color: 'border-brand',
    badge: 'bg-brand text-white',
    popular: true,
    features: ['Annunci illimitati', 'Il tuo logo negli annunci', 'Badge utente verificato', 'Box con informazioni azienda', 'Assistenza telefonica', 'Statistiche analitiche'],
  },
];

const STATUS_LABEL: Record<number, string> = {
  0: 'In attesa di verifica',
  1: 'Approvata',
  2: 'Non approvata',
};

export default function BusinessPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState(2);
  const [form, setForm] = useState({
    legalName: '',
    vatNumber: '',
    contactName: user?.name ?? '',
    contactSurname: '',
    contactPhone: user?.phone && user.phone !== '-' ? user.phone : '',
    contactEmail: user?.email ?? '',
    opt1: false,
    opt2: false,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.isCompany) router.replace('/business/dashboard');
  }, [router, user?.isCompany]);

  const { data } = useQuery({
    queryKey: ['business-me', user?.id],
    queryFn: () => businessApi.getMe().then((r) => r.data as { latestRequest: BusinessRequest | null }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => businessApi.createRequest({ package: selectedPackage, ...form }),
    onSuccess: async () => {
      setMessage('Richiesta inviata. Il team verificherà i dati e attiverà il pacchetto dopo l’approvazione.');
      await queryClient.invalidateQueries({ queryKey: ['business-me'] });
      await refresh();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setMessage(err.response?.data?.error ?? 'Non è stato possibile inviare la richiesta.');
    },
  });

  const latestRequest = data?.latestRequest;

  if (user?.isCompany) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <BadgeCheck className="w-4 h-4" /> Account Business
        </div>
        <h1 className="text-4xl font-bold mb-4">Scopri i vantaggi del pacchetto Business di VedoCompro</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Più visibilità, badge aziendale, informazioni professionali e statistiche per monitorare le performance dei tuoi annunci.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-5">
            <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-brand" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      {user?.isCompany ? (
        <div className="card p-6 mb-10 border-l-4 border-l-brand flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Il tuo account Business è attivo</h2>
            <p className="text-sm text-gray-500">
              Scadenza: {user.businessEnd ? new Date(user.businessEnd).toLocaleDateString('it-IT') : 'non impostata'}
            </p>
          </div>
          <Link href="/business/dashboard" className="btn-primary">Apri dashboard</Link>
        </div>
      ) : latestRequest ? (
        <div className="card p-6 mb-10 border-l-4 border-l-brand">
          <h2 className="text-lg font-semibold mb-1">Richiesta Business già inviata</h2>
          <p className="text-sm text-gray-500">
            Stato: <span className="font-medium text-gray-800">{STATUS_LABEL[latestRequest.status] ?? 'Sconosciuto'}</span>
          </p>
          {latestRequest.adminNotes && <p className="text-sm text-gray-500 mt-2">{latestRequest.adminNotes}</p>}
        </div>
      ) : null}

      <h2 className="text-center mb-8">Scegli il pacchetto più adatto a te</h2>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
        {PLANS.map((plan) => (
          <button
            type="button"
            key={plan.name}
            onClick={() => setSelectedPackage(plan.id)}
            className={`card p-6 border-2 ${selectedPackage === plan.id ? 'border-brand ring-2 ring-brand/20' : plan.color} relative text-left transition-shadow hover:shadow-md`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">Più popolare</span>
              </div>
            )}
            <div className="mb-4 text-center">
              <span className={`badge text-xs mb-3 ${plan.badge}`}>{plan.tag}</span>
              <div className="flex items-end justify-center gap-1">
                <span className="text-3xl font-bold">€{plan.price}</span>
                <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Pagamento {plan.name.toLowerCase()}</p>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!user) return;
          setMessage('');
          createMutation.mutate();
        }}
        className="card p-6 max-w-3xl mx-auto space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold">Dati per la verifica aziendale</h2>
          <p className="text-sm text-gray-500">La richiesta viene controllata manualmente prima dell’attivazione.</p>
        </div>

        {!user && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            Accedi o registrati per richiedere l’attivazione Business.
          </div>
        )}
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm border ${message.includes('inviata') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ragione sociale</label>
            <input required value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Partita IVA</label>
            <input required value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Nome contatto</label>
            <input required value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Cognome contatto</label>
            <input required value={form.contactSurname} onChange={(e) => setForm((f) => ({ ...f, contactSurname: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Telefono contatto</label>
            <input required value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Email contatto</label>
            <input required type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className="input" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.opt1} onChange={(e) => setForm((f) => ({ ...f, opt1: e.target.checked }))} />
            Montaggio Video (+10,00 €/mese)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.opt2} onChange={(e) => setForm((f) => ({ ...f, opt2: e.target.checked }))} />
            Riprese con Drone (+20,00 €/mese)
          </label>
        </div>

        <div className="flex justify-end">
          {user ? (
            <button type="submit" disabled={createMutation.isPending || !!latestRequest || !!user.isCompany} className="btn-primary">
              {createMutation.isPending ? 'Invio...' : 'Invia richiesta Business'}
            </button>
          ) : (
            <Link href="/login" className="btn-primary">Accedi per continuare</Link>
          )}
        </div>
      </form>
    </div>
  );
}
