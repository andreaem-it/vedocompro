import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">VedoCompro</h3>
            <p className="text-sm">Il marketplace italiano per comprare e vendere in modo semplice e sicuro.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Annunci</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/annunci" className="hover:text-white">Tutti gli annunci</Link></li>
              <li><Link href="/annunci/nuovo" className="hover:text-white">Pubblica annuncio</Link></li>
              <li><Link href="/annunci?sort=recent" className="hover:text-white">Ultimi inseriti</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-white">Accedi</Link></li>
              <li><Link href="/registrati" className="hover:text-white">Registrati</Link></li>
              <li><Link href="/messaggi" className="hover:text-white">Messaggi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Info</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/aiuto" className="hover:text-white">Assistenza</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link href="/termini" className="hover:text-white">Termini di uso</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          © {new Date().getFullYear()} VedoCompro. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}
