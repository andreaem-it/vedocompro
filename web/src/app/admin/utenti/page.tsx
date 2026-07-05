'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { BadgeCheck, Search, Shield, ShieldOff, Trash2, Pencil, MailCheck } from 'lucide-react';
import AdminExportButton from '@/components/admin/AdminExportButton';

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, page],
    queryFn: () => adminApi.listUsers({ q, page: String(page) }).then((r) => r.data),
  });

  const toggleAdmin = async (id: number, isAdmin: boolean) => {
    await adminApi.updateUser(id, { isAdmin: !isAdmin });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  // Attivazione manuale: bypassa la verifica email (utile in dev dove la mail non
  // esce, e come intervento di supporto in produzione). Azione tracciata nell'audit log.
  const activateUser = async (id: number) => {
    await adminApi.updateUser(id, { isActive: true });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? L\'azione è irreversibile.')) return;
    await adminApi.deleteUser(id);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1>Gestione Utenti</h1>
        <AdminExportButton
          endpoint="/admin/export/users"
          filename={`vedocompro-utenti-${new Date().toISOString().slice(0, 10)}.csv`}
          params={q ? { q } : undefined}
        />
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Cerca per email o username..."
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Registrato</th>
              <th className="px-4 py-3">Verifiche</th>
              <th className="px-4 py-3">Crediti (G/S/B)</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : (
              data?.users?.map((u: any) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.isActive ? <span className="badge bg-sky-100 text-sky-700">Email</span> : null}
                      {u.phoneVerified ? (
                        <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> Tel
                        </span>
                      ) : null}
                      {!u.isActive && !u.phoneVerified ? <span className="badge bg-gray-100 text-gray-500">Nessuna</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.creditsGold}/{u.creditsSilver}/{u.creditsBronze}</td>
                  <td className="px-4 py-3">
                    {u.isAdmin ? <span className="badge bg-purple-100 text-purple-700">Admin</span> : <span className="badge bg-gray-100 text-gray-600">Utente</span>}
                  </td>
                  <td className="px-4 py-3 flex gap-1 justify-end">
                    {!u.isActive && (
                      <button onClick={() => activateUser(u.id)} className="btn-ghost p-1.5 text-green-600" title="Attiva account (bypassa verifica email)">
                        <MailCheck className="w-4 h-4" />
                      </button>
                    )}
                    <Link href={`/admin/utenti/${u.id}`} className="btn-ghost p-1.5" title="Modifica utente">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => toggleAdmin(u.id, u.isAdmin)} className="btn-ghost p-1.5" title={u.isAdmin ? 'Rimuovi admin' : 'Rendi admin'}>
                      {u.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="btn-ghost p-1.5 text-red-600" title="Elimina">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary disabled:opacity-40">Precedente</button>
          <span>Pagina {page} di {data.pagination.pages}</span>
          <button disabled={page === data.pagination.pages} onClick={() => setPage(page + 1)} className="btn-secondary disabled:opacity-40">Successiva</button>
        </div>
      )}
    </div>
  );
}
