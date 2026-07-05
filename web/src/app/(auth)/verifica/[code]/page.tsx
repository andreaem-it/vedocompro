'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useParams<{ code: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authApi
      .verifyEmail(params.code)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message ?? 'Account verificato con successo.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error ?? 'Codice di verifica non valido o già utilizzato.');
      });
  }, [params.code]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="card p-8">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-brand mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Verifica in corso...</h1>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Account verificato!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link href="/login" className="btn-primary w-full justify-center py-2.5">Vai al login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verifica non riuscita</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link href="/login" className="btn-secondary w-full justify-center py-2.5">Torna al login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
