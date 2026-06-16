'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/lib/api';

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  realname: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Campo obbligatorio'),
  newPassword: z.string().min(8, 'Minimo 8 caratteri'),
});

export default function ImpostazioniPage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const [savedMsg, setSavedMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: user ? { name: user.name, realname: user.realname, phone: user.phone, city: user.city, address: user.address } : undefined,
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data: any) => {
    setSavedMsg('');
    await usersApi.updateMe(data);
    await refresh();
    setSavedMsg('Profilo aggiornato con successo.');
  };

  const onChangePassword = async (data: any) => {
    setPwMsg('');
    try {
      await usersApi.changePassword(data);
      passwordForm.reset();
      setPwMsg('Password aggiornata con successo.');
    } catch (err: any) {
      setPwMsg(err.response?.data?.error ?? 'Errore durante il cambio password');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      <h1>Impostazioni account</h1>

      {/* Profile form */}
      <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="card p-6 space-y-4">
        <h2>Dati personali</h2>
        {savedMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{savedMsg}</div>}

        <div>
          <label className="label">Nome visualizzato</label>
          <input {...profileForm.register('name')} className="input" />
        </div>
        <div>
          <label className="label">Nome completo</label>
          <input {...profileForm.register('realname')} className="input" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Telefono</label>
            <input {...profileForm.register('phone')} className="input" />
          </div>
          <div>
            <label className="label">Città</label>
            <input {...profileForm.register('city')} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Indirizzo</label>
          <input {...profileForm.register('address')} className="input" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn-primary">
            Salva modifiche
          </button>
        </div>
      </form>

      {/* Password form */}
      <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="card p-6 space-y-4">
        <h2>Cambia password</h2>
        {pwMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm border ${pwMsg.includes('successo') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {pwMsg}
          </div>
        )}

        <div>
          <label className="label">Password attuale</label>
          <input {...passwordForm.register('currentPassword')} type="password" className="input" />
          {passwordForm.formState.errors.currentPassword && (
            <p className="text-red-500 text-xs mt-1">{String(passwordForm.formState.errors.currentPassword.message)}</p>
          )}
        </div>
        <div>
          <label className="label">Nuova password</label>
          <input {...passwordForm.register('newPassword')} type="password" className="input" />
          {passwordForm.formState.errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{String(passwordForm.formState.errors.newPassword.message)}</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-primary">
            Aggiorna password
          </button>
        </div>
      </form>
    </div>
  );
}
