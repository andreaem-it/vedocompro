'use client';

import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdminLockPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="card p-8 max-w-md w-full text-center">
        <LockKeyhole className="w-12 h-12 text-brand mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pannello bloccato</h1>
        <p className="text-gray-500 mb-6">Per proteggere il pannello admin, esci e rientra con le tue credenziali quando torni al lavoro.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={logout} className="btn-primary justify-center">Esci</button>
          <Link href="/admin" className="btn-secondary justify-center">Torna alla dashboard</Link>
        </div>
      </div>
    </div>
  );
}
