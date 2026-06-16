'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import clsx from 'clsx';

export default function AdminHelpDeskPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-helpdesk'],
    queryFn: () => adminApi.listHelpDesk().then((r) => r.data),
  });

  return (
    <div className="p-8">
      <h1 className="mb-6">Help Desk</h1>

      {isLoading ? (
        <div className="text-gray-400">Caricamento...</div>
      ) : !data?.length ? (
        <div className="card p-12 text-center text-gray-500">Nessun ticket aperto.</div>
      ) : (
        <div className="space-y-3">
          {data.map((ticket: any) => (
            <div key={ticket.id} className="card p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-medium">{ticket.title}</h3>
                  <span className={clsx('badge', ticket.closed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700')}>
                    {ticket.closed ? 'Chiuso' : 'Aperto'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{ticket.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Da {ticket.user?.username} ({ticket.user?.email}) — {new Date(ticket.timest).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
