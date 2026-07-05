'use client';

import Link from 'next/link';
import { MessageSquare, Settings, UserRoundCog } from 'lucide-react';
import ReportButton from '@/components/reports/ReportButton';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  userId: number;
}

export default function UserProfileActions({ userId }: Props) {
  const { user: currentUser, isLoading } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  if (isLoading) {
    return <div className="w-32 h-10 rounded-lg bg-gray-100 animate-pulse" />;
  }

  if (isOwnProfile) {
    return (
      <div className="w-full sm:w-auto space-y-2">
        <div className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-sm font-medium text-brand">
          Profilo pubblico personale
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/profilo/impostazioni" className="btn-primary text-sm inline-flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Impostazioni
          </Link>
          <Link href="/profilo" className="btn-secondary text-sm inline-flex items-center justify-center gap-2">
            <UserRoundCog className="w-4 h-4" />
            Area profilo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-auto">
      <Link href={`/messaggi?to=${userId}`} className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto">
        <MessageSquare className="w-4 h-4" />
        Contatta
      </Link>
      <div className="mt-2">
        <ReportButton targetType="user" targetId={userId} />
      </div>
    </div>
  );
}
