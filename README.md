# thesite.ro

Agregator de știri din surse multiple. Vezi aceleași evenimente din perspective diferite și înțelege bias-ul mediatic.

## Tehnologii
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Dezvoltare Locală
```bash
npm install
npm run dev
```

## News refresh scheduling

GitHub Actions scheduled runs are best effort and can be hours apart. The Linux
server also runs `thesite-news-refresh.timer` every five minutes. Its dependency-free
Node.js probe makes a unique `/api/news?view=card&limit=5` request to reach the origin.
When the Redis cache is older than ten minutes, the API starts the existing
authenticated background cron pipeline. The probe waits up to 110 seconds and
only succeeds after observing a populated Redis cache no older than ten minutes.
It requires Node.js 22+ and no copied production credentials.

Install on the server as root from this checkout:

```bash
install -d -m 755 /usr/local/lib/thesite-news-refresh
install -m 644 scripts/refresh-news.mjs /usr/local/lib/thesite-news-refresh/refresh-news.mjs
install -m 644 scripts/systemd/thesite-news-refresh.service /etc/systemd/system/
install -m 644 scripts/systemd/thesite-news-refresh.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now thesite-news-refresh.timer
systemctl start thesite-news-refresh.service
```

Verify with `systemctl list-timers thesite-news-refresh.timer` and
`journalctl -u thesite-news-refresh.service`. Test the probe offline with
`npx vitest run scripts/refresh-news.test.mjs` after `npm ci` (the tests make no network calls).

The GitHub refresh workflow remains a backup. The health check still alerts when
the site is unavailable, has too few stories, or the cache is over one hour old.
