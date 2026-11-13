#!/usr/bin/env bash
# Nasadí návrhy webu na webtitan.cz (hosting v panelu, bez Dockeru).
#
# Kopíruje jen:  public/designs.html, public/design<N>.html, public/design-assets/, public/api/likes.php
# Cíl:           /var/www/webtitan/public_html  (vlastník webtitan:webtitan, složky 750, soubory 640)
# Nemaže nic, co na serveru navíc je, a nesahá na data lajků (/var/www/webtitan/data).
#
# Použití:
#   env DEPLOY_HOST=158.180.50.98 DEPLOY_USER=ubuntu bash scripts/deploy-designs.sh
# Volitelně: DEPLOY_PORT (22), DEPLOY_KEY (cesta k SSH klíči), DEPLOY_KNOWN_HOSTS (soubor s otiskem serveru),
#            SITE_URL (https://webtitan.cz) – na něm se po nasazení ověří, že stránky odpovídají.
set -euo pipefail

HOST="${DEPLOY_HOST:?Chybí DEPLOY_HOST}"
LOGIN="${DEPLOY_USER:?Chybí DEPLOY_USER}"
PORT="${DEPLOY_PORT:-22}"
SITE_URL="${SITE_URL:-https://webtitan.cz}"
WEBROOT="/var/www/webtitan/public_html"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_OPTS=(-p "$PORT" -o BatchMode=yes -o ConnectTimeout=20)
if [ -n "${DEPLOY_KEY:-}" ]; then SSH_OPTS+=(-i "$DEPLOY_KEY" -o IdentitiesOnly=yes); fi
if [ -n "${DEPLOY_KNOWN_HOSTS:-}" ]; then SSH_OPTS+=(-o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS" -o StrictHostKeyChecking=yes); fi

# 1) Balík jen se soubory návrhů
DIST="$(mktemp -d)"
trap 'rm -rf "$DIST"' EXIT
shopt -s nullglob
pages=("$ROOT"/public/design[0-9]*.html)
if [ ${#pages[@]} -eq 0 ]; then echo "Žádné public/design<N>.html – není co nasadit." >&2; exit 1; fi
cp "$ROOT/public/designs.html" "${pages[@]}" "$DIST/"
cp -R "$ROOT/public/design-assets" "$DIST/"
mkdir -p "$DIST/api"
cp "$ROOT/public/api/likes.php" "$DIST/api/"
find "$DIST" -name .DS_Store -delete
echo "Balík: $(find "$DIST" -type f | wc -l | tr -d ' ') souborů, ${#pages[@]} návrhů"

# 2) Nahrát do dočasné složky na serveru a odtud nainstalovat se správným vlastníkem a právy
REMOTE_TMP="$(ssh "${SSH_OPTS[@]}" "$LOGIN@$HOST" 'mktemp -d /tmp/webtitan-designs.XXXXXX')"
rsync -rlt --delete -e "ssh ${SSH_OPTS[*]}" "$DIST/" "$LOGIN@$HOST:$REMOTE_TMP/"
ssh "${SSH_OPTS[@]}" "$LOGIN@$HOST" \
  "sudo -n rsync -rlt --chown=webtitan:webtitan --chmod=D750,F640 '$REMOTE_TMP/' '$WEBROOT/'; status=\$?; rm -rf '$REMOTE_TMP'; exit \$status"
echo "Nahráno do $HOST:$WEBROOT"

# 3) Ověřit, že web odpovídá
fail=0
check() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' -A 'webtitan-deploy-check' "$SITE_URL/$1")"
  if [ "$code" = "200" ]; then echo "  OK   /$1"; else echo "  CHYBA /$1 -> $code"; fail=1; fi
}
check designs.html
for p in "${pages[@]}"; do check "$(basename "$p")"; done
if curl -fsS -A 'webtitan-deploy-check' "$SITE_URL/api/likes.php" | grep -q '"counts"'; then
  echo "  OK   /api/likes.php"
else
  echo "  CHYBA /api/likes.php"; fail=1
fi
if [ "$fail" -ne 0 ]; then echo "Nasazení proběhlo, ale některé stránky neodpovídají." >&2; exit 1; fi
echo "Hotovo: $SITE_URL/designs.html"
