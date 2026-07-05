'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { shopApi } from '@/lib/api';
import { ShopCategory, ShopProductListResponse } from '@/types';
import { ChevronLeft, ChevronRight, ChevronDown, Tag, ShoppingCart } from 'lucide-react';
import { Suspense, useState } from 'react';
import clsx from 'clsx';

function CategoryTreeItem({
  category,
  activeId,
  onSelect,
}: {
  category: ShopCategory;
  activeId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = (category.children?.length ?? 0) > 0;

  return (
    <div>
      <div className="flex items-center">
        <button
          onClick={() => onSelect(activeId === category.id ? null : category.id)}
          className={clsx(
            'flex-1 text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
            activeId === category.id ? 'bg-brand text-white' : 'hover:bg-gray-100 text-gray-700',
          )}
        >
          {category.name}
          {category._count?.products !== undefined && (
            <span className={clsx('ml-1 text-xs', activeId === category.id ? 'text-white/80' : 'text-gray-400')}>
              ({category._count.products})
            </span>
          )}
        </button>
        {hasChildren && (
          <button onClick={() => setOpen((o) => !o)} className="p-1 text-gray-400 hover:text-gray-600">
            <ChevronDown className={clsx('w-4 h-4 transition-transform', !open && '-rotate-90')} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="ml-3 pl-2 border-l border-gray-200 space-y-0.5 mt-0.5">
          {category.children!.map((child) => (
            <CategoryTreeItem key={child.id} category={child} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: ShopProductListResponse['products'][number] }) {
  return (
    <Link href={`/shop/${product.id}`} className="card overflow-hidden hover:shadow-md transition-shadow group block">
      <div className="relative h-48 bg-gray-100">
        {product.pics?.[0] ? (
          <Image src={product.pics[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Nessuna immagine
          </div>
        )}
        {product.inStock !== null && product.inStock < 5 && (
          <span className="absolute top-2 left-2 badge bg-red-100 text-red-700">
            {product.inStock === 0 ? 'Esaurito' : 'Ultimo rimasto'}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand transition-colors mb-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand">
            €{parseFloat(product.price).toLocaleString('it-IT')}
          </span>
          {product.categories?.[0] && (
            <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {product.categories[0].name}
            </span>
          )}
        </div>
        <button
          disabled
          title="Prossimamente"
          className="btn-secondary w-full justify-center mt-3 opacity-50 cursor-not-allowed pointer-events-none"
        >
          <ShoppingCart className="w-4 h-4" /> Aggiungi al carrello
        </button>
      </div>
    </Link>
  );
}

function ShopCatalog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('categoryId');
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const { data: categories } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: () => shopApi.getCategories().then((r) => r.data as ShopCategory[]),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shop-products', categoryId, page],
    queryFn: () =>
      shopApi
        .listProducts({ ...(categoryId ? { categoryId } : {}), page: String(page) })
        .then((r) => r.data as ShopProductListResponse),
  });

  const setCategory = (id: number | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id) next.set('categoryId', String(id));
    else next.delete('categoryId');
    next.delete('page');
    router.push(`/shop?${next.toString()}`);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(p));
    router.push(`/shop?${next.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1>
          Shop
          {data && <span className="text-gray-500 text-lg font-normal ml-2">({data.pagination.total.toLocaleString('it-IT')})</span>}
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Categories sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold uppercase text-sm tracking-wide text-gray-500 mb-4 pb-2 border-b">Categorie</h3>
            <div className="space-y-0.5">
              <button
                onClick={() => setCategory(null)}
                className={clsx(
                  'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                  !categoryId ? 'bg-brand text-white' : 'hover:bg-gray-100 text-gray-700',
                )}
              >
                Tutte le categorie
              </button>
              {categories?.map((cat) => (
                <CategoryTreeItem
                  key={cat.id}
                  category={cat}
                  activeId={categoryId ? parseInt(categoryId, 10) : null}
                  onSelect={setCategory}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.products.length ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl mb-2">Nessun prodotto trovato</p>
              <p className="text-sm">Prova a selezionare un&apos;altra categoria.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>

              {data.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Pagina {data.pagination.page} di {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.pages}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopCatalog />
    </Suspense>
  );
}
