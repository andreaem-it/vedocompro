import Link from 'next/link';
import { Gift, MessageSquare, Share2, UserPlus } from 'lucide-react';

const STEPS = [
  { icon: Share2, title: 'Condividi VedoCompro', body: 'Invita amici, colleghi o clienti a scoprire il marketplace.' },
  { icon: UserPlus, title: 'Loro si registrano', body: 'Il nuovo utente crea il proprio account e inizia a usare la piattaforma.' },
  { icon: Gift, title: 'Richiedi il riconoscimento', body: 'Contatta l’assistenza indicando chi hai invitato: il team controllerà la segnalazione.' },
];

export default function BringFriendPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6">
      <div className="text-center mb-10">
        <Gift className="w-12 h-12 text-brand mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-3">Porta un amico</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Aiutaci a far crescere la community VedoCompro. Invita persone interessate a comprare e vendere con annunci video.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6 text-center">
            <div className="w-11 h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <p className="text-sm text-gray-500">{body}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Hai già qualcuno da segnalare?</h2>
          <p className="text-sm text-gray-500">Apri un ticket e indica nome utente o email della persona invitata.</p>
        </div>
        <Link href="/profilo/helpdesk" className="btn-primary">
          <MessageSquare className="w-4 h-4" /> Contatta supporto
        </Link>
      </div>
    </div>
  );
}
