# Backlog migrazione PHP → React/Node

Elenco delle funzionalità presenti nel progetto Symfony legacy (isolato in `legacy-symfony/`)
ma non ancora portate 1:1 nel nuovo stack React (`web/`) + Node/Express+Prisma (`api/`), più le
**regressioni funzionali** introdotte durante la migrazione (comportamenti che nel legacy
esistevano ed erano corretti, ma nel nuovo stack sono stati semplificati/persi).

Aggiornato il 2026-07-04: (1) separazione strutturale del progetto Symfony in
`legacy-symfony/` (prima era mescolato a livello di root e dentro `web/`), (2) analisi
approfondita di tutti i 17 controller, 28 entity, 3 command, 11 form e repository legacy,
confrontati riga per riga con `api/src` + `web/src`, (3) implementazione di tutti gli 8 item
P0 emersi dall'analisi, (4) chiusura di 2 item P1 (coupon admin, template email admin),
(5) porting visivo 1:1 dell'aspetto grafico legacy in due tornate (vedi sezione dedicata) —
il design Tailwind precedente usava un colore brand sbagliato (rosso invece del blu reale
`#4396c1`/`#236abd`) e una struttura che divergeva dai template Symfony; copertura ora
estesa a header/footer, pagina annuncio, homepage, ricerca, form annuncio, profilo,
messaggi, notifiche, business, shop, pannello admin (tema AdminLTE) e pagine statiche,
(6) completamento primo flusso Business reale: richiesta utente, approvazione admin,
attivazione account, dashboard statistiche e tracking visite/contatti.

Legenda priorità: **P0** blocca la parità funzionale core o introduce una regressione di
sicurezza/business, **P1** funzionalità di prodotto importante ma non bloccante, **P2**
nice-to-have / infrastruttura.

Legenda stato: 🔴 MANCANTE — 🟡 PARZIALE — 🟢 DONE (riportato solo per le voci con nuance).

## P0 — Core / Regressioni funzionali — ✅ tutti implementati il 2026-06-20

- [x] **Moderazione annunci bypassata** — fix: `ads.controller.ts` (`create`) ora forza
      `published=0` per gli utenti privati (e per i business salvo scelta esplicita di
      pubblicazione immediata), notifica+email a tutti gli admin alla creazione
      (`mail.service.ts: sendAdPendingReview`), `admin.controller.ts` (`updateAd`) invia
      notifica+email all'utente su approvazione/rifiuto (`sendAdApproved`/`sendAdRejected`,
      type 3/4). Chiuso anche il bypass laterale: `update()` ora filtra i campi modificabili
      da un utente non-admin (`USER_EDITABLE_FIELDS`), impedendo di auto-impostare
      `published` editando l'annuncio.
- [x] **Login non verifica l'attivazione account** — fix: `auth.service.ts` `register()`
      genera un token (riusa il campo `User.code` già presente nello schema, mai usato),
      crea l'utente con `isActive=false` e invia email di verifica
      (`mail.service.ts: sendVerifyEmail`); nuovo endpoint `GET /auth/verify/:code` →
      `verifyEmail()` attiva l'account; `login()` ora rifiuta `isActive=false` (403). Frontend:
      pagina registrazione non fa più auto-login, mostra "controlla la tua email"; nuova
      pagina `/verifica/[code]`.
- [x] **Flusso di acquisto/vendita (Buy/Sell) — mutation mancanti** — fix: nuovo endpoint
      `PUT /users/me/sells/:id` (`updateSell`) per shipped/paid/trackingCode, **con
      autorizzazione** (solo il venditore, a differenza del bug legacy), aggiorna
      `Ad.trackingCode`. Nuova pagina `web/src/app/profilo/acquisti-vendite/page.tsx` con
      tab Vendite/Acquisti/Ordini.
