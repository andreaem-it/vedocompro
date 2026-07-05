import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termini di Servizio',
};

const SECTIONS = [
  {
    title: '1. Contenuto del Servizio',
    body: 'VedoCompro.it S.r.l.s., società di servizi informatici e telematici, mette a disposizione degli utenti che intendano avvalersene un servizio web based (il "Servizio") che consente di pubblicare e consultare annunci e inserzioni di soggetti privati che intendano alienare o acquistare beni o prestare e ricevere servizi. Il Servizio consente altresì agli inserzionisti ed agli utenti interessati a quanto pubblicato di entrare in contatto tra di loro.',
  },
  {
    title: '2. Titolarità della piattaforma',
    body: 'VedoCompro S.r.l.s. è l\'unica titolare della piattaforma web per il tramite della quale viene gestito il Servizio, nonché di tutti i relativi diritti inerenti e conseguenti allo sfruttamento della piattaforma medesima.',
  },
  {
    title: '3. Applicabilità delle condizioni',
    body: 'Le presenti Condizioni Generali di Servizio si applicano sia agli utenti che utilizzino il Servizio in consultazione degli annunci pubblicati sia agli utenti inserzionisti (collettivamente "utente/i").',
  },
  {
    title: '4. Termini per l\'uso del Servizio',
    body: 'L\'utilizzo del Servizio è consentito solo ad utenti maggiorenni secondo la legge italiana. L\'utilizzo del Servizio è gratuito e consente la libera consultazione degli annunci, la pubblicazione di inserzioni e la creazione di utenze. Talune funzionalità specifiche, l\'inserzione in specifiche categorie merceologiche e le inserzioni ulteriori rispetto alle soglie fissate per talune categorie potranno essere messe a disposizione solo a pagamento. Le relazioni tra gli utenti del Servizio, incluso l\'acquisto, lo scambio di informazioni, la consegna o il pagamento di beni o servizi, avvengono esclusivamente tra utenti senza che VedoCompro S.r.l.s. sia parte della relazione.',
  },
  {
    title: '5. Responsabilità dell\'utente',
    body: 'L\'utente è totalmente ed esclusivamente responsabile dell\'uso del Servizio ed è l\'unico garante e responsabile dei beni e dei servizi offerti, nonché della correttezza, completezza e liceità delle inserzioni. L\'utente garantisce la disponibilità e/o la titolarità del bene/servizio oggetto delle inserzioni e che i propri annunci non violano diritti di terzi.',
  },
  {
    title: '6. Limitazione di responsabilità',
    body: 'VedoCompro S.r.l.s. non presta alcuna garanzia circa il contenuto, la completezza e la correttezza delle inserzioni pubblicate. Si riserva, in qualsiasi momento, il diritto di valutare, approvare, eliminare o impedire l\'inserzione di annunci a proprio insindacabile giudizio. VedoCompro S.r.l.s. è estranea alle trattative nascenti dall\'uso del Servizio.',
  },
  {
    title: '7. Limitazioni nell\'erogazione del Servizio',
    body: 'VedoCompro S.r.l.s. si riserva il diritto di modificare, sospendere o interrompere, in tutto o in parte, il Servizio in qualsiasi momento anche senza preavviso.',
  },
  {
    title: '8. Pubblicazione seriale di annunci e/o per conto terzi',
    body: 'È espressamente vietato, salvo autorizzazione di VedoCompro S.r.l.s.: l\'utilizzo di sistemi automatici di caricamento annunci non autorizzati; la pubblicazione seriale e/o la gestione di annunci per conto terzi; rivendere a terzi i servizi di VedoCompro S.r.l.s.',
  },
  {
    title: '9. Limitazioni al contenuto delle pubblicazioni',
    body: 'L\'utente si impegna a non falsificare la propria identità e a non utilizzare il Servizio per la pubblicazione di materiale illecito, volgare, osceno, calunnioso, diffamatorio o lesivo dei diritti altrui.',
  },
  {
    title: '10. Giurisdizione, legge applicabile e foro competente',
    body: 'I rapporti tra VedoCompro S.r.l.s. e gli utenti sono regolati dalla legge e dalla giurisdizione italiana. Salvo quanto disposto da norme di legge non derogabili, il Tribunale di Perugia sarà competente in via esclusiva a dirimere ogni controversia.',
  },
  {
    title: '11. Modifiche',
    body: 'Le presenti condizioni potrebbero essere soggette a modifiche. In caso di modifiche sostanziali, VedoCompro S.r.l.s. avviserà l\'utente pubblicandole con la massima evidenza sulle proprie pagine o tramite email.',
  },
];

export default function TerminiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
      <h1 className="mb-8">Termini di Servizio</h1>
      <div className="card p-6 sm:p-8 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold mb-2">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
          </section>
        ))}
        <p className="text-xs text-gray-400 pt-4 border-t">
          VedoCompro S.r.l.s. — Sede legale: (...) · Codice Fiscale/Partita IVA/Registro Imprese di Perugia: (...) · R.E.A. Perugia n° (...)
        </p>
      </div>
    </div>
  );
}
