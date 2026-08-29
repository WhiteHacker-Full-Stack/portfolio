#!/usr/bin/env bash
# WhiteHacker portfolio — serverni birinchi marta sozlash.
#
#   sudo bash setup-server.sh
#
# Idempotent. Serverda allaqachon ishlab turgan boshqa saytlarga tegmaydi:
# nginx/Node bo'lsa qayta o'rnatmaydi, ufw ga umuman tegmaydi, mavjud
# nginx saytlarini o'chirmaydi — faqat o'ziga yangi sayt qo'shadi.
set -euo pipefail

DOMAIN="${DOMAIN:-whitehacker-portfolio.duckdns.org}"
REPO="${REPO:-https://github.com/WhiteHacker-Full-Stack/portfolio.git}"
APP_USER="${APP_USER:-whportfolio}"
APP_DIR="${APP_DIR:-/var/www/whitehacker-portfolio}"
SITE="whitehacker-portfolio"

log() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
skip() { printf '\033[90m    (o\047tkazildi: %s)\033[0m\n' "$1"; }

[ "$(id -u)" -eq 0 ] || { echo "root sifatida ishga tushiring (sudo)."; exit 1; }

log "Kerakli paketlar"
export DEBIAN_FRONTEND=noninteractive
need=()
for p in git curl ca-certificates openssl; do dpkg -s "$p" >/dev/null 2>&1 || need+=("$p"); done
command -v nginx >/dev/null || need+=(nginx)
if [ ${#need[@]} -gt 0 ]; then apt-get update -qq && apt-get install -y -qq "${need[@]}"; else skip "hammasi bor"; fi

log "Node.js"
NODE_MAJOR=0
command -v node >/dev/null && NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
NODE_MINOR=0
command -v node >/dev/null && NODE_MINOR=$(node -v | sed 's/v//' | cut -d. -f2)
if [ "$NODE_MAJOR" -gt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 9 ]; }; then
  echo "    mavjud: $(node -v) — yetarli (Next.js 16 uchun >= 20.9)"
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
  echo "    o'rnatildi: $(node -v)"
fi

# Next.js build kam xotirada yiqilmasligi uchun. 4 GB+ bo'lsa shart emas.
log "Swap"
MEM_MB=$(free -m | awk '/Mem:/{print $2}')
if [ "$(swapon --show | wc -l)" -eq 0 ] && [ "$MEM_MB" -lt 4000 ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    2G swap qo'shildi"
else
  skip "RAM ${MEM_MB}MB yetarli yoki swap allaqachon bor"
fi

log "Ilova foydalanuvchisi: $APP_USER"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
mkdir -p "$APP_DIR"

log "Kodni olish"
if [ -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all -q
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard origin/main -q
else
  # useradd bo'sh bo'lmagan katalog yaratgan bo'lishi mumkin — clone shu yerga.
  sudo -u "$APP_USER" git clone -q "$REPO" "$APP_DIR/.tmpclone"
  shopt -s dotglob
  mv "$APP_DIR/.tmpclone"/* "$APP_DIR"/
  shopt -u dotglob
  rmdir "$APP_DIR/.tmpclone"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" git -C "$APP_DIR" log --oneline -1

log ".env"
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="file:./dev.db"

JWT_SECRET="$(openssl rand -hex 32)"
ADMIN_USERNAME="whitehacker"
# ADMIN_PASSWORD ataylab bo'sh: \`npm run db:admin\` kuchli parol yasab, bir marta ko'rsatadi.

TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHANNEL_ID="@whitehackerstudio"

SITE_URL="https://$DOMAIN"
PORT=4000
HOST=127.0.0.1
CORS_ORIGINS="https://$DOMAIN,capacitor://localhost,http://localhost"

UPLOAD_DIR="web/public/uploads"
API_INTERNAL_URL="http://127.0.0.1:4000"
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "    yaratildi (JWT_SECRET tasodifiy)"
else
  skip ".env allaqachon bor"
fi

log "systemd xizmatlari"
cp "$APP_DIR/deploy/whitehacker-api.service" /etc/systemd/system/
cp "$APP_DIR/deploy/whitehacker-web.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable whitehacker-api whitehacker-web >/dev/null

cat > /etc/sudoers.d/whitehacker-deploy <<EOF
$APP_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart whitehacker-api whitehacker-web
EOF
chmod 440 /etc/sudoers.d/whitehacker-deploy
visudo -c -f /etc/sudoers.d/whitehacker-deploy >/dev/null && echo "    sudoers qoidasi tekshirildi"

log "Ilovani yig'ish"
sudo -u "$APP_USER" bash "$APP_DIR/deploy/deploy.sh"

log "nginx sayti: $SITE"
sed "s/whitehacker-portfolio\.duckdns\.org/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf" \
  > "/etc/nginx/sites-available/$SITE"
ln -sf "/etc/nginx/sites-available/$SITE" "/etc/nginx/sites-enabled/$SITE"
mkdir -p /var/www/html
nginx -t && systemctl reload nginx
echo "    faol saytlar: $(ls /etc/nginx/sites-enabled/ | tr '\n' ' ')"

log "TAYYOR"
echo "HTTP orqali tekshiring:  curl -H 'Host: $DOMAIN' http://127.0.0.1/"
echo
echo "Keyingi qadamlar:"
echo "  1) DuckDNS'da $DOMAIN ni shu server IP'siga qarating"
echo "  2) sudo certbot --nginx -d $DOMAIN --redirect --agree-tos"
echo "  3) sudo -u $APP_USER bash -c 'cd $APP_DIR && npm run db:admin'"
