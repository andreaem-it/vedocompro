'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';

type AdminExportButtonProps = {
  endpoint: string;
  filename: string;
  params?: Record<string, string>;
  label?: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminExportButton({ endpoint, filename, params, label = 'Esporta CSV' }: AdminExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const onExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.get(endpoint, { params, responseType: 'blob' });
      downloadBlob(new Blob([res.data], { type: 'text/csv;charset=utf-8' }), filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button type="button" onClick={onExport} disabled={isExporting} className="btn-secondary text-sm inline-flex items-center gap-2">
      <Download className="w-4 h-4" />
      {isExporting ? 'Export...' : label}
    </button>
  );
}
