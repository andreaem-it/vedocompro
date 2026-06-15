'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, MessageSquare, Heart, LogOut, User, ChevronDown, LayoutDashboard, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Image from 'next/image';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/annunci?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-2xl text-brand">
            Vedo<span className="text-gray-900">Compro</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="search"
                placeholder="Cerca annunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 h-10"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/annunci/nuovo" className="btn-primary hidden sm:inline-flex">
              <Plus className="w-4 h-4" />
              Pubblica
            </Link>

            {user ? (
              <>
                <Link href="/messaggi" className="btn-ghost p-2" title="Messaggi">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <Link href="/profilo/wishlist" className="btn-ghost p-2" title="Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link href="/notifiche" className="btn-ghost p-2" title="Notifiche">
                  <Bell className="w-5 h-5" />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 btn-ghost"
                  >
                    {user.pic ? (
                      <Image src={user.pic} alt={user.username} width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 card py-1 shadow-lg">
                      <Link href={`/utenti/${user.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                        <User className="w-4 h-4" /> Profilo
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
                <Link href="/login" className="btn-secondary text-sm">Accedi</Link>
                <Link href="/registrati" className="btn-primary text-sm hidden sm:inline-flex">Registrati</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
