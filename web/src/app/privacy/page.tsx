import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

const SECTIONS = [
  {
    title: 'Titolare del Trattamento dei Dati',
    body: ['VedoCompro.it s.r.l.s. è il titolare del trattamento dei dati.'],
  },
  {
    title: 'Tipologie di Dati raccolti',
    body: [
      'Fra i Dati Personali raccolti da questa Applicazione, in modo autonomo o tramite terze parti, ci sono: Cookie e Dati di Utilizzo.',
      'Altri Dati Personali raccolti potrebbero essere indicati in altre sezioni di questa privacy policy o mediante testi informativi visualizzati contestualmente alla raccolta dei Dati stessi. I Dati Personali possono essere inseriti volontariamente dall’Utente, oppure raccolti in modo automatico durante l\'uso di questa Applicazione. L’eventuale utilizzo di Cookie - o di altri strumenti di tracciamento - da parte di questa Applicazione o dei titolari dei servizi terzi utilizzati da questa Applicazione, ove non diversamente precisato, ha la finalità di identificare l’Utente e registrare le relative preferenze per finalità strettamente legate all\'erogazione del servizio richiesto dall’Utente. Il mancato conferimento da parte dell’Utente di alcuni Dati Personali potrebbe impedire a questa Applicazione di erogare i propri servizi.',
      'L\'Utente si assume la responsabilità dei Dati Personali di terzi pubblicati o condivisi mediante questa Applicazione e garantisce di avere il diritto di comunicarli o diffonderli, liberando il Titolare da qualsiasi responsabilità verso terzi.',
    ],
  },
  {
    title: 'Modalità e luogo del trattamento dei Dati raccolti',
    body: [
      'Modalità di trattamento — Il Titolare tratta i Dati Personali degli Utenti adottando le opportune misure di sicurezza volte ad impedire l’accesso, la divulgazione, la modifica o la distruzione non autorizzate dei Dati Personali. Il trattamento viene effettuato mediante strumenti informatici e/o telematici, con modalità organizzative e con logiche strettamente correlate alle finalità indicate.',
      'Luogo — I Dati sono trattati presso le sedi operative del Titolare ed in ogni altro luogo in cui le parti coinvolte nel trattamento siano localizzate. Per ulteriori informazioni, contatta il Titolare.',
      'Tempi — I Dati sono trattati per il tempo necessario allo svolgimento del servizio richiesto dall’Utente, o richiesto dalle finalità descritte in questo documento, e l’Utente può sempre chiedere l’interruzione del Trattamento o la cancellazione dei Dati.',
    ],
  },
  {
    title: 'Finalità del Trattamento dei Dati raccolti',
    body: [
      'I Dati dell’Utente sono raccolti per consentire al Titolare di fornire i propri servizi, così come per le seguenti finalità: Statistica e Accesso agli account su servizi terzi.',
    ],
  },
  {
    title: 'Dettagli sul trattamento dei Dati Personali',
    body: ['I Dati Personali sono raccolti per le seguenti finalità ed utilizzando i seguenti servizi: Accesso agli account su servizi terzi, Statistica.'],
  },
  {
    title: 'Esercizio dei diritti da parte degli Utenti',
    body: [
      'I soggetti cui si riferiscono i Dati Personali hanno il diritto in qualunque momento di ottenere la conferma dell\'esistenza o meno degli stessi presso il Titolare del Trattamento, di conoscerne il contenuto e l\'origine, di verificarne l\'esattezza o chiederne l’integrazione, la cancellazione, l\'aggiornamento, la rettifica, nonché di opporsi in ogni caso, per motivi legittimi, al loro trattamento. Le richieste vanno rivolte al Titolare del Trattamento.',
    ],
  },
  {
    title: 'Modifiche a questa privacy policy',
    body: [
      'Il Titolare del Trattamento si riserva il diritto di apportare modifiche alla presente privacy policy in qualunque momento dandone pubblicità agli Utenti su questa pagina.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
      <h1 className="mb-8">Privacy Policy</h1>
      <div className="card p-6 sm:p-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed mb-3 last:mb-0">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
