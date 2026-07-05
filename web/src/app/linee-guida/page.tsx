import { CheckCircle2, Share2, Sun, Video } from 'lucide-react';

const TIPS = [
  {
    icon: Sun,
    title: 'Gira il video di giorno',
    body: 'Una buona luce è importante per la riuscita del video. Se puoi, porta l’oggetto all’esterno nelle ore centrali della giornata; in casa usa una lampada che illumini bene i dettagli.',
  },
  {
    icon: CheckCircle2,
    title: 'Spiega le peculiarità del tuo oggetto',
    body: 'Descrivi pregi, difetti e caratteristiche come in una piccola pubblicità. Evita dialetti, parolacce o contenuti non adatti: aiutano poco chi compra e possono bloccare la moderazione.',
  },
  {
    icon: Video,
    title: 'Gira il video in orizzontale',
    body: 'Il formato orizzontale mostra meglio il prodotto e rende la visione più comoda. Evita formati strani o video verticali quando devi far vedere bene l’oggetto.',
  },
  {
    icon: Video,
    title: 'Evita video troppo lunghi',
    body: 'Un video troppo lungo stanca, uno troppo corto lascia dubbi. Un minuto o un minuto e mezzo di solito basta per mantenere l’attenzione e mostrare i dettagli decisivi.',
  },
  {
    icon: Share2,
    title: 'Condividi',
    body: 'Condividere l’annuncio su gruppi e social pertinenti può aumentare molto la visibilità, soprattutto per prodotti di nicchia o categorie molto cercate.',
  },
];

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Consigli per un video di successo</h1>
        <p className="text-gray-500">Piccoli accorgimenti per creare un annuncio video più chiaro, credibile e facile da vendere.</p>
      </div>

      <div className="space-y-5">
        {TIPS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="card p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">{title}</h2>
              <p className="text-gray-600">{body}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
