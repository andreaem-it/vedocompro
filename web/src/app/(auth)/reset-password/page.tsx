'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { getRecaptchaToken } from '@/lib/recaptcha';

const requestSchema = z.object({ email: z.string().email('Email non valida') });
const resetSchema = z.object({
  password: z.string().min(8, 'Minimo 8 caratteri'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Le password non coincidono', path: ['confirm'] });

function SetNewPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: any) => {
    setError('');
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Errore durante il reset');
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <h1 className="mb-4">Password aggiornata!</h1>
        <p className="text-gray-600 mb-6">Puoi ora accedere con la nuova password.</p>
        <Link href="/login" className="btn-primary">Vai al login</Link>
      </div>
    );
  }

  return (
    <div className="card p-8 w-full max-w-md">
      <h1 className="mb-2">Nuova password</h1>
      <p className="text-gray-600 text-sm mb-6">Inserisci la tua nuova password.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="label">Nuova password</label>
          <input {...register('password')} type="password" className="input" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
        </div>
        <div>
          <label className="label">Conferma password</label>
          <input {...register('confirm')} type="password" className="input" />
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{String(errors.confirm.message)}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
          {isSubmitting ? 'Salvataggio...' : 'Aggiorna password'}
        </button>
      </form>
    </div>
  );
}

function RequestResetForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(requestSchema) });

  const onSubmit = async (data: any) => {
    setError('');
    try {
      const recaptchaToken = await getRecaptchaToken('password_reset');
      await authApi.forgotPassword(data.email, recaptchaToken);
      setDone(true);
    } catch {
      setError('Errore. Riprova più tardi.');
    }
  };

  if (done) {
    return (
      <div className="text-center max-w-md">
        <h1 className="mb-4">Email inviata</h1>
        <p className="text-gray-600 mb-2">Se l&apos;email è registrata, riceverai le istruzioni per il reset.</p>
        <p className="text-sm text-gray-400">Controlla anche la cartella spam.</p>
      </div>
    );
  }

  return (
    <div className="card p-8 w-full max-w-md">
      <h1 className="mb-2">Password dimenticata?</h1>
      <p className="text-gray-600 text-sm mb-6">Inserisci la tua email e ti invieremo le istruzioni.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input" placeholder="mario@esempio.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
          {isSubmitting ? 'Invio...' : 'Invia istruzioni'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        <Link href="/login" className="text-brand hover:underline">Torna al login</Link>
      </p>
    </div>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get('token');
  return token ? <SetNewPasswordForm token={token} /> : <RequestResetForm />;
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
