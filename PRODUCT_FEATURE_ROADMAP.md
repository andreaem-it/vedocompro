# Roadmap marketplace VedoCompro

Documento operativo per tenere separato il porting Symfony -> React/Node dalla prossima fase
di prodotto. Il rilancio viene trattato come marketplace utente-utente: annunci, contatto,
fiducia, ordini tra privati/professionisti e strumenti admin. Il modulo Shop resta dormiente.

## Scelta prodotto

- [x] **Shop disattivato per il rilancio** — il catalogo prodotti separato era un esperimento
      legacy. Per ora il focus torna sul marketplace utente-utente; il codice resta nel repo
      dietro feature flag (`SHOP_ENABLED` API, `NEXT_PUBLIC_SHOP_ENABLED` web), spento di
      default.
- [ ] **Marketplace transazionale leggero** — trasformare "annuncio + messaggio" in flusso
      ordinabile quando il venditore lo permette, senza costruire un e-commerce classico.
      Aggiornamento 2026-07-05: aggiunte preferenze pagamento venditore sul profilo
      (`paymentMethods`, istruzioni, PayPal, IBAN, intestatario) e mostrate al compratore
      nei propri ordini. Questo completa il ponte operativo per pagamenti manuali
      utente-utente; il provider checkout/webhook resta voce P0 separata.

## P0 — Fondamenta per un marketplace funzionante

