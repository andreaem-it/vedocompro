# UX Refinement Audit

Audit operativo per rendere VedoCompro piu semplice da usare dopo il porting Symfony -> React.

## Obiettivo

Ridurre la sensazione di prodotto "pieno ma difficile": ogni pagina deve chiarire cosa si puo fare, quale azione conviene fare dopo e dove si trova il flusso corretto.

## Priorita globali

- **P0 - Orientamento**: rendere evidenti i 3 flussi principali: cerca, pubblica, gestisci acquisti/vendite.
- **P0 - Mobile**: filtri, profilo e azioni annuncio devono essere raggiungibili senza hover e senza sidebar desktop.
- **P1 - Fiducia**: spiegare in modo breve spedizione, pagamento, feedback, venditore Business e pezzo unico/stock.
- **P1 - Riduzione rumore**: raggruppare link profilo/admin per scopo, evitando griglie indifferenziate di card.
- **P2 - Coerenza copy**: usare sempre gli stessi nomi: `Compralo subito`, `Fai un'offerta`, `Acquisti e vendite`, `Profilo pubblico`.

## Mappa pagine

### Homepage `/`

- Problema: hero generico, non mostra subito la ricerca testuale e non spiega i percorsi principali.
- Migliorie: ricerca primaria nel hero, CTA "Pubblica" secondaria, mini percorsi "Compra", "Vendi", "Gestisci", categorie sotto.
- Aggiornamento 2026-07-06: aggiunta sezione marketplace con annunci reali (`FeaturedAdsSection`), ricerche rapide, link a ordinamenti utili e blocchi operativi "Compra vicino a te" / "Vendi in pochi passi". La home deve restare orientata al catalogo, non alla presentazione istituzionale.

### Lista annunci `/annunci`

- Problema: filtri solo desktop; su mobile si vede la lista ma non si capisce come restringere.
- Migliorie: pulsante filtri mobile, pannello collassabile, riepilogo filtri attivi, azzera filtri, empty state con azioni.

### Card annuncio

- Problema: mostra dati ma non dice chiaramente se si puo comprare subito, fare offerta, spedire, o se e pezzo unico.
- Migliorie: badge disponibilita/stock, `Compralo subito` quando attivo, prezzo e localita piu scansionabili.

### Dettaglio annuncio `/annunci/[id]`

- Stato: gia migliorato per proprietario/compratore e scheda Business.
- Prossimo: sticky summary mobile, maggiore evidenza sicurezza pagamento/ordine, layout immagini piu stabile su mobile.
- Aggiornamento 2026-07-06: aggiunto box informativo prima delle azioni con disponibilita, consegna, modalita acquisto e fiducia venditore. Riduce il bisogno di leggere tutta la descrizione prima di capire se l'annuncio e acquistabile.
- Aggiornamento 2026-07-06: aggiunto riepilogo "A colpo d'occhio", box azioni piu guidato per compratore e barra mobile sticky con prezzo/disponibilita/azione principale. L'obiettivo e ridurre lo sforzo su mobile: prezzo e prossimo passo restano sempre raggiungibili.
- Aggiornamento 2026-07-06: le specifiche categoria dell'annuncio sono state accorpate nella card "Informazioni prodotto", evitando card sparse sotto il riepilogo media.
- Aggiornamento 2026-07-06: i controlli di condivisione sono stati spostati dalla testata alla sidebar profilo, liberando spazio per titolo e prezzo.
- Aggiornamento 2026-07-06: aggiunta navigazione di ritorno sopra il dettaglio annuncio con link ad annunci, categoria e localita.
- Aggiornamento 2026-07-06: migliorato il pannello proprietario con mini KPI/stato annuncio e corretto il placeholder media quando mancano sia foto sia video.
- Aggiornamento 2026-07-06: rifinita la sezione annunci simili con CTA alla categoria, griglia meno compressa e card piu leggibili.
- Aggiornamento 2026-07-06: riordinata la gerarchia delle azioni compratore, aggiunto promemoria sicurezza vicino a offerte/pagamento e spostati i segnali di fiducia disponibili nella sidebar venditore.
- Aggiornamento 2026-07-06: aggiunto il comando `Salva`/`Salvato` nel dettaglio annuncio per gestire i preferiti anche dalla pagina di decisione, non solo dalle card in lista.
- Aggiornamento 2026-07-06: rifinita la modale `Compralo subito` con sequenza ordine/pagamento/stato, scelta ritiro/spedizione piu chiara, riepilogo prodotti/spedizione/totale e validazione dei dati spedizione prima del pagamento.
- Aggiornamento 2026-07-06: rifinita la modale `Fai un'offerta` con prezzo richiesto in evidenza, importi suggeriti, controllo che l'offerta sia inferiore al prezzo e riepilogo del flusso venditore/validita/ordine.
- Aggiornamento 2026-07-06: spostata la segnalazione da form inline a modale dedicata, cosi la griglia azioni resta stabile e il percorso di moderazione e piu chiaro.
- Aggiornamento 2026-07-06: aggiunti nella card informazioni prodotto data pubblicazione, ultimo aggiornamento e ID annuncio, utili per valutare affidabilita e riferimento nelle conversazioni.
- Aggiornamento 2026-07-06: rifinita la galleria foto con aspect ratio stabile, pulsante ingrandisci, modale immagine grande, controlli accessibili e alt basati sul titolo annuncio.

### Nuovo annuncio `/annunci/nuovo`

- Stato: wizard step-by-step introdotto.
- Prossimo: microcopy per foto/video e anteprima riepilogo prima della pubblicazione.

### Profilo `/profilo`

- Problema: molte card tutte uguali; non emerge cosa e urgente.
- Migliorie: raggruppare per "Vendere", "Comprare", "Account", mettere scorciatoie operative in alto.

### Acquisti e vendite `/profilo/acquisti-vendite`

- Stato: ricco ma denso.
- Prossimo: timeline ordine, prossima azione evidente, badge pagamento/spedizione piu leggibili.
- Aggiornamento 2026-07-06: aggiunta "Prossima azione" per compratore e venditore nelle card ordine, con badge stato ordine/pagamento colorati in modo coerente. Prossimo passo: timeline compatta dell'ordine.

### Messaggi `/messaggi`

- Prossimo: empty state, contesto annuncio nella conversazione, avvisi anti-truffa non invasivi.
- Aggiornamento 2026-07-06: aggiunto stato vuoto con CTA agli annunci, header conversazione con link all'annuncio quando disponibile, promemoria sicurezza anti-truffa e supporto al primo messaggio quando si arriva da un annuncio senza thread precedente.

### Business `/business` e `/business/dashboard`

- Stato: Business attivo va in dashboard; scheda azienda visibile sul prodotto.
- Prossimo: checklist setup aziendale: logo, sito, telefono, metodi pagamento, annunci con stock.

### Admin

- Prossimo: dashboard "cose da fare" prima delle tabelle: annunci da moderare, dispute aperte, pagamenti pending, import/export.

## Batch 2026-07-06

- [x] Homepage: ricerca primaria e percorsi principali.
- [x] Lista annunci: filtri mobile, riepilogo filtri, azzera filtri.
- [x] Card annuncio: badge compralo subito/stock/spedizione.
- [x] Profilo: raggruppamento link per compiti.
