'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, MessageSquare, Heart, LogOut, User, ChevronDown, LayoutDashboard, Plus, HeadphonesIcon, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Image from 'next/image';
import { shopEnabled } from '@/config/features';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/annunci?q=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false);
  };

  return (
    <header className="bg-brand-dark sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo-white.png" alt="VedoCompro.it" width={160} height={30} className="h-7 w-auto" priority />
          </Link>

          {/* Nav links (sempre visibili, come il legacy) */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-white/90">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {shopEnabled && (
              <Link href="/shop" className="hover:text-white transition-colors flex items-center gap-1">
                Shop
              </Link>
            )}
            <Link href="/profilo/helpdesk" className="hover:text-white transition-colors">Supporto</Link>
            <Link href="/servizi" className="hover:text-white transition-colors">Servizi</Link>
            {user?.isCompany ? (
              <Link href="/business/dashboard" className="hover:text-yellow-300 transition-colors text-yellow-400 font-semibold">Business</Link>
            ) : null}
          </nav>

          <div className="flex-1" />

          {/* Search toggle */}
          <button onClick={() => setSearchOpen((s) => !s)} className="p-2 text-white/90 hover:text-white" title="Cerca">
            <Search className="w-5 h-5" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link href="/messaggi" className="p-2 text-white/90 hover:text-white" title="Messaggi">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <Link href="/profilo/wishlist" className="p-2 text-white/90 hover:text-white" title="Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link href="/notifiche" className="p-2 text-white/90 hover:text-white" title="Notifiche">
                  <Bell className="w-5 h-5" />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 text-white/90 hover:text-white"
                  >
                    {user.pic ? (
                      <Image src={user.pic} alt={user.username} width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center text-sm font-semibold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 card py-1 shadow-lg text-gray-700">
                      <Link href="/profilo" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                        <User className="w-4 h-4" /> Profilo
                      </Link>
                      <Link href="/profilo/impostazioni" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                        <Settings className="w-4 h-4" /> Impostazioni
                      </Link>
                      <Link href="/profilo/helpdesk" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                        <HeadphonesIcon className="w-4 h-4" /> Supporto
                      </Link>
                      {user.isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <LayoutDashboard className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Esci
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-white/90 hover:text-white">Accedi</Link>
                <Link href="/registrati" className="px-3 py-1.5 text-sm font-medium text-white/90 hover:text-white hidden sm:inline-flex">Registrati</Link>
              </>
            )}

            <Link
              href="/annunci/nuovo"
              className="ml-2 inline-flex items-center gap-1.5 bg-white text-brand-dark font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Inserisci annuncio</span>
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                autoFocus
                type="search"
                placeholder="Cerca annunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 h-10 bg-white"
              />
            </div>
          </form>
        )}
      </div>
    </header>
  );
}
