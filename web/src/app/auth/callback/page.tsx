'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function OAuthCallback() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token).then(() => router.replace('/'));
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, [params, login, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Accesso in corso...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return <Suspense><OAuthCallback /></Suspense>;
}
