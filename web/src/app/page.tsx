import Link from 'next/link';
import { ArrowRight, ClipboardList, MapPin, PackagePlus, Search, Shield, ShoppingBag, Tag, Users } from 'lucide-react';
import CategoryTiles from '@/components/home/CategoryTiles';
import FeaturedAdsSection from '@/components/home/FeaturedAdsSection';

const POPULAR_SEARCHES = [
  { label: 'Smartphone', href: '/annunci?q=smartphone' },
  { label: 'Auto usate', href: '/annunci?q=auto' },
  { label: 'Arredamento', href: '/annunci?q=arredamento' },
  { label: 'Biciclette', href: '/annunci?q=bicicletta' },
  { label: 'Case in affitto', href: '/annunci?q=affitto' },
  { label: 'Lavoro e servizi', href: '/annunci?q=servizi' },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-brand-dark text-white px-4 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-white">
              Cosa vuoi comprare o vendere oggi?
            </h1>
            <p className="text-lg text-white/85 mb-8">
              Annunci locali, offerte, acquisto diretto e venditori Business in un unico marketplace.
            </p>
          </div>

          <form action="/annunci" className="mb-5 flex flex-col gap-3 rounded-lg bg-white p-2 shadow-lg sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                type="search"
                placeholder="Cerca smartphone, bici, casa, lavoro..."
                className="h-12 w-full rounded-md border-0 pl-10 pr-3 text-gray-900 outline-none"
              />
            </div>
            <button type="submit" className="btn-primary h-12 justify-center px-6">
              Cerca
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <Link href="/annunci/nuovo" className="btn-secondary bg-white text-brand-dark border-white hover:bg-white/90">
              <PackagePlus className="w-4 h-4" /> Pubblica gratis
            </Link>
            <Link href="/profilo/acquisti-vendite" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
              <ClipboardList className="w-4 h-4" /> Acquisti e vendite
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b bg-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1 text-sm font-medium text-gray-600">
            <Tag className="w-4 h-4" /> Ricerche rapide
          </span>
          {POPULAR_SEARCHES.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <FeaturedAdsSection />

      <section className="border-b bg-white px-4 py-5">
        <div className="max-w-7xl mx-auto grid gap-3 sm:grid-cols-3">
          <Link href="/annunci" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-brand hover:bg-brand/5">
            <ShoppingBag className="h-5 w-5 text-brand" />
            <div>
              <p className="font-semibold">Compra</p>
              <p className="text-sm text-gray-500">Filtra per zona, prezzo e categoria.</p>
            </div>
          </Link>
          <Link href="/annunci/nuovo" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-brand hover:bg-brand/5">
            <PackagePlus className="h-5 w-5 text-brand" />
            <div>
              <p className="font-semibold">Vendi</p>
              <p className="text-sm text-gray-500">Privati a pezzo unico, Business con stock.</p>
            </div>
          </Link>
          <Link href="/linee-guida" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-brand hover:bg-brand/5">
            <Shield className="h-5 w-5 text-brand" />
            <div>
              <p className="font-semibold">Fidati meglio</p>
              <p className="text-sm text-gray-500">Feedback, profili verificati e dispute.</p>
            </div>
          </Link>
        </div>
      </section>

      <CategoryTiles />

      <section className="bg-gray-50 px-4 py-10">
        <div className="max-w-7xl mx-auto grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand" />
              <h2 className="text-xl font-semibold">Compra vicino a te</h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Parti dalla tua zona, restringi per provincia o comune e ordina per distanza quando abiliti la posizione.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/annunci?sort=recent" className="btn-secondary text-sm">Ultimi annunci</Link>
              <Link href="/annunci?sort=price_asc" className="btn-secondary text-sm">Prezzi bassi</Link>
              <Link href="/annunci?sort=views" className="btn-secondary text-sm">Piu visti</Link>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-2 text-xl font-semibold">Vendi in pochi passi</h2>
            <p className="mb-4 text-sm text-gray-600">
              Il wizard ti guida nella pubblicazione. I privati vendono pezzi unici, i Business gestiscono stock e scheda aziendale.
            </p>
            <Link href="/annunci/nuovo" className="btn-primary">
              Pubblica ora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-8">Come si conclude un affare</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Search, title: 'Cerca o salva la ricerca', desc: 'Usa filtri locali e ricevi avvisi quando arrivano nuovi annunci.' },
              { icon: Shield, title: 'Valuta venditore e oggetto', desc: 'Controlla profilo, feedback, disponibilita e condizioni prima di procedere.' },
              { icon: Users, title: 'Concludi in piattaforma', desc: 'Offerte, ordini, messaggi e dispute restano nello stesso posto.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-gray-200 p-5">
                <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="mb-2 text-base">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand text-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h2 className="text-white">Hai qualcosa da vendere?</h2>
            <p className="text-white/80 text-sm mt-1">Il wizard ti guida passo passo: categoria, prezzo, posizione e vendita.</p>
          </div>
          <Link href="/annunci/nuovo" className="btn-secondary text-lg py-3 px-8 bg-white text-brand-dark border-white hover:bg-white/90 whitespace-nowrap">
            Pubblica un annuncio
          </Link>
        </div>
      </section>
    </div>
  );
}
