#!/usr/bin/env bash
# Nasadí web webtitan.cz: zkopíruje sestavený web (web/dist/) na server do /var/www/webtitan/public_html.
# V GitHub Actions se web sestaví v samostatné úloze; ručně z počítače ho skript sestaví sám (viz níže).
#
# - Statický web z Astra + pár PHP endpointů (api/contact.php, api/inbound.php, api/health.php), žádný Docker.
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
SITE="$ROOT/web/dist"

SSH_OPTS=(-p "$PORT" -o BatchMode=yes -o ConnectTimeout=20)
if [ -n "${DEPLOY_KEY:-}" ]; then SSH_OPTS+=(-i "$DEPLOY_KEY" -o IdentitiesOnly=yes); fi
if [ -n "${DEPLOY_KNOWN_HOSTS:-}" ]; then SSH_OPTS+=(-o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS" -o StrictHostKeyChecking=yes); fi

# Ručně z počítače jde nasadit jen commitnutý stav, který není starší než GitHub. Necommitnuté změny by se jinak
# dostaly na web, aniž by byly v gitu, a starší checkout by web vrátil zpátky. (V GitHub Actions je checkout čistý.)
if [ -z "${CI:-}" ]; then
  dirty="$(git -C "$ROOT" status --porcelain -- web scripts)"
  if [ -n "$dirty" ]; then
    echo "Ve web/ nebo scripts/ jsou necommitnuté změny – nasadit jde jen commitnutý stav:" >&2
    echo "$dirty" | head -20 >&2
    echo "Commitni je a pushni do main (web se pak nasadí sám), nebo je odlož: git stash -u" >&2
    exit 1
  fi
  git -C "$ROOT" fetch --quiet origin main || { echo "Nejde načíst origin/main z GitHubu." >&2; exit 1; }
  if ! git -C "$ROOT" merge-base --is-ancestor origin/main HEAD; then
    echo "Na GitHubu (origin/main) je novější stav než u tebe – nasazení by web vrátilo zpátky. Nejdřív git pull." >&2
    exit 1
  fi
  ahead="$(git -C "$ROOT" rev-list --count origin/main..HEAD)"
  if [ "$ahead" -gt 0 ]; then
    echo "Pozor: $ahead commit(ů) ještě není na GitHubu – po pushi do main se web nasadí znovu sám."
  fi
  echo "Nasazuji commit $(git -C "$ROOT" log -1 --format='%h %s')"
fi

# Node podle web/.nvmrc (stejná verze jako v GitHub Actions). Když je v počítači výchozí jiná (Astro starší odmítne),
# vezme se nejnovější odpovídající verze z nvm – jen pro tenhle skript, výchozí Node se nemění.
use_node() {
  local need have dir
  need="$(tr -d '[:space:]' < "$ROOT/web/.nvmrc")"
  have="$(node -v 2>/dev/null || true)"
  case "$have" in "v$need".*) return 0 ;; esac
  dir="$(ls -d "${NVM_DIR:-$HOME/.nvm}/versions/node/v$need."* 2>/dev/null | sort -V | tail -1 || true)"
  if [ -n "$dir" ]; then PATH="$dir/bin:$PATH"; fi
  have="$(node -v 2>/dev/null || true)"
  case "$have" in
    "v$need".*) echo "Node $have (podle web/.nvmrc)" ;;
    *) echo "Na sestavení je potřeba Node $need (web/.nvmrc), teď je ${have:-žádný}. Nainstaluj: nvm install $need" >&2
       exit 1 ;;
  esac
}

# Ručně z počítače se web před nahráním vždy sestaví – jinak by se mohl nahrát starý web/dist/. V GitHub Actions
# (CI=true) přichází web/dist/ hotový z úlohy build a npm se tu záměrně nespouští (vedle SSH klíče).
# SKIP_BUILD=1 sestavení přeskočí (web/dist/ je čerstvě sestavený).
if [ -z "${CI:-}" ] && [ -z "${SKIP_BUILD:-}" ]; then
  use_node
  echo "Sestavuji web (npm ci, check a build ve web/, stejně jako GitHub Actions)…"
  npm --prefix "$ROOT/web" ci
  npm --prefix "$ROOT/web" run check
  npm --prefix "$ROOT/web" run build
fi

for f in index.html api/contact.php; do
  [ -f "$SITE/$f" ] || { echo "Chybí web/dist/$f – je web sestavený (cd web && npm run build)?" >&2; exit 1; }
done
echo "Nasazuji $(find "$SITE" -type f ! -name .DS_Store | wc -l | tr -d ' ') souborů z web/dist/"

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

# health.php: 200 „OK“, nebo 503 „FAIL …“. S nasazením souvisí jen „config“ (chybí contact.env) a „db“ (databáze
# nejde otevřít). „leads:N“, „crm:N“, „inbound:N“ jsou stav doručování poptávek (hlídá ho UptimeRobot) – kvůli
# nim nasazení neselže, jen se vypíšou. (Volání zároveň zkusí neodeslané poptávky doručit, stejně jako UptimeRobot.)
health="$(curl -s -w '\n%{http_code}' -A 'webtitan-deploy-check' "$SITE_URL/api/health.php" || true)"
health_code="${health##*$'\n'}"
health_body="${health%$'\n'*}"
health_body="${health_body%$'\n'}"
case "$health_code" in
  200) echo "  OK    /api/health.php" ;;
  503)
    if grep -qwE 'config|db' <<<"$health_body"; then
      echo "  CHYBA /api/health.php -> $health_body"; fail=1
    else
      echo "  POZOR /api/health.php -> $health_body (doručování poptávek, s nasazením nesouvisí)"
    fi ;;
  *) echo "  CHYBA /api/health.php -> $health_code (čekáno 200 nebo 503)"; fail=1 ;;
esac
if [ "$fail" -ne 0 ]; then echo "Nasazení proběhlo, ale něco na webu neodpovídá." >&2; exit 1; fi
echo "Hotovo: $SITE_URL/"
