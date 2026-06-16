'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, MessageSquare, Heart, LogOut, User, ChevronDown, LayoutDashboard, Menu, X, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Image from 'next/image';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/annunci?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: '#4396C1' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-white font-bold text-2xl tracking-tight">
              Vedo<span className="font-light">Compro</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="search"
                placeholder="Cerca annunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white text-gray-900"
              />
            </div>
          </form>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-auto text-sm font-bold">
            <Link href="/" className="text-white/90 hover:text-white px-3 py-2">HOME</Link>

            {user ? (
              <>
                <Link href="/messaggi" className="text-white/90 hover:text-white px-2 py-2" title="Messaggi">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <Link href="/profilo/wishlist" className="text-white/90 hover:text-white px-2 py-2" title="Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link href="/notifiche" className="text-white/90 hover:text-white px-2 py-2" title="Notifiche">
                  <Bell className="w-5 h-5" />
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-white/90 hover:text-white px-3 py-2"
                  >
                    {user.pic ? (
                      <Image src={user.pic} alt={user.username} width={28} height={28} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden lg:block">{user.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <Link href={`/utenti/${user.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                        <User className="w-4 h-4" /> Profilo
                      </Link>
                      {user.isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
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
                <Link href="/login" className="text-white/90 hover:text-white px-3 py-2">ACCEDI</Link>
                <Link href="/registrati" className="text-white/90 hover:text-white px-3 py-2">REGISTRATI</Link>
              </>
            )}

            <Link href="/annunci" className="text-white/90 hover:text-white px-3 py-2">SUPPORTO</Link>

            {/* Pubblica annuncio */}
            <Link
              href="/annunci/nuovo"
              className="ml-2 flex items-center gap-2 text-white font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#46A3D9' }}
            >
              <Camera className="w-4 h-4" />
              Inserisci annuncio
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden ml-auto text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="sm:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Cerca annunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:outline-none bg-white text-gray-900"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-dark border-t border-white/20">
          <nav className="flex flex-col px-4 py-2 text-white font-bold text-sm">
            <Link href="/" className="py-3 border-b border-white/10" onClick={() => setMobileOpen(false)}>HOME</Link>
            {user ? (
              <>
                <Link href="/messaggi" className="py-3 border-b border-white/10" onClick={() => setMobileOpen(false)}>MESSAGGI</Link>
                <Link href="/profilo/wishlist" className="py-3 border-b border-white/10" onClick={() => setMobileOpen(false)}>WISHLIST</Link>
                <Link href="/notifiche" className="py-3 border-b border-white/10" onClick={() => setMobileOpen(false)}>NOTIFICHE</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="py-3 text-left text-red-300">ESCI</button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-3 border-b border-white/10" onClick={() => setMobileOpen(false)}>ACCEDI</Link>
                <Link href="/registrati" className="py-3 border-b border-white/10" onClick={() => setMobileOpen(false)}>REGISTRATI</Link>
              </>
            )}
            <Link href="/annunci/nuovo" className="py-3" onClick={() => setMobileOpen(false)}>INSERISCI ANNUNCIO</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
