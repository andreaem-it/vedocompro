import Link from 'next/link';
import { Search, Shield, Zap, Users } from 'lucide-react';
import CategoryTiles from '@/components/home/CategoryTiles';

export default function HomePage() {
  return (
    <div>
      {/* Hero — replica il jumbotron a sfondo blu pieno con tagline "Cosa stai cercando?" del legacy */}
      <section className="bg-gradient-to-br from-brand to-brand-dark text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Compra e vendi <span className="text-white">facilmente</span>
          </h1>
          <p className="text-xl text-white/85 mb-8">
            Il marketplace italiano con migliaia di annunci in tutte le categorie.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <Link href="/annunci" className="btn-primary text-lg py-3 px-6 flex-1 justify-center">
              <Search className="w-5 h-5" />
              Cerca annunci
            </Link>
            <Link href="/annunci/nuovo" className="btn-secondary text-lg py-3 px-6 flex-1 justify-center bg-white/10 border-white/30 hover:bg-white/20 text-white">
              Pubblica gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Categorie — replica la sezione "Categorie" del legacy con le 6 categorie padre reali */}
      <CategoryTiles />

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-12">Perché scegliere VedoCompro?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Veloce e semplice', desc: 'Pubblica un annuncio in meno di 2 minuti. Senza complicazioni.' },
              { icon: Shield, title: 'Sicuro e affidabile', desc: 'Sistema di feedback e verifica utenti per transazioni in sicurezza.' },
              { icon: Users, title: 'Comunità italiana', desc: 'Compra e vendi con persone vicino a te su tutto il territorio nazionale.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / CTA finale — replica la sezione "La nuova piattaforma per fare affari sicuri!" del legacy */}
      <section className="bg-brand text-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <h2 className="text-white">La nuova piattaforma per fare affari sicuri!</h2>
          <Link href="/annunci/nuovo" className="btn-secondary text-lg py-3 px-8 bg-white text-brand-dark border-white hover:bg-white/90 whitespace-nowrap">
            Inizia ora!
          </Link>
        </div>
      </section>
    </div>
  );
}
