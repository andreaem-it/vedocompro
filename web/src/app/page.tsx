import Link from 'next/link';
import { Search } from 'lucide-react';

const CATEGORIES = [
  { name: 'Motori',                slug: 'motori',      bg: 'linear-gradient(135deg,#1a3a5c,#2a6496)' },
  { name: 'Tecnologia',            slug: 'tecnologia',  bg: 'linear-gradient(135deg,#1a3a4a,#2a7ab0)' },
  { name: 'Arredamento',           slug: 'arredamento', bg: 'linear-gradient(135deg,#3a2a1a,#8B6914)' },
  { name: 'Abbigliamento',         slug: 'abbigliamento', bg: 'linear-gradient(135deg,#2a1a3a,#7a3a8a)' },
  { name: 'Immobili',              slug: 'immobili',    bg: 'linear-gradient(135deg,#1a3a2a,#2a8a4a)' },
  { name: 'Sport e Hobby',         slug: 'sport',       bg: 'linear-gradient(135deg,#3a1a1a,#8a2a2a)' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative text-white"
        style={{
          background: 'linear-gradient(135deg, #2c5f8a 0%, #46A3D9 50%, #4396C1 100%)',
          minHeight: '420px',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-light mb-3 drop-shadow-lg" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
            Cosa stai cercando?
          </h1>
          <p className="text-xl font-light mb-10 text-white/90">
            Il marketplace italiano per comprare e vendere in sicurezza
          </p>
          <div className="bg-white rounded-xl p-4 max-w-2xl mx-auto shadow-2xl">
            <form className="flex gap-3" action="/annunci" method="get">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  name="q"
                  placeholder="Cerca qualsiasi cosa..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand text-gray-900 text-lg"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 text-white font-bold rounded-lg text-lg transition-colors"
                style={{ backgroundColor: '#46A3D9' }}
              >
                Cerca
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-2 text-gray-800">Categorie</h2>
          <p className="text-center text-gray-500 mb-10">Vendi e acquista nelle nostre categorie</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/annunci?categoria=${cat.slug}`}>
                <div className="cat-card" style={{ background: cat.bg }}>
                  <div className="cat-card-overlay">
                    <span className="drop-shadow-lg tracking-wide uppercase text-lg">{cat.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-white text-center" style={{ backgroundColor: '#46A3D9' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-light mb-4">La nuova piattaforma per fare affari sicuri!</h2>
          <p className="text-white/90 mb-8 text-lg font-light">
            Migliaia di annunci aggiornati ogni giorno su tutto il territorio italiano.
          </p>
          <Link
            href="/registrati"
            className="inline-block bg-white font-bold px-10 py-3 rounded-lg text-lg transition-all hover:bg-gray-100"
            style={{ color: '#46A3D9' }}
          >
            Inizia ora!
          </Link>
        </div>
      </section>
    </div>
  );
}