- [x] **Promozioni annunci: durate e logica sbagliate** — fix: `ads.controller.ts`
      (`promoteAd`) ora usa bronze +1gg/silver +3gg/gold +7gg, cumulativo con la data di
      scadenza esistente, imposta `showcase=1`. Nuovo `ads.service.ts: expirePromotions()`
      (equivalente di `app:update-ad-promotions`) esposto via `GET /cron/expire-promotions`
      (protetto da `CRON_SECRET`, schedulato in `api/vercel.json` ogni ora).
- [x] **Elaborazione video (transcodifica + thumbnail)** — implementato
      `video-processing.service.ts` (ffmpeg via `fluent-ffmpeg`+`@ffmpeg-installer/ffmpeg`:
      720p H.264 + faststart, ffprobe per la durata, 5 thumbnail) + job
      `process-pending-videos.ts` esposto via `GET /cron/process-videos` (batch di 2 per
      rispettare i timeout serverless Vercel, schedulato ogni 30 minuti). Nuovi campi
      `Video.thumbnails`/`durationSeconds`/`processing` in Prisma.
- [x] **Modulo Shop** — implementato per intero: model Prisma `ShopCategory`/`ShopProduct`/
      `ShopShipment`, `shop.controller.ts`+`shop.service.ts`+`shop.routes.ts` (catalogo
      pubblico), `admin-shop.controller.ts`+`admin-shop.routes.ts` (CRUD completo con upload
      immagini), pagine `web/src/app/shop/**` + `web/src/app/admin/shop/**`, link in
      Header/Footer/sidebar admin. Il carrello resta volutamente assente (era un prototipo
      statico non funzionante anche nel legacy); bottone "Aggiungi al carrello" disabilitato
      con tooltip "Prossimamente" per coerenza visiva. Aggiornamento 2026-07-04: modulo
      disattivato per il rilancio marketplace utente-utente tramite feature flag spenti di
      default (`SHOP_ENABLED=false`, `NEXT_PUBLIC_SHOP_ENABLED=false`); codice mantenuto ma
      non visibile/raggiungibile.
- [x] **Ordine diretto sull'annuncio** — implementato: `Ad.canBeOrdered` + model `AdOrder` in
      Prisma, `POST /ads/:id/order`, `GET /users/me/orders` (+`/received`),
      `PUT /users/me/orders/:id` (stato), componente `OrderButton.tsx` sulla pagina annuncio,
      gestione lato venditore nella tab "Ordini ricevuti" di `/profilo/acquisti-vendite`.
- [x] **Distinzione annuncio privato vs business** — implementato: `ads.controller.ts`
      (`create`) ramifica su `user.isCompany` — solo i Business possono scegliere
      pubblicazione immediata, abilitare `canBeOrdered` e aggiungere campi custom
      (`fields`/`vals`, mostrati anche sulla pagina annuncio). UI dedicata in
      `annunci/nuovo/page.tsx` ("Opzioni Business").

## Porting visivo 1:1 (UI/UX) — avviato il 2026-06-21

Il design Tailwind ereditato (commit precedenti a questa analisi) **non replicava l'aspetto
del sito Symfony**: colore brand sbagliato (rosso `#e63946` invece del blu reale), logo
testuale invece del logo vero, struttura header/footer/pagine diversa dai template Twig.
Richiesto esplicitamente dall'utente un porting 1:1 della grafica legacy (Bootstrap +
AdminLTE per l'admin), riprodotto nello stack Tailwind esistente (stessa struttura/contenuto,
non le stesse librerie jQuery).

### Fatto

- [x] **Brand corretto**: colore reale `#4396c1`/`#236abd` (estratto dal logo originale e dal
      `theme-color` legacy) al posto del rosso, font Ubuntu al posto di Inter, logo vero
      (`legacy-symfony/web/img/home/logo-vedocompro-cobalt.png`/`-white.png`) al posto del
      testo. Cascata automatica su bottoni/badge/link in tutto il sito via `tailwind.config.ts`.
- [x] **Header** (`web/src/components/layout/Header.tsx`) ricostruito sul navbar legacy:
      sfondo blu pieno, logo bianco, link Home/Shop/Supporto/Business sempre visibili, CTA
      "Inserisci annuncio" in evidenza.
