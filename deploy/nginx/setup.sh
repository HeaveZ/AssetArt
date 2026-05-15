#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AssetNova · One-shot nginx + certbot setup for Ubuntu/Debian on Contabo.
#
# Run as root (or with sudo) on the server, after the app container is up
# on 127.0.0.1:3000.
#
#   sudo ./deploy/nginx/setup.sh assets.evam.com you@evam.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <hostname> <email>"
  echo "Example: $0 assets.evam.com ops@evam.com"
  exit 2
fi

HOST="$1"
EMAIL="$2"

if [[ $EUID -ne 0 ]]; then
  echo "✗ Please run as root (sudo)." >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SRC_CONF="${REPO_DIR}/deploy/nginx/nginx.conf"
TARGET_AVAILABLE="/etc/nginx/sites-available/assetnova.conf"
TARGET_ENABLED="/etc/nginx/sites-enabled/assetnova.conf"

echo "→ Updating package lists"
apt-get update -y

echo "→ Installing nginx + certbot"
apt-get install -y nginx certbot python3-certbot-nginx

echo "→ Ensuring WebSocket upgrade map in /etc/nginx/nginx.conf"
if ! grep -q "connection_upgrade" /etc/nginx/nginx.conf; then
  sed -i '/^http {/a \    map $http_upgrade $connection_upgrade { default upgrade; '\'''\''  close; }' /etc/nginx/nginx.conf
fi

echo "→ Preparing certbot webroot"
mkdir -p /var/www/certbot

echo "→ Writing server block to ${TARGET_AVAILABLE}"
sed "s/__APP_HOST__/${HOST}/g" "${SRC_CONF}" > "${TARGET_AVAILABLE}"
ln -sf "${TARGET_AVAILABLE}" "${TARGET_ENABLED}"

# Remove the default site if present
rm -f /etc/nginx/sites-enabled/default

echo "→ Testing nginx config (HTTP only, pre-SSL)"
# Temporarily comment the SSL block so nginx can start without certs
TMP_CONF=$(mktemp)
awk '
  /^# ── HTTPS server/ { skipping=1 }
  skipping && /^}/ { skipping=0; next }
  !skipping { print }
' "${TARGET_AVAILABLE}" > "${TMP_CONF}"
cp "${TMP_CONF}" "${TARGET_AVAILABLE}"
rm "${TMP_CONF}"
nginx -t
systemctl reload nginx

echo "→ Requesting Let's Encrypt certificate for ${HOST}"
certbot certonly --webroot -w /var/www/certbot \
  -d "${HOST}" \
  --non-interactive --agree-tos --email "${EMAIL}" \
  --no-eff-email

echo "→ Restoring full SSL server block"
sed "s/__APP_HOST__/${HOST}/g" "${SRC_CONF}" > "${TARGET_AVAILABLE}"

echo "→ Final nginx test + reload"
nginx -t
systemctl reload nginx
systemctl enable nginx

echo
echo "✓ Done."
echo "  Public URL: https://${HOST}"
echo "  Health:     curl -s https://${HOST}/healthz"
echo
echo "Certificate renewal is automatic via certbot.timer."
