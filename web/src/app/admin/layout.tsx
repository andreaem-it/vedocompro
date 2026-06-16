'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, CreditCard, HeadphonesIcon, BarChart3, Video, Star } from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/utenti', label: 'Utenti', icon: Users },
  { href: '/admin/annunci', label: 'Annunci', icon: FileText },
  { href: '/admin/video', label: 'Video', icon: Video },
  { href: '/admin/recensioni', label: 'Recensioni', icon: Star },
  { href: '/admin/pagamenti', label: 'Pagamenti', icon: CreditCard },
  { href: '/admin/helpdesk', label: 'Help Desk', icon: HeadphonesIcon },
  { href: '/admin/statistiche', label: 'Statistiche', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user?.isAdmin) return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-56 bg-gray-900 text-gray-300 flex-shrink-0">
        <nav className="p-4 space-y-1">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-3 px-2">Admin Panel</p>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === href
                  ? 'bg-brand text-white'
                  : 'hover:bg-gray-800 hover:text-white',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </div>
    </div>
  );
}
