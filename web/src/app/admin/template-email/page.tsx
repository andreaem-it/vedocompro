'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Send, Trash2, X } from 'lucide-react';
import { adminApi, adminMailApi } from '@/lib/api';
import { AdminDefaultMail } from '@/types';

interface FormState {
  id: number | null;
  title: string;
  type: string;
  message: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: '',
  type: '',
  message: '',
};

function previewText(html: string): string {
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > 100 ? `${stripped.slice(0, 100)}…` : stripped;
}

export default function AdminTemplateEmailPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [sendForm, setSendForm] = useState({
    mode: 'email' as 'email' | 'internal',
    templateId: '',
    subject: '',
    message: '',
    from: 'VedoCompro <noreply@vedocompro.it>',
    q: '',
    userIds: [] as number[],
  });
  const [sendMsg, setSendMsg] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-mail-templates'],
    queryFn: () => adminMailApi.list().then((r) => r.data as AdminDefaultMail[]),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-mail-users', sendForm.q],
    queryFn: () => adminApi.listUsers({ q: sendForm.q, limit: '20' }).then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-mail-templates'] });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      adminMailApi.create({
        title: form.title,
        message: form.message,
        type: parseInt(form.type, 10),
      }),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) =>
      adminMailApi.update(id, {
        title: form.title,
        message: form.message,
        type: parseInt(form.type, 10),
      }),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminMailApi.delete(id),
    onSuccess: invalidate,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      adminMailApi.send({
        mode: sendForm.mode,
        userIds: sendForm.userIds,
        templateId: sendForm.templateId ? parseInt(sendForm.templateId, 10) : null,
        subject: sendForm.subject,
        message: sendForm.message,
        from: sendForm.from,
      }),
    onSuccess: (res) => {
      setSendMsg(`Invio completato: ${res.data.sent} destinatari raggiunti.`);
      setSendForm((current) => ({ ...current, userIds: [], subject: '', message: '' }));
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setSendMsg(err.response?.data?.error ?? 'Invio non riuscito.');
    },
  });

  const startEdit = (t: AdminDefaultMail) => {
    setForm({
      id: t.id,
      title: t.title,
      type: String(t.type),
      message: t.message,
    });
    setShowForm(true);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id) {
      updateMutation.mutate(form.id);
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const users = usersData?.users ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1>Template email</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuovo template
        </button>
      </div>

      <div className="card p-5 mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold">Invia comunicazione</h2>
        </div>
        {sendMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm border ${sendMsg.includes('completato') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {sendMsg}
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Tipo invio</label>
            <select value={sendForm.mode} onChange={(e) => setSendForm((f) => ({ ...f, mode: e.target.value as 'email' | 'internal' }))} className="input">
              <option value="email">Email</option>
              <option value="internal">Messaggio interno</option>
            </select>
          </div>
          <div>
            <label className="label">Template opzionale</label>
            <select value={sendForm.templateId} onChange={(e) => setSendForm((f) => ({ ...f, templateId: e.target.value }))} className="input">
              <option value="">Non usare template</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>{template.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mittente email</label>
            <select value={sendForm.from} onChange={(e) => setSendForm((f) => ({ ...f, from: e.target.value }))} className="input" disabled={sendForm.mode === 'internal'}>
              <option value="VedoCompro <noreply@vedocompro.it>">no-reply@vedocompro.it</option>
              <option value="VedoCompro Admin <admin@vedocompro.it>">admin@vedocompro.it</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Cerca destinatari</label>
          <input
            value={sendForm.q}
            onChange={(e) => setSendForm((f) => ({ ...f, q: e.target.value }))}
            className="input"
            placeholder="Cerca per email o username"
          />
          <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {users.map((user: { id: number; username: string; email: string }) => {
              const checked = sendForm.userIds.includes(user.id);
              return (
                <label key={user.id} className="flex items-center gap-2 border rounded px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setSendForm((f) => ({
                      ...f,
                      userIds: e.target.checked
                        ? [...f.userIds, user.id]
                        : f.userIds.filter((id) => id !== user.id),
                    }))}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">@{user.username}</span>
                    <span className="block text-gray-500 truncate">{user.email}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Oggetto</label>
          <input
            value={sendForm.subject}
            onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
            className="input"
            disabled={!!sendForm.templateId}
            placeholder={sendForm.templateId ? 'Usato dal template' : 'Oggetto email'}
          />
        </div>

        <div>
          <label className="label">Messaggio</label>
          <textarea
            value={sendForm.message}
            onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
            className="input min-h-32"
            disabled={!!sendForm.templateId}
            placeholder={sendForm.templateId ? 'Usato dal template' : 'Puoi usare {{username}}, {{name}}, {{email}}'}
          />
        </div>

        <button
          type="button"
          onClick={() => { setSendMsg(''); sendMutation.mutate(); }}
          className="btn-primary"
          disabled={sendMutation.isPending || sendForm.userIds.length === 0}
        >
          <Send className="w-4 h-4" /> {sendMutation.isPending ? 'Invio...' : `Invia a ${sendForm.userIds.length} destinatari`}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>{form.id ? 'Modifica template email' : 'Nuovo template email'}</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Titolo (oggetto email)</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <input
                required
                type="number"
                step="1"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 = rifiuto annuncio, 2 = approvazione annuncio, altri valori liberi
              </p>
            </div>
          </div>

          <div>
            <label className="label">Messaggio (HTML)</label>
            <textarea
              required
              rows={12}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="input font-mono text-xs"
              placeholder="<h2>Ciao!</h2><p>Il tuo annuncio {{adTitle}} ...</p>"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puoi usare i placeholder <code>{'{{adTitle}}'}</code> e <code>{'{{adId}}'}</code> (sostituiti automaticamente quando disponibili).
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving}>
            {form.id ? 'Salva modifiche' : 'Crea template'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Titolo</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Anteprima messaggio</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !templates?.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nessun template email</td></tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand/10 text-brand">{t.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{previewText(t.message)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        title="Modifica"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare il template "${t.title}"?`)) deleteMutation.mutate(t.id);
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