- [x] **Footer** (`web/src/components/layout/Footer.tsx`) ricostruito con il mega-menu
      categorie completo (6 gruppi, dati reali dal DB) come `template/footer.html.twig`.
- [x] **Pagina annuncio** (`AdDetailContent.tsx`) ricostruita su `ads/view.html.twig`: video
      come media principale (non più foto, coerente col claim "Acquista e Vendi con un
      Video!"), reputazione venditore (% feedback positivi, punti, badge verificato), box
      azienda, pulsanti condivisione social (stessi colori del legacy), pulsanti
      Chiama/Messaggio/Ordina/Indicazioni, box "annuncio vecchio" (>30gg), servizi hotel,
      annunci simili in fondo. Dati arricchiti lato backend (`ads.service.ts: findById`):
      `feedPercent`, `similar`, `companyLogo`/`companyWebsite`/`points` sul venditore.
- [x] **Homepage** (`web/src/app/page.tsx`): tile categorie reali (6 padri dal DB, icone
      lucide-react) cliccabili verso la ricerca filtrata, fascia trust blu piena come
      `default/index.html.twig`.
- [x] **Ricerca/listing** (`web/src/app/annunci/page.tsx`): aggiunto filtro Categoria
      (raggruppato padre/figli) e Regione nella sidebar — il backend lo supportava già,
      mancava solo la UI.
- [x] **Admin: chrome separato dal sito pubblico** — bug trovato durante la verifica visiva:
      il layout admin mostrava il footer pubblico (mega-menu) sotto la sua sidebar. Creato
      `SiteChrome.tsx` che nasconde Header/Footer pubblici sulle rotte `/admin/*`, replicando
      la separazione netta `admin/base.html.twig` vs `base.html.twig` del legacy.
- [x] **Admin: CRUD categorie annunci** — assente del tutto prima, ora
      `web/src/app/admin/categorie/page.tsx` (albero padre/figli, conteggio annunci,
      protezione cancellazione se ha annunci/sotto-categorie collegate).
- [x] **Admin: preview video da moderare** — `admin/video/page.tsx` mostra ora un player
      reale (con stato "elaborazione in corso") invece del solo nome file; prima l'admin
      doveva approvare/rifiutare "alla cieca".
- [x] **Admin: modifica annunci** — prima l'admin poteva solo pubblicare/sospendere; ora
      `web/src/app/admin/annunci/[id]/page.tsx` permette di modificare ogni campo
      (titolo/categoria/prezzo/descrizione/località/condizione).
- [x] **Bug card annunci**: le card nella lista mostravano sempre "Nessuna immagine" anche
      con foto presenti (mai renderizzate) — corretto in `AdCard.tsx`.
- [x] **Gestione spedizione sugli annunci** (feature nuova, non presente nel legacy — il
      generico model `Shipment` carrier/method/estimates esisteva ma era dead code mai
      collegato agli annunci): checkbox disponibilità + costo opzionale + note in
      creazione/modifica annuncio, visualizzata nel dettaglio, badge nella card listing.

### Fatto il 2026-06-22 (seconda tornata)

- [x] **Form crea/modifica annuncio**: `nuovo/page.tsx` e `[id]/modifica/page.tsx`
      riorganizzati in sezioni numerate con icone (Categoria e titolo → Prezzo e condizione →
      Posizione → Spedizione → Foto/Video), barra di avanzamento a segmenti in `nuovo/page.tsx`
      — eco del wizard multi-step di `ads/add.html.twig`/`_add.html.twig` senza introdurre
      `jquery.steps.js`. Logica di submit/validazione/upload non toccata.
- [x] **Profilo utente, messaggi, notifiche** — `profilo/page.tsx` (header con reputazione,
      badge stato annuncio), `profilo/feedback/page.tsx` (card statistiche % positivi),
      `messaggi/page.tsx` (avatar, contatore non letti), `notifiche/page.tsx` (icone/colori
      per tipo, completata `TYPE_CONFIG` per i type 10/12 mancanti), `utenti/[id]/page.tsx` +
      `UserProfileTabs.tsx` (reputazione, % positivi). **Bug trovato e corretto**: il bottone
      "Lascia feedback" non appariva mai perché `currentUserId` non veniva mai passato da
      `page.tsx` (Server Component, nessun accesso al token) a `UserProfileTabs.tsx` — ora
      letto via `useAuth()` direttamente nel componente client.
- [x] **Pagina Business** — contenuti reali dal legacy: piani "Mensile" 19,99€/mese e
      "Annuale" 199,99€/anno con le feature list esatte, sezione opzioni extra (Montaggio
      Video +10€/mese, Riprese con Drone +20€/mese) come info card non funzionante (replica
      fedele: anche nel legacy quelle opzioni erano solo informative sul piano, non
      acquistabili singolarmente via form).
- [x] **Shop pubblico** — bottone "Aggiungi al carrello" cosmetico su ogni card (come il
      legacy), sezione Spedizione nella scheda prodotto resa più visibile (tabella metodi con
      logo/prezzo/tempi).
- [x] **Pannello admin: tema AdminLTE** — sidebar con logo+user panel+indicatore online,
      breadcrumb in cima al contenuto, dashboard con "small-box" colorate per statistica
      (pattern AdminLTE: icona+numero grande+colore per categoria). Nuove classi condivise
      `.admin-box`/`.admin-breadcrumb`/`.admin-small-box` in `globals.css` per uniformità
      futura. `admin/sistema` e `admin/lock` restano assenti come funzione (P2, non solo
      grafica).
- [x] **Pagine statiche** — create `/privacy` e `/termini` (linkate dal footer ma 404 fino ad
      ora), contenuto reale da `default/privacy.html.twig`/`terms-of-services.html.twig`.
      Aggiornamento 2026-07-04: create anche `/linee-guida`, `/servizi` e
      `/porta-un-amico`, linkate da footer/header dove opportuno e aggiunte alla sitemap.

### Resta da fare

- [x] **Dashboard Business separata** (`business/dashboard/*`) — fatto il 2026-07-04:
      nuova API `GET /business/dashboard`, pagina `web/src/app/business/dashboard/page.tsx`,
      statistiche su annunci, visite, click telefono e click messaggi, con tracking in
      `ads.service.ts`/`ads.controller.ts` su `BusinessStat`.
- [x] **`admin/sistema`, `admin/lock`** — fatto il 2026-07-04: pagina sistema con stato
      servizi/ambiente e pagina lock con uscita rapida.

## P1 — Funzionalità di prodotto

- [x] **Attivazione account Business** — fatto il 2026-07-04: pagina `/business` collegata a
      `POST /business/requests` con dati fiscali, opzioni extra e blocco doppia richiesta
      pendente; nuova pagina admin `/admin/business` su `GET/PUT /admin/business-requests`;
      approvazione admin imposta `User.isCompany=1`, calcola `businessEnd` in base al
      pacchetto mensile/annuale, marca la richiesta come pagata/approvata e invia notifica
      in-app. Aggiunto hardening: `usersController.updateMe()` ora whitelista i campi
      modificabili dall'utente e non permette più di auto-impostare stato Business/crediti.
- [x] **Dashboard statistiche venditore Business** — fatto il 2026-07-04: `BusinessStat` ora
      viene scritto su visualizzazione dettaglio annuncio Business e click telefono/messaggio;
      dashboard Business mostra totali e andamento 12 mesi.
- [x] **Generazione/gestione coupon da admin** — fatto il 2026-06-21:
      `admin-coupons.controller.ts`/`routes.ts` (`GET /admin/coupons`,
      `POST /admin/coupons/generate` con codice univoco `VC-XXXXXXXXXX`,
      `DELETE /admin/coupons/:id` bloccata se già usato), pagina
      `web/src/app/admin/coupon/page.tsx`. Nota aggiornata 2026-07-04: `Coupon.assigned`
      resta una stringa libera (non FK), ma `payments.controller.ts` ora valida che, se
      compilata, corrisponda a email o username dell'utente che applica il coupon.
- [x] **Notifiche in-app: tassonomia centralizzata** — fatto il 2026-06-22:
      `api/src/constants/notifications.ts` (`NotificationType`), tutti i magic number nei
      controller sostituiti con le costanti. Aggiunti i 2 tipi mancanti: `PROMOTION_EXPIRED`
      (15, da `expirePromotions()`) e `FEEDBACK_REQUEST` (16, alla transizione
      paid+shipped=true di una vendita). **Bug corretto**: `replyHelpDesk` lato utente
      notificava `ticket.userId`, cioè l'utente che sta scrivendo la risposta a se stesso —
      ora notifica l'admin assegnato (`assignedTo`) o, in mancanza, tutti gli admin. La
      numerazione `type` resta diversa da quella legacy (rinumerata in migrazione, accettato).
      Aggiornamento 2026-07-04: `web/src/app/notifiche/page.tsx` non marca più tutto come
      letto al caricamento; nuovo endpoint `POST /users/me/notifications/:id/open` marca la
      singola notifica e restituisce la destinazione, con bottone separato "Segna tutte come
      lette".
- [x] **Template email da admin** (`admin_mail`) — fatto il 2026-06-21: CRUD completo
      (`admin-mail.controller.ts`/`routes.ts`, pagina `web/src/app/admin/template-email/page.tsx`)
      su `AdminDefaultMail`. `mail.service.ts` ora cerca prima un template DB per `type`
      (1=rifiuto annuncio, 2=approvazione, 3=benvenuto) e usa l'hardcoded solo come fallback
      se non trovato. Aggiornamento 2026-07-04: aggiunto invio admin libero a utenti
      selezionati (`POST /admin/mail-templates/send`), sia come email esterna sia come
      messaggio interno con notifica, con template opzionale e placeholder `{{username}}`,
      `{{name}}`, `{{email}}`.
- [ ] **Switch user / impersonazione admin** — 🟡 BLOCCATO IN ATTESA DI AUTORIZZAZIONE
      EXPLICITA. Nativo in Symfony (`switch_user: true`, `security.yml:22,66`, solo
      `ROLE_SUPER_ADMIN`), assente nel nuovo stack. Il 2026-06-22 ho iniziato
      l'implementazione (campo `User.isSuperAdmin` aggiunto, default `false` per tutti,
      middleware `requireSuperAdmin` creato ma non agganciato a nessuna route) — il sistema di
      sicurezza ha bloccato due volte i passi successivi (propagare `isSuperAdmin` nel JWT,
      impostare il flag su un utente reale) perché impersonare un altro utente è una
      funzionalità di privilege-escalation che richiede un'autorizzazione esplicita
      dell'utente, non deducibile da un "continua" generico. **Per procedere serve una
      richiesta esplicita** (es. "implementa lo switch-user, autorizzo l'escalation"); a quel
      punto resta da fare: endpoint `POST /admin/users/:id/impersonate` (super-admin only, JWT
      "a nome di" con `impersonatedBy`), audit-log obbligatorio (vedi voce sotto, già pronta),
      UI con banner "stai impersonando X" e pulsante per tornare al proprio account.
