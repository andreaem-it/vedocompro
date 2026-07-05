'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Server, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface SystemInfo {
  app: {
    nodeEnv: string;
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
  };
  upload: {
    jsonLimit: string;
    imageMaxSize: string;
    videoMaxSize: string;
  };
  services: Record<string, boolean | string>;
}

function Status({ value }: { value: boolean }) {
  return value ? (
    <span className="badge bg-green-100 text-green-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> OK</span>
  ) : (
    <span className="badge bg-red-100 text-red-700 inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Mancante</span>
  );
}

export default function AdminSystemPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-system'],
    queryFn: () => adminApi.getSystemInfo().then((r) => r.data as SystemInfo),
  });

  return (
    <div className="p-8">
      <h1 className="flex items-center gap-2 mb-6"><Server className="w-6 h-6 text-brand" /> Sistema</h1>

      {isLoading ? (
        <div className="card p-8 text-gray-400">Caricamento...</div>
      ) : data ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="admin-box">
            <div className="admin-box-header"><h2 className="admin-box-title">Applicazione</h2></div>
            <div className="admin-box-body text-sm space-y-3">
              <p><span className="text-gray-500">Ambiente:</span> {data.app.nodeEnv}</p>
              <p><span className="text-gray-500">Node:</span> {data.app.nodeVersion}</p>
              <p><span className="text-gray-500">Piattaforma:</span> {data.app.platform}</p>
              <p><span className="text-gray-500">Uptime:</span> {Math.floor(data.app.uptimeSeconds / 60)} minuti</p>
            </div>
          </div>

          <div className="admin-box">
            <div className="admin-box-header"><h2 className="admin-box-title">Upload</h2></div>
            <div className="admin-box-body text-sm space-y-3">
              <p><span className="text-gray-500">JSON:</span> {data.upload.jsonLimit}</p>
              <p><span className="text-gray-500">Immagini:</span> {data.upload.imageMaxSize}</p>
              <p><span className="text-gray-500">Video:</span> {data.upload.videoMaxSize}</p>
            </div>
          </div>

          <div className="admin-box lg:col-span-2">
            <div className="admin-box-header"><h2 className="admin-box-title">Servizi</h2></div>
            <div className="admin-box-body">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {Object.entries(data.services).map(([key, value]) => (
                    <tr key={key}>
                      <td className="py-3 font-medium">{key}</td>
                      <td className="py-3 text-right">
                        {typeof value === 'boolean' ? <Status value={value} /> : <span className="text-gray-500">{String(value).slice(0, 120)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
