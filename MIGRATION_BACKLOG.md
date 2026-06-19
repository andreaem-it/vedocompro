# Backlog migrazione PHP → React/Node

Elenco delle funzionalità presenti nel progetto PHP legacy (aggiornato da GitLab,
`andreaem/vedocompro`) ma non ancora portate nel nuovo stack React (`web/`) + Node/Express
(`api/`). Aggiornato il 2026-06-19 dopo l'import della history GitLab (commit `eafbbbd1`).

Legenda priorità: **P0** blocca la parità funzionale core, **P1** funzionalità di prodotto
importante ma non bloccante, **P2** nice-to-have / infrastruttura.

## P0 — Core

- [ ] **Flusso di acquisto/vendita (Buy/Sell)** — i modelli Prisma `Buy`/`Sell` esistono ma
      nessun endpoint/UI li usa. Nel legacy: `setAsShipped`, `unsetAsShipped`,
      `setReceivedPayment`, `unsetReceivedPayment` in `UserController.php`.
- [ ] **Elaborazione video (transcodifica + thumbnail)** — il legacy ha un comando cron
      (`app:process-videos`, `src/AppBundle/Command/ProcessVideoCommand.php`) che con ffmpeg:
      transcodifica a 720p H.264 + faststart, estrae 5 thumbnail con ffprobe/ffmpeg, carica
      tutto su S3. Nel nuovo stack l'endpoint `POST /ads/:id/videos` salva solo il file grezzo
      su S3, senza nessuna elaborazione: il flag `uploaded` resta `false` per sempre.
- [ ] **Modulo Shop** (nuovo, da GitLab) — catalogo prodotti separato dagli annunci, con
      categorie, carrello, servizi di spedizione configurabili. Legacy:
      `ShopController`, entità `ShopCategories`/`ShopProducts`/`ShopShipments`, pannello admin
      dedicato (`admin_shop*`).
- [ ] **Ordine diretto sull'annuncio** (nuovo, da GitLab) — flag `canBeOrdered` su `Ads` +
      entità `AdsOrders`: permette di ordinare un articolo direttamente dalla pagina annuncio,
      senza passare dalla messaggistica. Legacy: `AdsController.php` (form `AdsOrdersType`).

## P1 — Funzionalità di prodotto

- [ ] **Attivazione account Business** — pagina `/business` è solo UI statica con piani
      prezzo; il flusso di richiesta/pagamento non è collegato a un endpoint reale
      (`BusinessRequest`/`BusinessStat` esistono solo come modello).
- [ ] **Notifiche push (OneSignal)** (nuovo, da GitLab) — SDK OneSignal integrato in
      `base.html.twig` con App ID configurato. Da valutare se reimplementare con OneSignal o
      Web Push nativo.
- [ ] **PWA** (nuovo, da GitLab) — `manifest.json`, `service-worker.js`, icone Apple
      touch/startup: app installabile su mobile/desktop. Next.js supporta questo nativamente
      (manifest + service worker in `web/public`).
- [ ] **Dashboard statistiche venditore** — il legacy ha `business_dashboard_statistiche`
      (vendite/visualizzazioni per mese); nel nuovo stack c'è solo tracking views/click
      grezzo, nessuna dashboard aggregata.
- [ ] **Generazione coupon da admin** — l'utente può applicare un coupon
      (`POST /payments/coupon`), ma non c'è endpoint admin per generarne di nuovi
      (legacy: `admin_coupons_genera`).

## P2 — Admin / infrastruttura

- [ ] **Gestione template email da admin** (`admin_mail`) — nel nuovo stack i template sono
      hardcoded in `mail.service.ts`, nessun pannello per modificarli.
- [ ] **Suggerimenti utenti** (`admin_suggerimenti` / modello `Suggest`) — tabella presente
      nello schema Prisma, nessun endpoint.
- [ ] **Impostazioni di sistema admin** (`admin_sistema`) e **admin lock** — assenti.
- [ ] **Switch user / impersonazione admin** — presente nel legacy (Symfony `switch_user`),
      assente nel nuovo stack.
- [ ] **Multilingua (i18n)** — il nuovo stack è italiano hardcoded, nessun framework i18n
      (il legacy comunque aveva solo italiano, ma con Symfony Translator pronto per altre
      lingue).
- [ ] **reCAPTCHA** — variabile d'ambiente `RECAPTCHA_SECRET` presente ma non collegata a
      nessun form.
- [ ] **SEO avanzato** — meta tag dinamici già presenti su annuncio/profilo; mancano
      sitemap.xml, robots.txt, Open Graph, JSON-LD (structured data).

## Riferimento

- Snapshot PHP legacy aggiornato a GitLab `andreaem/vedocompro@master` (commit `42b7fbbc`),
  importato in questo branch con merge `eafbbbd1`.
- Confronto completo eseguito il 2026-06-19 tra `src/AppBundle` (PHP) e `web/src` + `api/src`
  (React/Node).