- [x] **HelpDesk: stato a 3 vassoi** — fatto il 2026-06-22: `HelpDesk.closed` da `Boolean` a
      `Int` (0=aperto, 1=chiuso, 2=assegnato, come il legacy). `GET /admin/helpdesk?status=`
      filtra per vassoio, `PUT /admin/helpdesk/:id` valida i 3 valori. Pagina admin
      `web/src/app/admin/helpdesk/page.tsx` riscritta con tab Aperti/Assegnati/Chiusi, azioni
      Assegna/Chiudi/Riapri, risposta inline (mancava del tutto, era solo lista read-only).
- [x] **PWA** — fatto il 2026-06-22: icone (favicon/apple-touch/android-chrome/mstile/safari
      pinned tab) copiate da `legacy-symfony/web/` in `web/public/`, `web/src/app/manifest.ts`
      (convenzione Next.js, tema `#4396c1`), service worker riscritto in
      `web/public/service-worker.js` (quello legacy aveva un bug — `request` non definito — e
      un fallback `/offline/` inesistente nel nuovo stack), registrato solo in produzione via
      `web/src/components/ServiceWorkerRegistration.tsx`.
- [x] **SEO avanzato** — fatto il 2026-06-22: `openGraph` su `annunci/[id]/page.tsx` (title,
      description, image, video se presente — come `ads/view.html.twig:4-13` legacy) e
      `utenti/[id]/page.tsx`. Creati `web/src/app/robots.ts` (esclude `/admin` e `/api`) e
      `web/src/app/sitemap.ts` (route statiche + fino a 500 annunci pubblicati più recenti).
      JSON-LD non esisteva nemmeno nel legacy, non è una regressione se omesso.
