'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, lookupApi } from '@/lib/api';
import { CreditCard, Tag, Star } from 'lucide-react';
import { Product } from '@/types';
import Link from 'next/link';

export default function PagamentiPage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => lookupApi.products().then((r) => r.data as Product[]),
  });

  const { data: payments } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentsApi.getMyPayments().then((r) => r.data),
    enabled: !!user,
  });

  const couponMutation = useMutation({
    mutationFn: (code: string) => paymentsApi.applyCoupon(code),
    onSuccess: (res) => {
      setCouponMsg(`Coupon applicato! +${res.data.value} crediti silver aggiunti.`);
      setCouponCode('');
      refresh();
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
    },
    onError: (err: any) => {
      setCouponMsg(err.response?.data?.error ?? 'Coupon non valido.');
    },
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      <h1 className="flex items-center gap-2"><CreditCard className="w-6 h-6 text-brand" /> Pagamenti e crediti</h1>

      {/* Credits summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center border-2 border-yellow-300">
          <p className="text-2xl font-bold text-yellow-600">{user.creditsGold}</p>
          <p className="text-sm text-gray-500">Crediti Gold</p>
        </div>
        <div className="card p-4 text-center border-2 border-gray-300">
          <p className="text-2xl font-bold text-gray-600">{user.creditsSilver}</p>
          <p className="text-sm text-gray-500">Crediti Silver</p>
        </div>
        <div className="card p-4 text-center border-2 border-orange-300">
          <p className="text-2xl font-bold text-orange-600">{user.creditsBronze}</p>
          <p className="text-sm text-gray-500">Crediti Bronze</p>
        </div>
      </div>

      {/* Coupon */}
      <div className="card p-5">
        <h2 className="flex items-center gap-2 mb-4 text-base font-semibold"><Tag className="w-4 h-4 text-brand" /> Hai un coupon?</h2>
        {couponMsg && (
          <div className={`mb-3 px-4 py-3 rounded-lg text-sm border ${couponMsg.includes('applicato') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {couponMsg}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg(''); }}
            placeholder="Inserisci codice coupon"
            className="input uppercase tracking-widest font-mono"
          />
          <button
            onClick={() => couponMutation.mutate(couponCode)}
            disabled={!couponCode.trim() || couponMutation.isPending}
            className="btn-primary whitespace-nowrap"
          >
            {couponMutation.isPending ? 'Verifica...' : 'Applica'}
          </button>
        </div>
      </div>

      {/* Products */}
      {products && products.length > 0 && (
        <div>
          <h2 className="mb-4">Acquista pacchetti crediti</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-brand" />
                  <h3 className="font-semibold">{product.name}</h3>
                </div>
                <div className="space-y-1 text-sm mb-4">
                  {product.creditsGold > 0 && <p className="text-yellow-600">{product.creditsGold} crediti Gold</p>}
                  {product.creditsSilver > 0 && <p className="text-gray-600">{product.creditsSilver} crediti Silver</p>}
                  {product.creditsBronze > 0 && <p className="text-orange-600">{product.creditsBronze} crediti Bronze</p>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">€{parseFloat(product.price).toFixed(2)}</span>
                  <Link
                    href={`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${process.env.NEXT_PUBLIC_PAYPAL_EMAIL}&item_number=${product.id}&amount=${product.price}&currency_code=EUR&custom=${user.id}&return=${process.env.NEXT_PUBLIC_APP_URL}/pagamenti&notify_url=${process.env.NEXT_PUBLIC_API_URL}/payments/ipn`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    Acquista
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div>
        <h2 className="mb-4">Storico pagamenti</h2>
        {!payments?.length ? (
          <div className="card p-8 text-center text-gray-500">Nessun pagamento effettuato.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Prodotto</th>
                  <th className="px-4 py-3">Importo</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.product?.name}</td>
                    <td className="px-4 py-3">€{parseFloat(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-green-100 text-green-700">{p.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.timestamp).toLocaleDateString('it-IT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