- [x] **Checkout ordine annuncio end-to-end** — completato il 2026-07-05 con **Stripe
      Checkout** (sandbox autorizzata dall'utente): bottone "Paga con carta" negli ordini
      del compratore, sessione con totale congelato sull'ordine, webhook firmato con log
      persistente + conferma idempotente sul redirect (funziona anche senza webhook in
      dev), ordine → `paid` con notifiche in-app ed email a entrambe le parti. Modello
      merchant-of-record: l'incasso arriva alla piattaforma, il girofondi al venditore è
      operativo (riconciliazione admin). Evoluzione futura: Stripe Connect per split
      automatici. In produzione servono `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + endpoint webhook in dashboard.
      Aggiornamento 2026-07-04: aggiunta ricevuta/pro-memoria ordine stampabile da
      `/profilo/acquisti-vendite` per compratore e venditore. Resta da collegare il
      pagamento reale e la ricevuta fiscale/transazionale.
      Aggiornamento 2026-07-04: aggiunti riepilogo conteggi e filtri stato nello storico
      ordini (`tutti`, `da gestire`, `in corso`, `chiusi`, `contestati`) per compratori e
      venditori.
      Aggiornamento 2026-07-04: aggiunta riconciliazione admin dei pagamenti ordine in
      `/admin/ordini`: stato pagamento, provider, riferimento transazione, nota interna e
      storico audit per ordine. Resta da collegare provider checkout/webhook reale.
      Aggiornamento 2026-07-05: aggiunta dichiarazione pagamento lato compratore da
      `/profilo/acquisti-vendite` (`POST /users/me/orders/:id/payment`): l'ordine passa a
      pagamento `pending`, salva metodo/riferimento e avvisa il venditore. Il controllo
      finale resta alla riconciliazione admin; checkout provider/webhook reale ancora aperto.
      Aggiornamento 2026-07-05: il compratore ora vede negli ordini le istruzioni pagamento
      configurate dal venditore, così il flusso manuale non dipende solo dai messaggi.
      Aggiornamento 2026-07-05: aggiunte email operative best-effort su nuovo ordine,
      dichiarazione pagamento e cambi stato ordine. Le notifiche in-app restano il canale
      primario; il checkout provider/webhook reale resta aperto.
- [x] **Stati ordine chiari** — fatto il 2026-07-04: gli ordini annuncio salvano stato ordine,
      stato pagamento, stato fulfillment, date operative e importi congelati al momento
      dell'ordine. Il pagamento reale resta da collegare.
      Aggiornamento 2026-07-04: aggiunta coda admin `/admin/ordini` con filtri per stato
      ordine, stato pagamento e dispute.
- [x] **Indirizzi e dati spedizione** — fatto il 2026-07-04: ordine con ritiro o spedizione,
      dati destinatario, costo spedizione, tracking strutturato e notifiche cambio stato.
- [ ] **Webhook pagamenti robusti** — idempotenza, log errori, verifica importi/valuta,
      riconciliazione pagamenti non completati.
      Aggiornamento 2026-07-04: IPN PayPal crediti irrigidito con validazione campi
      obbligatori, importo `Decimal`, receiver email configurata e guardia frontend se
      `NEXT_PUBLIC_PAYPAL_EMAIL` manca.
      Aggiornamento 2026-07-04: aggiunto log persistente degli IPN PayPal crediti con stato
      evento (`received`, `processed`, `duplicate`, `invalid*`, `ignored_non_completed`,
      `error`) e vista admin in `/admin/pagamenti`. Resta da fare la riconciliazione ordini
      marketplace.
      Aggiornamento 2026-07-04: aggiunto model `OrderPaymentReconciliation` e endpoint
      `PUT /admin/orders/:id/payment` per riconciliazione manuale auditata degli ordini
      marketplace. Resta da fare webhook automatico del provider pagamenti ordini.
      Aggiornamento 2026-07-05: collegato il primo ponte utente->admin per ordini marketplace:
      il compratore segnala il pagamento inviato, il venditore vede provider/riferimento e
      l'admin può chiudere la riconciliazione dalla coda ordini. Resta il webhook automatico
      del provider pagamenti ordini.
      Aggiornamento 2026-07-05: il venditore riceve anche una email best-effort quando il
      compratore dichiara il pagamento, senza cambiare la riconciliazione manuale.
- [x] **Feedback legato a vendite reali** — fatto il 2026-07-04: feedback nuovo consentito
      solo su ordini completati tra compratore e venditore, un feedback per ordine, con badge
      "Acquisto verificato" nelle pagine profilo/feedback.

## P1 — Fiducia, sicurezza e moderazione

- [x] **Segnalazioni utenti e annunci** — fatto il 2026-07-04: motivi standard, segnalazione
      da profilo/annuncio, notifica agli admin, coda `/admin/segnalazioni`, esito con note e
      audit su risolta/archiviata.
- [x] **Dispute ordine** — fatto il 2026-07-04: contestazione su ordini accettati/spediti/
      completati (compratore o venditore), thread messaggi tra le parti + staff, decisione
      admin motivata (pro compratore / pro venditore / chiusa senza esito) con audit log,
      coda `/admin/dispute`, notifiche a controparte e admin. Le dispute perse dal venditore
      abbassano ora il trust score (-15 ciascuna, cap -30). Aggiornamento 2026-07-05:
      aggiunti allegati immagine ai messaggi della disputa, caricati su storage e visibili
      nel thread utente/admin. Aggiornamento 2026-07-05: **rimborso automatico Stripe** —
      la risoluzione pro-compratore di un ordine pagato con carta rimborsa il PaymentIntent
      (idempotente, opt-out con `refund:false`), porta il pagamento a `refunded`, logga la
      riconciliazione e avvisa le parti; esito visibile all'admin nella coda dispute. Il
      ciclo dispute è ora completo: apertura → prove → decisione → rimborso.
- [x] **Trust score venditore** — fatto il 2026-07-04: scheda pubblica nel profilo con score
      0-100, livello, feedback positivi, feedback verificati, vendite concluse, anzianità
      account, segnalazioni confermate e badge reputazione. Le dispute perse entreranno nel
      calcolo quando verrà implementato il modulo dispute.
- [x] **Anti-spam messaggi** — fatto il 2026-07-04: `antispam.service.ts` (DB-based, compatibile
      serverless): max 10 msg/minuto per tutti, stesso testo a max 3 destinatari/ora, account
      <7 giorni limitati a 30 msg/giorno e 5 nuovi destinatari/giorno; admin esenti. Aggiunta
      anche validazione input a `sendMessage` (destinatario esistente, no auto-messaggi).
      Aggiornamento 2026-07-05: aggiunto scoring conservativo parole/frasi sospette
      (`suspiciousMessageScore`) su link esterni, contatti fuori piattaforma, richieste di
      pagamento anticipato/ricariche/gift card/crypto, finti corrieri e urgenza. Blocca solo
      segnali forti o combinati per ridurre i falsi positivi.
- [x] **Verifiche account** — fatto il 2026-07-04: telefono verificato con codice
      temporaneo (`POST /users/me/phone/verification`, `POST /users/me/phone/verify`),
      reset automatico se il numero cambia, badge telefono/email su profilo pubblico,
      colonna verifiche in admin utenti e limiti messaggi progressivi per account appena
      creati (telefono verificato: soglie più alte). In produzione va collegato il provider
      SMS e disattivato `PHONE_VERIFICATION_DEV_MODE`.

## P1 — Esperienza compratore/venditore

- [x] **Offerte e trattativa** — fatto il 2026-07-04: model `AdOffer`, offerta dal dettaglio
      annuncio (solo sotto il prezzo richiesto, una attiva per annuncio, validità 7 giorni con
      scadenza lazy), venditore accetta/rifiuta/contropropone (una controproposta, tra offerta
      e prezzo pieno), compratore accetta/rifiuta/ritira; da offerta accettata il compratore
      completa l'ordine al prezzo congelato via `POST /ads/:id/order` con `offerId` (bypassa
      `canBeOrdered`: l'accettazione vale come consenso alla vendita). Pagina
      `/profilo/offerte` (tab Inviate/Ricevute), notifiche type 20/21.
- [x] **Salva ricerca e alert** — fatto il 2026-07-04: model `SavedSearch` (max 20 per
      utente, nome autogenerato dai filtri), bottone "Salva ricerca e avvisami" nella sidebar
      di `/annunci`, pagina `/profilo/ricerche-salvate` con frequenza configurabile
      (appena possibile / max una al giorno / in pausa), cron orario
      `GET /cron/saved-search-alerts` (batch 100, stessa semantica filtri di
      `adsService.list`) con notifica in-app type 24 che riapre la ricerca coi filtri
      salvati. Aggiornamento 2026-07-05: il cron invia anche una email best-effort quando
      `MAIL_HOST` e `MAIL_FROM` sono configurati, con conteggio match, primi annunci e link
      alla ricerca; la notifica in-app resta sempre il canale primario.
- [x] **Ricerca geolocalizzata** — fatto il 2026-07-04: sidebar `/annunci` con filtri
      Regione → Provincia → Comune, ordinamento "Più rilevanti" e ricerca "Vicino a me"
      con raggio 10/25/50/100/300 km. Backend `adsService.list` applica `location`,
      `nearLat`, `nearLng`, `radiusKm`, calcola la distanza Haversine su `Ad.mapCoords`
      quando disponibile e restituisce `distanceKm` sulle card. Nessun cambio schema: il
      dataset legacy dei comuni non contiene coordinate, quindi la distanza usa solo annunci
      con mappa configurata; i filtri amministrativi restano testuali/strutturati.
- [x] **Filtri categoria-specifici reali** — fatto il 2026-07-04: model `AdvancedField`
      esteso (tipo select/testo/numero, opzioni, filtrabile, obbligatorio, ordinamento),
      pagina admin `/admin/categorie/[id]/campi` per configurarli, campi mostrati nel form
      annuncio a TUTTI i venditori con validazione server (`resolveAdFields`), filtri
      dinamici nella sidebar di ricerca applicati realmente alla query via
      `Ad.fieldPairs` + `?ff=Campo:Valore` (hasEvery). I campi custom liberi restano
      prerogativa Business. ⚠️ `prisma db push` richiesto (AdvancedField esteso +
      `Ad.fieldPairs`); gli annunci esistenti indicizzano i campi al primo re-edit.
- [x] **Dashboard venditore** — fatto il 2026-07-04: `GET /users/me/seller-stats` aggrega i
      contatori già presenti (views/callClicks/messageClicks su Ad) + ordini per stato,
      ricavi da ordini completati, offerte da gestire e conversione visite→vendite; pagina
      `/profilo/statistiche` con card riassuntive, alert ordini in attesa e tabella
      performance per annuncio (visite/chiamate/messaggi/preferiti/ordini/offerte). Aperta a
      tutti i venditori — la dashboard Business con andamento mensile resta separata.
      Nessun nuovo tracking scritto (zero cambi schema per questa voce).

## P2 — Crescita e operatività

- [x] **CRM leggero admin** — fatto il 2026-07-04: model `AdminUserNote`,
      endpoint admin `GET/POST/PUT /admin/users/:id/crm`, note interne per utente,
      tag rischio (`none/watch/risk/blocked/vip`), follow-up opzionale e chiusura nota
      con audit log. UI integrata in `/admin/utenti/[id]`. ⚠️ `prisma db push` richiesto.
- [x] **KPI marketplace** — fatto il 2026-07-04: `GET /admin/kpi?days=` con confronto
      periodo corrente/precedente (nuovi utenti, annunci pubblicati, ordini creati e
      completati, GMV, ricavi promozioni, messaggi, offerte, conversione ordini);
      `/admin/statistiche` con selettore 7/30/90/365 giorni e delta % per card.
- [x] **Report performance promozioni** — fatto il 2026-07-04: endpoint admin
      `GET /admin/promotions` e pagina `/admin/promozioni` con promozioni attive/scadute,
      livelli Gold/Silver/Bronze, scadenze entro 72 ore e performance per annuncio
      (visite, click telefono, messaggi, preferiti, ordini, offerte). Read-only, nessun
      cambio schema.
- [x] **Promozioni più granulari** — fatto il 2026-07-04: nuovi model
      `PromotionPackage` e `PromotionActivation` per pacchetti configurabili e storico
      attivazioni. Endpoint pubblici/admin: `GET /ads/promotion-packages`,
      `GET/POST/PUT/DELETE /admin/promotions/packages`; `POST /ads/:id/promote` ora usa
      `packageKey`, scala il costo crediti configurato, estende la scadenza e registra
      snapshot campagna (`packageKey`, nome, livello, crediti spesi, prezzo EUR, date).
      UI: `/annunci/[id]/promuovi` legge i pacchetti attivi; `/admin/promozioni` ha tab
      "Pacchetti" per configurazione e KPI ultimi 30 giorni su attivazioni, ricavo stimato
      e crediti spesi. Il flag rinnovo automatico è salvato a catalogo, ma l'esecuzione
      ricorrente resta futura. ⚠️ `prisma db push` richiesto.
- [x] **Export admin CSV** — fatto il 2026-07-04: endpoint protetti admin
      `GET /admin/export/users`, `GET /admin/export/ads`, `GET /admin/export/payments`
      con CSV UTF-8, escaping anti formula injection, limite 10.000 righe e filtri coerenti
      con le liste admin quando presenti. Pulsante "Esporta CSV" aggiunto a utenti, annunci
      e pagamenti.
- [x] **Import admin CSV** — fatto il 2026-07-04: endpoint admin
      `POST /admin/import/:entity/dry-run` (`users`, `ads`, `payments`) con parser CSV,
      limite 1000 righe, validazione intestazioni, duplicati, riferimenti DB, importi,
      email e stati base. Nuova pagina `/admin/import` con upload/incolla CSV, esempi,
      riepilogo righe pronte/con avvisi/con errori e dettagli riga-per-riga. Decisione:
      dry-run puro, nessuna scrittura e nessun cambio schema; l'import applicativo reale
      dovrà essere autorizzato separatamente con audit log obbligatorio.
- [ ] **Impersonazione admin blindata** — solo se autorizzata esplicitamente: super-admin,
      audit obbligatorio, banner sessione impersonata e scadenza breve.
