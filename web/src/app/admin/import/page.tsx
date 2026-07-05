'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Upload, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

type ImportEntity = 'users' | 'ads' | 'payments';
type RowIssue = { line: number; field: string; message: string };
type RowResult = {
  line: number;
  status: 'ready' | 'warning' | 'error';
  errors: RowIssue[];
  warnings: RowIssue[];
};
type ImportResult = {
  entity: ImportEntity;
  summary: {
    totalRows: number;
    readyRows: number;
    warningRows: number;
    errorRows: number;
    truncated: boolean;
  };
  rows: RowResult[];
};

const ENTITY_OPTIONS: Array<{ value: ImportEntity; label: string; hint: string }> = [
  { value: 'users', label: 'Utenti', hint: 'Richiede almeno email, username, nome.' },
  { value: 'ads', label: 'Annunci', hint: 'Valida categoria, venditore, prezzo e località.' },
  { value: 'payments', label: 'Pagamenti', hint: 'Valida transazioni, utenti, prodotti e importi.' },
];

const EXAMPLES: Record<ImportEntity, string> = {
  users: 'email,username,nome,password,crediti_gold,crediti_silver,crediti_bronze\nutente@example.com,mrossi,Mario Rossi,,0,0,0',
  ads: 'titolo,categoria,venditore_id,prezzo,regione,provincia,comune,condizione,descrizione,pubblicato\nBicicletta città,Biciclette,1,120.00,Lombardia,Milano,Milano,good,Bici usata in buono stato,false',
  payments: 'transazione,utente_id,prodotto_id,importo,valuta,stato,email_pagamento\nPAYPAL-TXN-123,1,1,10.00,EUR,Completed,payer@example.com',
};

function statusBadge(status: RowResult['status']) {
  if (status === 'ready') return 'badge bg-green-100 text-green-700';
  if (status === 'warning') return 'badge bg-yellow-100 text-yellow-700';
  return 'badge bg-red-100 text-red-700';
}

export default function AdminImportPage() {
  const [entity, setEntity] = useState<ImportEntity>('users');
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeHint = useMemo(() => ENTITY_OPTIONS.find((option) => option.value === entity)?.hint, [entity]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
    setResult(null);
    setError('');
  };

  const runDryRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await adminApi.dryRunImport(entity, csv);
      setResult(response.data as ImportResult);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Validazione non riuscita');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setCsv(EXAMPLES[entity]);
    setResult(null);
    setError('');
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="mb-2">Import CSV</h1>
        <p className="text-gray-500">Validazione preventiva: controlla righe, duplicati e riferimenti senza scrivere nel database.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="card p-5 space-y-5">
          <div>
            <label className="label">Tipo import</label>
            <select
              value={entity}
              onChange={(event) => {
                setEntity(event.target.value as ImportEntity);
                setResult(null);
                setError('');
              }}
              className="input"
            >
              {ENTITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">{activeHint}</p>
          </div>

          <div>
            <label className="label">File CSV</label>
            <label className="btn-secondary w-full justify-center cursor-pointer">
              <Upload className="h-4 w-4" /> Carica file
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Contenuto CSV</label>
              <button type="button" onClick={loadExample} className="text-xs font-medium text-brand hover:underline">
                Usa esempio
              </button>
            </div>
            <textarea
              value={csv}
              onChange={(event) => {
                setCsv(event.target.value);
                setResult(null);
                setError('');
              }}
              rows={12}
              className="input font-mono text-xs"
              placeholder="Incolla qui il CSV esportato o preparato..."
            />
          </div>

          <button type="button" onClick={runDryRun} disabled={!csv.trim() || loading} className="btn-primary w-full justify-center">
            <FileText className="h-4 w-4" /> {loading ? 'Validazione...' : 'Esegui dry-run'}
          </button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="admin-small-box bg-blue-500">
                  <div className="inner"><h3>{result.summary.totalRows}</h3><p>Righe lette</p></div>
                </div>
                <div className="admin-small-box bg-green-500">
                  <div className="inner"><h3>{result.summary.readyRows}</h3><p>Pronte</p></div>
                </div>
                <div className="admin-small-box bg-yellow-500">
                  <div className="inner"><h3>{result.summary.warningRows}</h3><p>Con avvisi</p></div>
                </div>
                <div className="admin-small-box bg-red-500">
                  <div className="inner"><h3>{result.summary.errorRows}</h3><p>Con errori</p></div>
                </div>
              </div>

              {result.summary.truncated && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Sono state validate solo le prime 1000 righe dati.
                </div>
              )}

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Riga</th>
                      <th className="px-4 py-3">Stato</th>
                      <th className="px-4 py-3">Dettagli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.rows.map((row) => (
                      <tr key={row.line}>
                        <td className="px-4 py-3 font-mono text-xs">{row.line}</td>
                        <td className="px-4 py-3">
                          <span className={statusBadge(row.status)}>
                            {row.status === 'ready' ? 'Pronta' : row.status === 'warning' ? 'Avvisi' : 'Errore'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.errors.length === 0 && row.warnings.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CheckCircle2 className="h-4 w-4" /> Nessun problema rilevato
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {row.errors.map((issue) => (
                                <p key={`e-${issue.field}-${issue.message}`} className="flex items-start gap-1 text-red-700">
                                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                  <span><strong>{issue.field}</strong>: {issue.message}</span>
                                </p>
                              ))}
                              {row.warnings.map((issue) => (
                                <p key={`w-${issue.field}-${issue.message}`} className="flex items-start gap-1 text-yellow-700">
                                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                  <span><strong>{issue.field}</strong>: {issue.message}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-gray-500">
              <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-700">Carica un CSV per vedere il report.</p>
              <p className="mt-1 text-sm">Questa schermata non applica modifiche: serve solo a preparare un import sicuro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
