import { notFound } from 'next/navigation';
import { shopEnabled } from '@/config/features';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  if (!shopEnabled) notFound();

  return <>{children}</>;
}
