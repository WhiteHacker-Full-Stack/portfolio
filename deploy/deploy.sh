#!/usr/bin/env bash
# Yangi versiyani chiqarish. Serverda ilova foydalanuvchisi nomidan:
#   sudo -u whportfolio bash /var/www/whitehacker-portfolio/deploy/deploy.sh
#
# Ma'lumotlar bazasiga va yuklangan fayllarga tegmaydi.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/whitehacker-portfolio}"
cd "$APP_DIR"

log() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }

log "Kodni yangilash"
git fetch --all -q
git reset --hard origin/main -q
git log --oneline -1

# Dev paketlari ham kerak: yig'ish uchun tsc, next va prisma CLI.
log "Paketlar"
npm ci --no-audit --no-fund

log "Prisma"
npm run db:generate
npm run db:deploy

log "Yig'ish"
npm run build

if systemctl list-unit-files whitehacker-api.service >/dev/null 2>&1; then
  log "Xizmatlarni qayta ishga tushirish"
  sudo systemctl restart whitehacker-api whitehacker-web

  log "Tekshirish"
  for _ in $(seq 1 15); do
    curl -fsS --max-time 3 http://127.0.0.1:4000/api/health >/dev/null 2>&1 && break
    sleep 2
  done
  curl -fsS --max-time 5 http://127.0.0.1:4000/api/health && echo "  <- API"
  for _ in $(seq 1 15); do
    curl -fsS -o /dev/null --max-time 3 http://127.0.0.1:3000/ && break
    sleep 2
  done
  echo "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:3000/)  <- Web"
  systemctl is-active whitehacker-api whitehacker-web
else
  log "systemd xizmatlari hali o'rnatilmagan — setup-server.sh davom ettiradi"
fi
