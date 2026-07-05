'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, BadgeCheck, MailCheck, Trash2, Save, MessageSquareText, CheckCircle2 } from 'lucide-react';
import { adminApi, api } from '@/lib/api';

interface AdminUserDetail {
  id: number;
  email: string;
  username: string;
  name: string;
  realname: string;
  phone: string;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  address: string;
  city: string;
  cap: string;
  pic: string | null;
  points: number;
  creditsGold: number;
  creditsSilver: number;
  creditsBronze: number;
  isCompany: number | null;
  businessEnd: string | null;
  isActive: boolean;
  isAdmin: boolean;
  dateJoin: string;
  createdAt: string;
  _count: { ads: number; adOrders: number; reportsReceived: number; helpDeskTickets: number };
}

interface CrmNote {
  id: number;
  note: string;
  riskTag: string;
  followUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  adminUser: { id: number; username: string };
}

const RISK_LABELS: Record<string, string> = {
  none: 'Nessun tag',
  watch: 'Da monitorare',
  risk: 'Rischio',
  blocked: 'Blocco/abuso',
  vip: 'VIP',
};

const RISK_CLASSES: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600',
  watch: 'bg-amber-100 text-amber-800',
  risk: 'bg-red-100 text-red-700',
  blocked: 'bg-purple-100 text-purple-700',
  vip: 'bg-blue-100 text-blue-700',
};