- [x] **Push notification (OneSignal)** — fatto il 2026-07-04: SDK iniettato lato client in
      `legacy-symfony/app/Resources/views/base.html.twig:247-254` (App ID hardcoded, da
      spostare in env var). Portato in React con `OneSignalRegistration`, attivo solo in
      produzione e solo con `NEXT_PUBLIC_ONESIGNAL_APP_ID`. Nel legacy **non risulta
      integrazione server→OneSignal** per trigger su eventi (nuovo messaggio, feedback, ecc.)
      — solo registrazione browser; l'invio push server-side resta una possibile evoluzione.

## P2 — Admin / infrastruttura

- [x] **Log azioni admin** (`AdminActions`) — implementato: `auditLog.service.ts`,
      `GET /admin/actions`, pagina `/admin/log-azioni`, scrittura su attivazione/disattivazione
      utenti, cancellazioni, moderazione annunci/video/recensioni e approvazione/rifiuto
      richieste Business. Resta da agganciare allo switch-user quando verrà autorizzato.
- [x] **Suggerimenti utenti** (`admin_suggerimenti` / modello `Suggest`) — implementato:
      `GET /admin/suggests`, `DELETE /admin/suggests/:id`, pagina `/admin/suggerimenti`.
- [x] **Impostazioni di sistema admin** (`admin_sistema`, readonly: versione Node, limiti
      upload, stato servizi) e **admin lock** — fatto il 2026-07-04: `GET /admin/system`,
      pagina `/admin/sistema`, pagina `/admin/lock` con uscita rapida e link alla dashboard.
