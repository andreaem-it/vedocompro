'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/lib/api';
import { Building2, CheckCircle2, CreditCard, KeyRound, Phone, Settings, User as UserIcon } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  realname: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  companyLogo: z.string().optional(),
  companyWebsite: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  paymentInstructions: z.string().max(2000).optional(),
  paymentPaypalEmail: z.string().email('Email non valida').or(z.literal('')).optional(),
  paymentIban: z.string().max(34).optional(),
  paymentAccountHolder: z.string().max(120).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Campo obbligatorio'),
  newPassword: z.string().min(8, 'Minimo 8 caratteri'),
});

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bonifico' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'cash', label: 'Contanti alla consegna' },
  { id: 'other', label: 'Altro accordo' },
];

export default function ImpostazioniPage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const [savedMsg, setSavedMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneMsg, setPhoneMsg] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: user ? {
      name: user.name,
      realname: user.realname,
      phone: user.phone,
      city: user.city,
      address: user.address,
      companyLogo: user.companyLogo ?? '',
      companyWebsite: user.companyWebsite ?? '',
      paymentMethods: user.paymentMethods ?? [],
      paymentInstructions: user.paymentInstructions ?? '',
      paymentPaypalEmail: user.paymentPaypalEmail ?? '',
      paymentIban: user.paymentIban ?? '',
      paymentAccountHolder: user.paymentAccountHolder ?? '',
    } : undefined,
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

  const requestPhoneCode = async () => {
    setPhoneMsg('');
    setPhoneLoading(true);
    try {
      const res = await usersApi.requestPhoneVerification();
      const devCode = res.data.devCode ? ` Codice sviluppo: ${res.data.devCode}` : '';
      setPhoneMsg(`${res.data.message ?? 'Codice inviato.'}${devCode}`);
    } catch (err: any) {
      setPhoneMsg(err.response?.data?.error ?? 'Errore durante la richiesta del codice');
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyPhone = async () => {
    setPhoneMsg('');
    setPhoneLoading(true);
    try {
      await usersApi.verifyPhone(phoneCode);
      setPhoneCode('');
      await refresh();
      setPhoneMsg('Telefono verificato con successo.');
    } catch (err: any) {
      setPhoneMsg(err.response?.data?.error ?? 'Errore durante la verifica del telefono');
    } finally {
      setPhoneLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      <h1 className="flex items-center gap-2"><Settings className="w-6 h-6 text-brand" /> Impostazioni account</h1>

      {/* Profile form */}
      <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="card p-6 space-y-4">
        <h2 className="flex items-center gap-2"><UserIcon className="w-5 h-5 text-brand" /> Dati personali</h2>
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
        {user.isCompany ? (
          <div className="border-t pt-4 space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="w-4 h-4 text-brand" /> Dati aziendali
            </h3>
            <div>
              <label className="label">Logo aziendale (URL immagine)</label>
              <input {...profileForm.register('companyLogo')} className="input" placeholder="https://..." />
            </div>
            <div>
              <label className="label">Sito web aziendale</label>
              <input {...profileForm.register('companyWebsite')} className="input" placeholder="https://..." />
            </div>
          </div>
        ) : null}

        <div className="border-t pt-4 space-y-4">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="w-4 h-4 text-brand" /> Preferenze pagamento venditore
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <label key={method.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  value={method.id}
                  {...profileForm.register('paymentMethods')}
                  className="h-4 w-4 rounded border-gray-300 text-brand"
                />
                {method.label}
              </label>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email PayPal</label>
              <input {...profileForm.register('paymentPaypalEmail')} className="input" placeholder="pagamenti@example.com" />
            </div>
            <div>
              <label className="label">Intestatario</label>
              <input {...profileForm.register('paymentAccountHolder')} className="input" placeholder="Nome e cognome" />
            </div>
          </div>
          <div>
            <label className="label">IBAN</label>
            <input {...profileForm.register('paymentIban')} className="input" placeholder="IT..." />
          </div>
          <div>
            <label className="label">Istruzioni per il compratore</label>
            <textarea
              {...profileForm.register('paymentInstructions')}
              className="input min-h-28"
              placeholder="Indica quando inviare il pagamento, causale consigliata o accordi per il ritiro."
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn-primary">
            Salva modifiche
          </button>
        </div>
      </form>

      <section className="card p-6 space-y-4">
        <h2 className="flex items-center gap-2"><Phone className="w-5 h-5 text-brand" /> Verifica telefono</h2>
        <div className={`px-4 py-3 rounded-lg text-sm border ${user.phoneVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          {user.phoneVerified ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Numero verificato
            </span>
          ) : (
            'Verifica il telefono per aumentare la fiducia del profilo e sbloccare limiti messaggi meno restrittivi.'
          )}
        </div>
        {phoneMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm border ${phoneMsg.includes('successo') || phoneMsg.includes('generato') || phoneMsg.includes('inviato') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {phoneMsg}
          </div>
        )}

        {!user.phoneVerified && (
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <input
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              className="input"
              inputMode="numeric"
              maxLength={6}
              placeholder="Codice a 6 cifre"
            />
            <div className="flex gap-2">
              <button type="button" onClick={requestPhoneCode} disabled={phoneLoading} className="btn-secondary">
                Invia codice
              </button>
              <button type="button" onClick={verifyPhone} disabled={phoneLoading || phoneCode.length !== 6} className="btn-primary">
                Verifica
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Password form */}
      <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="card p-6 space-y-4">
        <h2 className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand" /> Cambia password</h2>
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
