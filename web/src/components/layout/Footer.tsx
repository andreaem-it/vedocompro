'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/lib/api';
import { Category } from '@/types';
import { shopEnabled } from '@/config/features';

export default function Footer() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then((r) => r.data as Category[]),
  });

  return (
    <footer className="bg-brand-dark text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <Image src="/logo-white.png" alt="VedoCompro.it" width={160} height={30} className="h-7 w-auto mb-8" />

        {/* Mega-menu categorie, come il footer legacy (vedi template/footer.html.twig) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          {categories?.map((cat) => (
            <div key={cat.id}>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wide mb-3">{cat.name}</h4>
              <ul className="space-y-1.5 text-sm">
                {cat.children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/annunci?category=${child.id}`} className="hover:text-white transition-colors">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-8">
          <div>
            <h4 className="text-white font-medium mb-3">VedoCompro</h4>
            <p className="text-sm">Il marketplace italiano per comprare e vendere in modo semplice e sicuro.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Annunci</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/annunci" className="hover:text-white">Tutti gli annunci</Link></li>
              <li><Link href="/annunci/nuovo" className="hover:text-white">Pubblica annuncio</Link></li>
              <li><Link href="/annunci?sort=recent" className="hover:text-white">Ultimi inseriti</Link></li>
              {shopEnabled && <li><Link href="/shop" className="hover:text-white">Shop</Link></li>}
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
              <li><Link href="/profilo/helpdesk" className="hover:text-white">Assistenza</Link></li>
              <li><Link href="/servizi" className="hover:text-white">Servizi</Link></li>
              <li><Link href="/linee-guida" className="hover:text-white">Linee guida video</Link></li>
              <li><Link href="/porta-un-amico" className="hover:text-white">Porta un amico</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link href="/termini" className="hover:text-white">Termini di uso</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-sm text-center">
          © {new Date().getFullYear()} VedoCompro. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}
