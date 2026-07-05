'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { shopApi } from '@/lib/api';
import { ShopProduct } from '@/types';
import { ChevronLeft, ChevronRight, Truck, ShoppingCart, ArrowLeft, Tag } from 'lucide-react';

function ProductGallery({ pics, name }: { pics: string[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (!pics || pics.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center text-gray-400 mb-6">
        <p>Nessuna immagine disponibile</p>
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + pics.length) % pics.length);
  const next = () => setIndex((i) => (i + 1) % pics.length);

  return (
    <div className="mb-6">
      <div className="relative card h-80 overflow-hidden">
        <Image src={pics[index]} alt={`${name} - foto ${index + 1}`} fill className="object-contain" />
        {pics.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
              {index + 1} / {pics.length}
            </div>
          </>
        )}
      </div>
      {pics.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto py-1">
          {pics.map((pic, i) => (
            <button
              key={pic}
              onClick={() => setIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${i === index ? 'border-brand' : 'border-transparent'}`}
            >
              <Image src={pic} alt={`Miniatura ${i + 1}`} width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopProductPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);

  const { data: product, isLoading } = useQuery({
    queryKey: ['shop-product', id],
    queryFn: () => shopApi.getProductById(id).then((r) => r.data as ShopProduct),
    enabled: !Number.isNaN(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-80 bg-gray-200 rounded-xl mb-6" />
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        <p className="text-xl mb-2">Prodotto non trovato</p>
        <Link href="/shop" className="text-brand hover:underline">Torna al catalogo</Link>
      </div>
    );
  }

  const lastUnit = product.inStock !== null && product.inStock < 5;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand mb-4">
        <ArrowLeft className="w-4 h-4" /> Torna al catalogo
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ProductGallery pics={product.pics} name={product.name} />

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1>{product.name}</h1>
            <p className="text-3xl font-bold text-brand whitespace-nowrap">
              €{parseFloat(product.price).toLocaleString('it-IT')}
            </p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {product.categories.map((cat) => (
              <span key={cat.id} className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {cat.name}
              </span>
            ))}
            {lastUnit && (
              <span className="badge bg-red-100 text-red-700">
                {product.inStock === 0 ? 'Esaurito' : 'Ultimo rimasto'}
              </span>
            )}
          </div>

          <div className="card p-6 mb-6">
            <h2 className="mb-3">Descrizione</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>

          {/* Spedizione: replica la tab "Spedizione" del template legacy item.html.twig */}
          <div className="card p-6 mb-6">
            <h2 className="mb-1 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand" /> Spedizione
            </h2>
            <p className="text-sm text-gray-500 mb-4">Metodi di spedizione disponibili per questo prodotto.</p>
            {product.shipmentServices?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500 border-b">
                    <tr>
                      <th className="py-2 pr-4">Corriere</th>
                      <th className="py-2 pr-4">Tempo di spedizione</th>
                      <th className="py-2 text-right">Prezzo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {product.shipmentServices.map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 pr-4 font-medium flex items-center gap-2">
                          {s.serviceLogo && (
                            <Image src={s.serviceLogo} alt={s.serviceName} width={32} height={32} className="rounded object-contain" />
                          )}
                          {s.serviceName}
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{s.expectedDelivery} giorni</td>
                        <td className="py-3 text-right font-semibold text-brand">
                          €{parseFloat(s.basePrice).toLocaleString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessun metodo di spedizione disponibile per questo prodotto.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="card p-5 sticky top-20">
            <p className="text-sm text-gray-500 mb-4">
              {product.inStock !== null
                ? product.inStock > 0
                  ? `Disponibilità: ${product.inStock} pz`
                  : 'Prodotto esaurito'
                : 'Disponibilità illimitata'}
            </p>
            <div
              className="relative group"
              title="Prossimamente"
            >
              <button disabled className="btn-primary w-full justify-center opacity-50 cursor-not-allowed">
                <ShoppingCart className="w-4 h-4" /> Aggiungi al carrello
              </button>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full hidden group-hover:block text-xs bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                Prossimamente
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
