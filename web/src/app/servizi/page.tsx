import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, CheckCircle2, Clapperboard, SearchCheck, UsersRound } from 'lucide-react';

const SERVICES = [
  {
    title: 'Realizzazione Video per l’immobile',
    items: ['Video con drone esterni', 'Video HD professionale', 'Montaggio con logo agenzia', 'Video VR 360 su richiesta', 'Badge VedoCompro'],
  },
  {
    title: 'Realizzazione Video Auto/Moto',
    items: ['Video HD professionale', 'Prova su strada', 'Audio professionale', 'Montaggio con logo concessionaria', 'Badge VedoCompro'],
  },
];

const VALUES = [
  { icon: Clapperboard, title: 'Qualità', body: 'I video mettono in evidenza pregi, dettagli e condizioni reali del prodotto.' },
  { icon: UsersRound, title: 'Professionalità', body: 'Descrizione e ripresa vengono curate con attenzione, senza lasciare l’annuncio al caso.' },
  { icon: SearchCheck, title: 'Efficienza', body: 'Le inserzioni curate sono più chiare, più credibili e più facili da trovare.' },
];

export default function ServiziPage() {
  return (
    <div>
      <section className="bg-brand-dark text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-bold mb-3">Un video accattivante vende di più</h1>
          <p className="text-white/75 max-w-2xl">Servizi dedicati a chi vuole creare inserzioni curate, funzionali e più convincenti.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">I nostri servizi</h2>
          <p className="text-gray-600 max-w-3xl">
            Pensiamo a ripresa, montaggio, descrizione e pubblicazione dell’inserzione. Un annuncio prodotto da VedoCompro può ottenere il badge di verifica, aumentando fiducia e chiarezza.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {SERVICES.map((service) => (
            <div key={service.title} className="card p-6">
              <h3 className="text-lg font-semibold text-brand mb-4">{service.title}</h3>
              <ul className="space-y-2">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-brand text-white p-6">
              <Icon className="w-7 h-7 mb-3 text-white/80" />
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-white/80">{body}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Perché scegliere VedoCompro Servizi</h2>
            <div className="space-y-3 text-gray-600">
              <p>Vendere online richiede annunci chiari, immagini credibili e descrizioni utili. Un video ben realizzato riduce dubbi e aumenta la fiducia.</p>
              <p>Possiamo aiutarti a filmare il prodotto, scrivere una descrizione efficace, concordare un prezzo e pubblicare l’annuncio.</p>
            </div>
            <Link href="/profilo/helpdesk" className="btn-primary mt-6">
              <BadgeCheck className="w-4 h-4" /> Contattaci
            </Link>
          </div>
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            <Image src="/vc-team.png" alt="Team VedoCompro" fill className="object-contain p-6" />
          </div>
        </div>
      </section>
    </div>
  );
}
