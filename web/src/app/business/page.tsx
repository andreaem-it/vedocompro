import Link from 'next/link';
import { CheckCircle, TrendingUp, BarChart3, Building2, Globe, BadgeCheck, HeadphonesIcon } from 'lucide-react';

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
    name: 'Base',
    price: '9,99',
    color: 'border-gray-300',
    badge: 'bg-gray-100 text-gray-700',
    features: ['Badge Business', 'Logo aziendale', 'Visibilità aumentata', 'Supporto standard'],
  },
  {
    name: 'Pro',
    price: '29,99',
    color: 'border-brand',
    badge: 'bg-brand text-white',
    popular: true,
    features: ['Tutto del piano Base', 'Statistiche avanzate', 'Sito web in profilo', 'Supporto prioritario', 'Annunci illimitati'],
  },
  {
    name: 'Enterprise',
    price: '79,99',
    color: 'border-yellow-400',
    badge: 'bg-yellow-400 text-white',
    features: ['Tutto del piano Pro', 'Account manager dedicato', 'Integrazione API', 'Reportistica mensile', 'SLA garantito'],
  },
];

export default function BusinessPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <BadgeCheck className="w-4 h-4" /> Account Business
        </div>
        <h1 className="text-4xl font-bold mb-4">Passa a Business</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Porta la tua attività al livello successivo con strumenti professionali e maggiore visibilità sulla piattaforma.
        </p>
      </div>

      {/* Features */}
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

      {/* Pricing */}
      <h2 className="text-center mb-8">Scegli il piano più adatto a te</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`card p-6 border-2 ${plan.color} relative`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">Più popolare</span>
              </div>
            )}
            <div className="mb-4">
              <span className={`badge text-xs mb-3 ${plan.badge}`}>{plan.name}</span>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">€{plan.price}</span>
                <span className="text-gray-400 text-sm pb-1">/mese</span>
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/profilo/helpdesk" className={plan.popular ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}>
              Inizia ora
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center text-gray-500 text-sm">
        <p>Per maggiori informazioni o piani personalizzati,{' '}
          <Link href="/profilo/helpdesk" className="text-brand hover:underline">contattaci</Link>.
        </p>
      </div>
    </div>
  );
}
