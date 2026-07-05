'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, CreditCard, HeadphonesIcon, BarChart3, Video, Star, ShoppingBag, FolderTree, Ticket, Mail, ShieldCheck, LogOut, MessageSquareText, ScrollText, Building2, Server, LockKeyhole, Flag, Scale, Megaphone, PackageCheck, Upload } from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { shopEnabled } from '@/config/features';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/utenti', label: 'Utenti', icon: Users },
  { href: '/admin/annunci', label: 'Annunci', icon: FileText },
  { href: '/admin/categorie', label: 'Categorie', icon: FolderTree },
  { href: '/admin/video', label: 'Video', icon: Video },
  { href: '/admin/recensioni', label: 'Recensioni', icon: Star },
  ...(shopEnabled ? [{ href: '/admin/shop', label: 'Shop', icon: ShoppingBag }] : []),
  { href: '/admin/business', label: 'Business', icon: Building2 },
  { href: '/admin/ordini', label: 'Ordini', icon: PackageCheck },
  { href: '/admin/pagamenti', label: 'Pagamenti', icon: CreditCard },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/promozioni', label: 'Promozioni', icon: Megaphone },
  { href: '/admin/coupon', label: 'Coupon', icon: Ticket },
  { href: '/admin/template-email', label: 'Template Email', icon: Mail },
  { href: '/admin/helpdesk', label: 'Help Desk', icon: HeadphonesIcon },
  { href: '/admin/segnalazioni', label: 'Segnalazioni', icon: Flag },
  { href: '/admin/dispute', label: 'Dispute ordini', icon: Scale },
  { href: '/admin/suggerimenti', label: 'Suggerimenti', icon: MessageSquareText },
  { href: '/admin/log-azioni', label: 'Log azioni', icon: ScrollText },
  { href: '/admin/statistiche', label: 'Statistiche', icon: BarChart3 },
  { href: '/admin/sistema', label: 'Sistema', icon: Server },
  { href: '/admin/lock', label: 'Blocca', icon: LockKeyhole },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user?.isAdmin) return null;

  const currentNavLabel = NAV.find(
    ({ href }) => pathname === href || (href !== '/admin' && pathname.startsWith(href)),
  )?.label ?? 'Dashboard';

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-60 bg-gray-900 text-gray-300 flex-shrink-0 flex flex-col">
        {/* Logo, richiama il blocco "logo" dell'header AdminLTE legacy */}
        <Link
          href="/admin"
          className="flex items-center justify-center h-16 border-b border-gray-800 text-white font-semibold tracking-wide"
        >
          <span className="text-brand font-bold">Vedo</span>Compro
          <span className="text-brand font-bold ml-1">.it</span>
        </Link>

        {/* User panel, richiama il "user-panel" della sidebar AdminLTE legacy */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <div className="w-9 h-9 rounded-full bg-brand/20 text-brand flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.username}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-2 px-2">Menù</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border-l-4',
                  isActive
                    ? 'bg-gray-800 text-white border-brand'
                    : 'border-transparent hover:bg-gray-800 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 border-t border-gray-800 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </aside>

      <div className="flex-1 bg-gray-50 overflow-auto">
        {/* Mini header con breadcrumb, richiama il "content-header" AdminLTE legacy */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <nav className="admin-breadcrumb">
            <Link href="/admin" className="flex items-center gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            {currentNavLabel !== 'Dashboard' && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-700 font-medium">{currentNavLabel}</span>
              </>
            )}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
