# Serverga o'rnatish

Domen: `whitehacker-portfolio.duckdns.org` · Server: Contabo (`/var/www/whitehacker-portfolio`)

Skript **mavjud saytlarga tegmaydi**: nginx yoki Node o'rnatilgan bo'lsa qayta o'rnatmaydi,
`ufw` ga umuman qo'l urmaydi, boshqa nginx saytlarini o'chirmaydi. Shu serverdagi
Edu CRM o'z holicha ishlashda davom etadi.

## 1. Birinchi marta (serverda, root)

```bash
git clone https://github.com/WhiteHacker-Full-Stack/portfolio.git /tmp/wh
sudo bash /tmp/wh/deploy/setup-server.sh
```

| Bosqich | Nima bo'ladi |
|---|---|
| Paketlar | faqat yetishmaganlari (git, curl, nginx) |
| Node.js | 20.9+ bo'lsa tegilmaydi, aks holda Node 22 |
| Swap | faqat RAM 4 GB dan kam bo'lsa |
| Foydalanuvchi | `whportfolio` — tizim foydalanuvchisi |
| Kod | GitHub'dan `/var/www/whitehacker-portfolio` ga |
| `.env` | tasodifiy `JWT_SECRET` bilan yaratiladi |
| nginx | yangi sayt: `/api/`+`/uploads/` → :4000, qolgani → :3000 |
| systemd | `whitehacker-api`, `whitehacker-web` |

## 2. Keyin — HTTPS va admin

```bash
# DuckDNS'ni shu server IP'siga qarating, keyin:
sudo certbot --nginx -d whitehacker-portfolio.duckdns.org --redirect --agree-tos

# Admin paroli (bir marta ekranga chiqadi — saqlang):
sudo -u whportfolio bash -c 'cd /var/www/whitehacker-portfolio && npm run db:admin'
```

## 3. Keyingi yangilanishlar

GitHub'ga push qilgandan keyin:

```bash
sudo -u whportfolio bash /var/www/whitehacker-portfolio/deploy/deploy.sh
```

Bazaga va yuklangan fayllarga tegmaydi.

## 4. Muhim

**`npm run db:seed` ni serverda ishlatmang** — u bazani tozalab, 9 ta o'ylab topilgan
namunaviy loyiha bilan to'ldiradi. Ishlab chiqarishda faqat `db:deploy` (migratsiya) va
`db:admin` (admin hisobi).

- Baza: `/var/www/whitehacker-portfolio/server/prisma/dev.db`
- Yuklangan fayllar: `/var/www/whitehacker-portfolio/web/public/uploads/`

Zaxira:

```bash
sudo tar czf /root/wh-backup-$(date +%F).tar.gz \
  -C /var/www/whitehacker-portfolio server/prisma/dev.db web/public/uploads
```

## 5. Nosozliklar

```bash
systemctl status whitehacker-api whitehacker-web
journalctl -u whitehacker-api -n 50 --no-pager
journalctl -u whitehacker-web -n 50 --no-pager
nginx -t
```

## 6. Telegram

`.env` da to'ldiring, keyin `sudo systemctl restart whitehacker-api`:

```
TELEGRAM_BOT_TOKEN="@BotFather bergan token"
TELEGRAM_CHANNEL_ID="@whitehackerstudio"
```

Bot kanalga **admin** qilib qo'shilgan bo'lishi shart.