- [x] **reCAPTCHA** — fatto il 2026-07-04: `RECAPTCHA_SECRET` collegato a registrazione e
      richiesta reset password tramite `recaptcha.service.ts`; frontend con helper opzionale
      reCAPTCHA v3 (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`). Se le env non sono configurate, resta
      non bloccante per sviluppo locale.
- [x] **Multilingua (i18n)** — verificato il 2026-07-04: nessun gap reale. Il legacy aveva solo
      `messages.it.yml` (IT
      hardcoded), il nuovo stack è IT hardcoded nei componenti. Non è una regressione; resta
      solo un'opportunità se in futuro serve multilingua (nessun framework i18n presente in
      `web/`).
- [x] **Modello `Region` duplicato/inutilizzato** — verificato il 2026-07-04: nello schema
      attuale non esiste più `Region`; restano solo `Regione`/`Province`/`Comune`, usati da
      `/regions`, `/provinces`, `/comuni` e dalle form annunci. Nessuna rimozione ulteriore.
- [x] **Video: cancellazione non a cascata** — risolto: `Video.ad` usa `onDelete: Cascade`.
- [x] **Ricerca: filtri avanzati per categoria (AdvancedFields)** — verificato il 2026-07-04:
      nessuna regressione reale da portare. Nel legacy l'entity `AdvancedFields` era schema
      morto/non popolato; `SearchController.php` costruiva campi hardcoded per una categoria,
      ma non li applicava alla query. Il nuovo stack salva e mostra già `fields`/`vals` sugli
      annunci business; una ricerca avanzata reale su quei campi sarebbe una nuova feature,
      non un porting mancante.
- [x] **Ricerca: separazione vetrina/promo** — `SearchController.php:28-194` separa i
      risultati "vetrina" (showcase con promo attiva, ordinati per scadenza) dai risultati
      normali; implementato in `ads.service.ts` con array `showcase` separato in pagina 1 ed
      esclusione dai risultati normali per evitare duplicati.

## Verificare con altri moduli (fuori perimetro di questa analisi)

- [x] Route lato utente per apertura/visione ticket HelpDesk (`/helpdesk/*` nel legacy,
  `HelpController.php`) — verificato il 2026-07-04: la pagina
  `web/src/app/profilo/helpdesk/page.tsx` è collegata agli endpoint reali
  `/users/me/helpdesk`. Corretti anche controlli e UX: validazione creazione ticket, blocco
  risposte su ticket chiusi/non propri, assegnazione reale all'admin su "Assegna a te" e
  storico risposte visibile in admin.

## Riferimento

- Snapshot PHP legacy isolato in `legacy-symfony/` (root del repo) il 2026-06-20: prima
  conviveva a livello di root con `api/`/`web/` e dentro `web/` con l'app Next.js. Ora
  `web/` contiene solo l'app Next.js, `legacy-symfony/web/` contiene il webroot pubblico
  Symfony originale.
- Analisi completa eseguita il 2026-06-20 su tutti i 17 controller, 28 entity, 3 command,
  11 form e relativi repository in `legacy-symfony/src/AppBundle`, confrontati con
  `api/src` (6 controller) + `web/src/app` (tutte le pagine).
- Tutti gli 8 item P0 emersi dall'analisi sono stati implementati e verificati il
  2026-06-20 (`tsc --noEmit` e `next build` puliti su entrambi gli stack). Nuova variabile
  d'ambiente richiesta in produzione: `CRON_SECRET` (protegge `GET /cron/*`, invocati da
  Vercel Cron Jobs configurati in `api/vercel.json`). Non è stato possibile eseguire
  `prisma db push`/`migrate` in questo ambiente (nessun Postgres disponibile): va eseguito
  manualmente prima del deploy per applicare i nuovi model (`AdOrder`, `ShopCategory`,
  `ShopProduct`, `ShopShipment`) e i campi aggiunti (`Ad.canBeOrdered`,
  `Video.thumbnails`/`durationSeconds`/`processing`).
- Il 2026-06-21 è stato configurato un Postgres locale reale (database `vedocompro`) e
  popolato con il seed (categorie + dati geografici da `legacy-symfony/web/json/`, vedi
  `api/prisma/seed.ts`); risolta anche la configurazione storage S3-compatibile (Cloudflare
  R2: richiede `AWS_S3_ENDPOINT`/`AWS_S3_PUBLIC_URL` oltre alle credenziali, non solo
  `AWS_S3_BUCKET` — vedi commenti in `api/src/config/index.ts`).
- Il 2026-06-21 sono stati chiusi 3 item P1 (coupon admin, template email admin) e avviato
  il porting visivo 1:1 (vedi sezione dedicata): fondamenta brand + pagina annuncio +
  homepage + ricerca + 3 nuove pagine admin + fix separazione chrome admin/pubblico, tutti
  verificati con `tsc --noEmit`, `next build` e screenshot reali via Playwright (non solo
  type-check). Aggiunta anche una feature nuova non presente nel legacy (gestione spedizione
  per singolo annuncio, esplicitamente richiesta).
- Nuovi campi Prisma aggiunti il 2026-06-21 da applicare con `prisma db push` prima del
  deploy: `Ad.shippingAvailable`/`shippingCost`/`shippingNotes`. Resi opzionali anche
  `Regione`/`Province.latitudine`/`longitudine` e `Comune.istat`/`prefisso`/`codFisco`/
  `superficie`/`numResidenti` (nessuna fixture legacy disponibile per quei valori, vedi
  `api/prisma/seed.ts`).
- Nuovi campi Prisma aggiunti il 2026-07-04 da applicare con `prisma db push`/migrazione
  prima del deploy: `BusinessRequest.status`, `reviewedAt`, `reviewedBy`, `adminNotes`.
