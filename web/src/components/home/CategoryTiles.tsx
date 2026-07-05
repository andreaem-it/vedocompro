'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Car, Home, Briefcase, Laptop, Sofa, Dumbbell, ShoppingBag, type LucideIcon } from 'lucide-react';
import { lookupApi } from '@/lib/api';
import { Category } from '@/types';

// Icona rappresentativa per ciascuna delle 6 categorie padre reali (vedi api/prisma/seed.ts CATEGORY_TREE).
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Motori': Car,
  'Immobili': Home,
  'Lavoro e Servizi': Briefcase,
  'Tecnologia': Laptop,
  'Per la Casa e la Persona': Sofa,
  'Sport e Hobby': Dumbbell,
};

function getIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? ShoppingBag;
}

export default function CategoryTiles() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then((r) => r.data as Category[]),
  });

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center mb-2">Categorie</h2>
        <p className="text-center text-gray-600 mb-10">Vendi e acquista nelle nostre categorie</p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card aspect-square animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map((category) => {
              const Icon = getIcon(category.name);
              return (
                <Link
                  key={category.id}
                  href={`/annunci?category=${category.id}`}
                  className="card group flex flex-col items-center justify-center gap-3 aspect-square p-4 text-center bg-brand text-white hover:bg-brand-dark transition-colors"
                >
                  <Icon className="w-9 h-9 sm:w-10 sm:h-10 text-white/90 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm sm:text-base leading-tight">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
