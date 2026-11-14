#!/usr/bin/env bash
# Nasadí web webtitan.cz: zkopíruje obsah složky site/ na server do /var/www/webtitan/public_html.
#
# - Statický web + pár PHP endpointů (api/contact.php, api/inbound.php, api/health.php), žádný build, žádný Docker.
# - Kopíruje bez --delete (ve webrootu můžou být soubory panelu): smazaný soubor je potřeba odstranit i na serveru ručně.
# - Na serveru se nastaví vlastník webtitan:webtitan, složky 750, soubory 640.
# - Nic se nemaže a data (/var/www/webtitan/data – poptávky, lajky, přijaté e-maily, konfigurace) se nepřepisují.
# - Po nasazení se ověří, že stránky a endpointy na webu odpovídají.
#
# Použití:
#   env DEPLOY_HOST=158.180.50.98 DEPLOY_USER=ubuntu bash scripts/deploy.sh
# Volitelně: DEPLOY_PORT (22), DEPLOY_KEY (cesta k SSH klíči), DEPLOY_KNOWN_HOSTS (soubor s otiskem serveru),
#            SITE_URL (https://webtitan.cz)
set -euo pipefail

HOST="${DEPLOY_HOST:?Chybí DEPLOY_HOST}"
LOGIN="${DEPLOY_USER:?Chybí DEPLOY_USER}"
PORT="${DEPLOY_PORT:-22}"
SITE_URL="${SITE_URL:-https://webtitan.cz}"
WEBROOT="/var/www/webtitan/public_html"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"

SSH_OPTS=(-p "$PORT" -o BatchMode=yes -o ConnectTimeout=20)
if [ -n "${DEPLOY_KEY:-}" ]; then SSH_OPTS+=(-i "$DEPLOY_KEY" -o IdentitiesOnly=yes); fi
if [ -n "${DEPLOY_KNOWN_HOSTS:-}" ]; then SSH_OPTS+=(-o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS" -o StrictHostKeyChecking=yes); fi

for f in index.html api/contact.php; do
  [ -f "$SITE/$f" ] || { echo "Chybí site/$f – není co nasadit." >&2; exit 1; }
done
echo "Nasazuji $(find "$SITE" -type f ! -name .DS_Store | wc -l | tr -d ' ') souborů ze site/"

# 1) Nahrát do dočasné složky na serveru, 2) odtud nainstalovat se správným vlastníkem a právy
REMOTE_TMP="$(ssh "${SSH_OPTS[@]}" "$LOGIN@$HOST" 'mktemp -d /tmp/webtitan-deploy.XXXXXX')"
rsync -rlt --delete --exclude '.DS_Store' -e "ssh ${SSH_OPTS[*]}" "$SITE/" "$LOGIN@$HOST:$REMOTE_TMP/"
ssh "${SSH_OPTS[@]}" "$LOGIN@$HOST" \
  "sudo -n rsync -rlt --chown=webtitan:webtitan --chmod=D750,F640 '$REMOTE_TMP/' '$WEBROOT/'; status=\$?; rm -rf '$REMOTE_TMP'; exit \$status"
echo "Nahráno do $HOST:$WEBROOT"

# 3) Ověřit, že web odpovídá
fail=0
expect() { # expect <cesta> <očekávaný HTTP kód>
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' -A 'webtitan-deploy-check' "$SITE_URL/$1")"
  if [ "$code" = "$2" ]; then echo "  OK    /$1"; else echo "  CHYBA /$1 -> $code (čekáno $2)"; fail=1; fi
}
expect "" 200
for f in "$SITE"/*.html; do
  name="$(basename "$f")"
  [ "$name" = "index.html" ] || expect "$name" 200
done
for d in "$SITE"/*/; do        # podstránky ve složkách (např. /tvorba-webu/)
  [ -f "$d/index.html" ] && expect "$(basename "$d")/" 200
done
for d in "$SITE"/clanky/*/; do # jednotlivé články
  [ -f "$d/index.html" ] && expect "clanky/$(basename "$d")/" 200
done
expect robots.txt 200
expect sitemap.xml 200
expect neexistujici-stranka-test 404   # vlastní stránka 404 přes index.php
expect assets/fonts/unbounded-latin.woff2 200
expect assets/lead.js 200    # formulář na podstránkách, okno při odchodu, odkud návštěvník přišel
expect assets/lead.css 200
expect assets/consent.js 200 # lišta souhlasu + konverze Sklik / Google Ads (bez ID v CONFIG nedělá nic)
expect api/contact.php 405   # přijímá jen POST – GET nic neodesílá
expect api/inbound.php 405   # webhook Resendu – jen POST s podpisem
expect api/_mail.php 404     # sdílená knihovna – zvenku se nespouští
expect api/health.php 200    # „OK“ = konfigurace v pořádku a žádná nedoručená poptávka ani příchozí e-mail
if [ "$fail" -ne 0 ]; then echo "Nasazení proběhlo, ale něco na webu neodpovídá." >&2; exit 1; fi
echo "Hotovo: $SITE_URL/"
