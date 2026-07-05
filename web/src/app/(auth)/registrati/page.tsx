'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { useState } from 'react';
import { MailCheck, UserPlus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Minimo 2 caratteri').max(100),
  username: z.string().min(3, 'Minimo 3 caratteri').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo lettere, numeri e _'),
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Minimo 8 caratteri'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Le password non coincidono', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const { confirmPassword, ...payload } = data;
      const recaptchaToken = await getRecaptchaToken('register');
      await authApi.register({ ...payload, recaptchaToken });
      setRegisteredEmail(payload.email);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Errore durante la registrazione');
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <MailCheck className="w-12 h-12 text-brand mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Controlla la tua email</h1>
            <p className="text-gray-600">
              Abbiamo inviato un link di verifica a <strong>{registeredEmail}</strong>. Clicca il link per attivare il tuo account, poi accedi.
            </p>
            <Link href="/login" className="btn-primary w-full justify-center py-2.5 mt-6">Vai al login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Crea il tuo account</h1>
          <p className="text-gray-600">Unisciti a VedoCompro — è gratis!</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome e cognome</label>
                <input {...register('name')} className="input" placeholder="Mario Rossi" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Username</label>
                <input {...register('username')} className="input" placeholder="mario_rossi" />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="mario@esempio.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="Minimo 8 caratteri" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Conferma password</label>
              <input {...register('confirmPassword')} type="password" className="input" placeholder="Ripeti la password" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <p className="text-xs text-gray-500">
              Registrandoti accetti i nostri{' '}
              <Link href="/termini" className="text-brand hover:underline">Termini di utilizzo</Link> e la{' '}
              <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5">
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Registrazione...' : 'Crea account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Hai già un account?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
