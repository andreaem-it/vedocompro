'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, FolderTree, Truck, ShoppingBag } from 'lucide-react';
import { adminShopApi } from '@/lib/api';
import { ShopCategory, ShopProductListResponse, ShopShipment } from '@/types';

export default function AdminShopDashboard() {
  const { data: categories } = useQuery({
    queryKey: ['admin-shop-categories'],
    queryFn: () => adminShopApi.listCategories().then((r) => r.data as ShopCategory[]),
  });

  const { data: products } = useQuery({
    queryKey: ['admin-shop-products', 'count'],
    queryFn: () => adminShopApi.listProducts({ limit: '1' }).then((r) => r.data as ShopProductListResponse),
  });

  const { data: shipments } = useQuery({
    queryKey: ['admin-shop-shipments'],
    queryFn: () => adminShopApi.listShipments().then((r) => r.data as ShopShipment[]),
  });

  const cards = [
    { label: 'Prodotti', value: products?.pagination.total, icon: Package, color: 'bg-brand', href: '/admin/shop/prodotti' },
    { label: 'Categorie', value: categories?.length, icon: FolderTree, color: 'bg-blue-500', href: '/admin/shop/categorie' },
    {
      label: 'Spedizioni attive',
      value: shipments?.filter((s) => s.isActive).length,
      icon: Truck,
      color: 'bg-green-500',
      href: '/admin/shop/spedizioni',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="w-6 h-6 text-brand" />
        <h1>Dashboard Shop</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{value ?? '—'}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/admin/shop/prodotti" className="btn-secondary justify-center">Gestisci prodotti</Link>
        <Link href="/admin/shop/categorie" className="btn-secondary justify-center">Gestisci categorie</Link>
        <Link href="/admin/shop/spedizioni" className="btn-secondary justify-center">Gestisci spedizioni</Link>
      </div>
    </div>
  );
}