export default function AdminUserEditPage() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id, 10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [crmForm, setCrmForm] = useState({ note: '', riskTag: 'none', followUpAt: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getUser(userId).then((r) => r.data as AdminUserDetail),
  });

  const { data: crm, isLoading: isCrmLoading } = useQuery({
    queryKey: ['admin-user-crm', userId],
    queryFn: () => api.get<{ notes: CrmNote[]; openFollowUps: number; openRiskTags: number }>(`/admin/users/${userId}/crm`).then((r) => r.data),
    enabled: Number.isFinite(userId),
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        realname: user.realname,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        city: user.city,
        cap: user.cap,
        creditsGold: String(user.creditsGold),
        creditsSilver: String(user.creditsSilver),
        creditsBronze: String(user.creditsBronze),
        points: String(user.points),
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        phoneVerified: user.phoneVerified,
        isCompany: !!user.isCompany,
        businessEnd: user.businessEnd ? user.businessEnd.slice(0, 10) : '',
      });
    }
  }, [user]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.updateUser(userId, payload),
    onSuccess: () => {
      setMessage('Modifiche salvate.');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore durante il salvataggio');
      setMessage('');
    },
  });

  const handleSave = () => {
    save.mutate({
      ...form,
      businessEnd: form.businessEnd || null,
    });
  };

  const handleDelete = async () => {
    if (!confirm("Eliminare definitivamente questo utente? L'azione è irreversibile.")) return;
    await adminApi.deleteUser(userId);
    router.push('/admin/utenti');
  };

  const createCrmNote = useMutation({
    mutationFn: () => api.post(`/admin/users/${userId}/crm`, {
      note: crmForm.note,
      riskTag: crmForm.riskTag,
      followUpAt: crmForm.followUpAt || null,
    }),
    onSuccess: () => {
      setCrmForm({ note: '', riskTag: 'none', followUpAt: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-user-crm', userId] });
    },
  });

  const resolveCrmNote = useMutation({
    mutationFn: (noteId: number) => api.put(`/admin/users/${userId}/crm/${noteId}`, { resolved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-crm', userId] }),
  });

  if (isLoading || !user) return <div className="p-8 text-gray-400">Caricamento...</div>;

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="p-8 max-w-3xl">
      <div className="admin-breadcrumb mb-4">
        <Link href="/admin">Dashboard</Link> / <Link href="/admin/utenti">Utenti</Link> / @{user.username}
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-brand" />
          <h1>Modifica utente #{user.id}</h1>
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="badge bg-gray-100 text-gray-600">{user._count.ads} annunci</span>
          <span className="badge bg-gray-100 text-gray-600">{user._count.adOrders} ordini</span>
          <span className="badge bg-gray-100 text-gray-600">{user._count.reportsReceived} segnalazioni</span>
        </div>
      </div>

      {/* Stato account + attivazione forzata: utile in dev (email non configurata) e
          legittimo in produzione come intervento manuale di supporto. */}
      {!user.isActive && (
        <div className="card p-4 mb-6 border-amber-200 bg-amber-50 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            Account non attivo: l&apos;utente non ha ancora verificato l&apos;email e non può accedere.
          </p>
          <button
            onClick={() => save.mutate({ isActive: true })}
            className="btn-primary text-sm whitespace-nowrap"
            disabled={save.isPending}
          >
            <MailCheck className="w-4 h-4" /> Attiva account
          </button>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={String(form.username ?? '')} onChange={set('username')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={String(form.email ?? '')} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Nome visualizzato</label>
            <input className="input" value={String(form.name ?? '')} onChange={set('name')} />
          </div>
          <div>
            <label className="label">Nome reale</label>
            <input className="input" value={String(form.realname ?? '')} onChange={set('realname')} />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input className="input" value={String(form.phone ?? '')} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">Città</label>
            <input className="input" value={String(form.city ?? '')} onChange={set('city')} />
          </div>
          <div>
            <label className="label">Indirizzo</label>
            <input className="input" value={String(form.address ?? '')} onChange={set('address')} />
          </div>
          <div>
            <label className="label">CAP</label>
            <input className="input" value={String(form.cap ?? '')} onChange={set('cap')} />
          </div>
        </div>

        <div className="border-t pt-4 grid sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Crediti Gold</label>
            <input className="input" type="number" min={0} value={String(form.creditsGold ?? '0')} onChange={set('creditsGold')} />
          </div>
          <div>
            <label className="label">Crediti Silver</label>
            <input className="input" type="number" min={0} value={String(form.creditsSilver ?? '0')} onChange={set('creditsSilver')} />
          </div>
          <div>
            <label className="label">Crediti Bronze</label>
            <input className="input" type="number" min={0} value={String(form.creditsBronze ?? '0')} onChange={set('creditsBronze')} />
          </div>
          <div>
            <label className="label">Punti</label>
            <input className="input" type="number" value={String(form.points ?? '0')} onChange={set('points')} />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive === true} onChange={set('isActive')} />
            Account attivo (email verificata / attivazione forzata)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.phoneVerified === true} onChange={set('phoneVerified')} />
            <span className="flex items-center gap-1">
              Telefono verificato <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isAdmin === true} onChange={set('isAdmin')} />
            Amministratore
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isCompany === true} onChange={set('isCompany')} />
              Account Business
            </label>
            {form.isCompany === true && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">scadenza</span>
                <input
                  type="date"
                  className="input py-1"
                  value={String(form.businessEnd ?? '')}
                  onChange={set('businessEnd')}
                />
              </div>
            )}
          </div>
        </div>

        {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between border-t pt-4">
          <button onClick={handleDelete} className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Elimina utente
          </button>
          <button onClick={handleSave} disabled={save.isPending} className="btn-primary">
            <Save className="w-4 h-4" /> {save.isPending ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Registrato il {new Date(user.createdAt).toLocaleDateString('it-IT')}
        {user.phoneVerifiedAt && ` · telefono verificato il ${new Date(user.phoneVerifiedAt).toLocaleDateString('it-IT')}`}
      </p>

      <section className="card p-6 mt-8 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquareText className="w-5 h-5 text-brand" /> CRM interno
            </h2>
            <p className="text-sm text-gray-500">Note visibili solo agli admin, tag rischio e promemoria di follow-up.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge bg-amber-50 text-amber-700">{crm?.openFollowUps ?? 0} follow-up aperti</span>
            <span className="badge bg-red-50 text-red-700">{crm?.openRiskTags ?? 0} tag rischio aperti</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_160px_170px] gap-3">
          <div>
            <label className="label">Nota interna</label>
            <textarea
              className="input min-h-24"
              value={crmForm.note}
              onChange={(e) => setCrmForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Es. cliente da richiamare, verifica documento, attenzione su dispute..."
            />
          </div>
          <div>
            <label className="label">Tag</label>
            <select
              className="input"
              value={crmForm.riskTag}
              onChange={(e) => setCrmForm((prev) => ({ ...prev, riskTag: e.target.value }))}
            >
              {Object.entries(RISK_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Follow-up</label>
            <input
              className="input"
              type="datetime-local"
              value={crmForm.followUpAt}
              onChange={(e) => setCrmForm((prev) => ({ ...prev, followUpAt: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => createCrmNote.mutate()}
            disabled={createCrmNote.isPending || crmForm.note.trim().length < 3}
            className="btn-primary"
          >
            <Save className="w-4 h-4" /> Aggiungi nota
          </button>
        </div>

        <div className="border-t pt-4 space-y-3">
          {isCrmLoading ? (
            <p className="text-sm text-gray-400">Caricamento note...</p>
          ) : !crm?.notes.length ? (
            <p className="text-sm text-gray-400">Nessuna nota CRM per questo utente.</p>
          ) : (
            crm.notes.map((note) => (
              <div key={note.id} className={note.resolvedAt ? 'rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-70' : 'rounded-lg border border-gray-200 p-4'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${RISK_CLASSES[note.riskTag] ?? RISK_CLASSES.none}`}>
                        {RISK_LABELS[note.riskTag] ?? note.riskTag}
                      </span>
                      {note.followUpAt && (
                        <span className="badge bg-amber-50 text-amber-700">
                          Follow-up {new Date(note.followUpAt).toLocaleString('it-IT')}
                        </span>
                      )}
                      {note.resolvedAt && <span className="badge bg-green-50 text-green-700">Risolta</span>}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                    <p className="text-xs text-gray-400">
                      @{note.adminUser.username} · {new Date(note.createdAt).toLocaleString('it-IT')}
                    </p>
                  </div>
                  {!note.resolvedAt && (
                    <button
                      type="button"
                      onClick={() => resolveCrmNote.mutate(note.id)}
                      className="btn-secondary text-sm whitespace-nowrap"
                      disabled={resolveCrmNote.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Chiudi
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
