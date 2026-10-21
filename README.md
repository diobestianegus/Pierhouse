# Pierhouse

Pulizie condivise per Pie, Edo, Albi e Umbe. Interfaccia React su GitHub Pages; API e database D1 su un account Cloudflare indipendente da ChatGPT. I promemoria delle 18:00 usano un Cron Trigger Cloudflare con fuso Europe/Rome, inclusi i cambi di ora legale.

## Avvio

`npm ci`, copia `.env.example` in `.env.local` e imposta l'URL del backend, poi `npm run dev`.

## Attivazione del backend

1. Accedi al tuo account Cloudflare con `npx wrangler login`.
2. Crea D1: `npx wrangler d1 create pierhouse`. Inserisci l'ID restituito in `backend/wrangler.jsonc`.
3. Applica lo schema: `npx wrangler d1 execute pierhouse --remote --config backend/wrangler.jsonc --file backend/schema.sql`.
4. Genera le chiavi VAPID con `node -e "console.log(require('web-push').generateVAPIDKeys())"` e configura ciascuna con `npx wrangler secret put PUSH_VAPID_PUBLIC_KEY --config backend/wrangler.jsonc` e `npx wrangler secret put PUSH_VAPID_PRIVATE_KEY --config backend/wrangler.jsonc`. Non inserirle nel repository.
5. Esegui `npm run backend:deploy` e verifica `/health` sull'URL restituito.
6. Importa la copia privata dei dati con `npx wrangler d1 execute pierhouse --remote --config backend/wrangler.jsonc --file .migration/records.sql`. Il file non viene pubblicato nel repository. Prima del passaggio definitivo aggiorna il backup per non perdere modifiche recenti.

## GitHub Pages

Imposta `VITE_API_BASE_URL` nelle **Settings → Secrets and variables → Actions → Variables** della repository. In **Settings → Pages** seleziona **GitHub Actions**. Il workflow pubblica solo quando il backend è stato configurato. Il percorso base predefinito è `/Pierhouse/`.

## Voce e notifiche

Gli audio Chatterbox sono salvati in `public/voices/chatterbox` e associati al testo in `lib/chatterbox-clips.json`. Le battute cambiate richiedono un nuovo audio. La voce del dispositivo rimane un'opzione esplicita.

Sul nuovo dominio ogni telefono deve aggiungere nuovamente l'app alla Home e autorizzare le notifiche. Le registrazioni push del vecchio dominio non si trasferiscono. Il pulsante di prova verifica la ricezione effettiva.

## Verifiche

`npm run build` e `npm run backend:check`. Quest'ultimo prepara il Worker senza pubblicarlo. Nessuna chiave, registrazione push o copia privata delle assenze deve essere inclusa nel repository.
