import Link from 'next/link';

const FOOTER_COLS = [
  {
    title: 'MOTORI',
    links: ['Auto', 'Moto e Scooter', 'Veicoli commerciali', 'Camper e Caravan', 'Barche e Imbarcazioni', 'Accessori Auto', 'Ricambi Auto', 'Pneumatici'],
  },
  {
    title: 'IMMOBILI',
    links: ['Case in Vendita', 'Case in Affitto', 'Camere e Posti Letto', 'Uffici e Capannoni', 'Ville e Casali', 'Terreni', 'Garage e Box', 'Multiproprietà'],
  },
  {
    title: 'LAVORO E SERVIZI',
    links: ['Offerte di Lavoro', 'Cerco Lavoro', 'Collaborazioni', 'Servizi Professionali'],
  },
  {
    title: 'TECNOLOGIA',
    links: ['Smartphone e Tablet', 'PC e Notebook', 'Console e Videogiochi', 'TV e Hi-Fi', 'Fotografia', 'Elettrodomestici'],
  },
  {
    title: 'PER LA CASA E LA PERSONA',
    links: ['Mobili e Arredamento', 'Cucine', 'Abbigliamento', 'Scarpe', 'Accessori Moda'],
  },
  {
    title: 'SPORT E HOBBY',
    links: ['Palestra e Fitness', 'Calcio', 'Ciclismo', 'Arte e Collezionismo', 'Musica e Film', 'Libri e Riviste', 'Animali'],
  },
];

export default function Footer() {
  return (
    <footer>
      {/* Logo separator */}
      <div
        className="text-center py-8"
        style={{ backgroundColor: '#333333', borderTop: '3px solid #4396C1' }}
      >
        <span className="text-white font-bold text-3xl tracking-tight">
          Vedo<span className="font-light">Compro</span>
        </span>
      </div>

      {/* Categories */}
      <div style={{ backgroundColor: '#333333', paddingBottom: '40px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h4
                  className="font-bold text-sm mb-4 tracking-wide"
                  style={{ color: '#46A3D9' }}
                >
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href={`/annunci?categoria=${link.toLowerCase().replace(/ /g, '-')}`}
                        className="text-xs footer-link"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ backgroundColor: '#282828', padding: '16px 0' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: '#505050' }}>
          <span>© {new Date().getFullYear()} VedoCompro — Tutti i diritti riservati</span>
          <div className="flex gap-4">
            <Link href="/termini" className="hover:text-gray-400 transition-colors">Termini di Servizio</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="/admin" className="hover:text-gray-400 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
