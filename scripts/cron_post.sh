#!/usr/bin/env bash
# Wrapper pentru postarea automata thesite.ro pe Instagram (rulat din cron)
# Flux: genereaza continut proaspat -> posteaza via Playwright
set -uo pipefail

POST_TYPE="${1:-carousel}"
PROJECT_DIR="/home/brewuser/projects/thesite"
LOCK_FILE="/tmp/thesite_post.lock"
LOG_DIR="$PROJECT_DIR/social_export/logs"

mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/post_${POST_TYPE}_$(date +%F_%H%M).log"

(
flock -n 200 || { echo "[cron] Alta instanta ruleaza deja, skip."; exit 0; }

cd "$PROJECT_DIR"

if [ -f .env ]; then
  set -a; source .env; set +a
else
  echo "[cron] ATENTIE: .env lipsesc — nu am credentiale Instagram."
fi

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

echo "=== Pulling latest changes from main ==="
git pull origin main || echo "[cron] Git pull warning, continuing..."

if [ "$POST_TYPE" = "reel" ]; then
  echo "=== Generare Conținut Reel & Postare $(date '+%F %T') ==="
  if npm run generate:reel && node scripts/auto_post_reel.mjs; then
    echo "=== REEL SUCCESS $(date '+%F %T') ==="
    rm -f "$PROJECT_DIR/social_export/latest/"*.mp4 "$PROJECT_DIR/social_export/latest/"*.png 2>/dev/null || true
  else
    echo "=== REEL FAILED $(date '+%F %T') ==="
    exit 1
  fi
else
  echo "=== Generare Conținut Carousel & Postare $(date '+%F %T') ==="
  if npm run generate:social && node scripts/auto_post_playwright.mjs; then
    echo "=== CAROUSEL SUCCESS $(date '+%F %T') ==="
    rm -f "$PROJECT_DIR/social_export/latest/"*.png "$PROJECT_DIR/social_export/latest/"*.jpg 2>/dev/null || true
  else
    echo "=== CAROUSEL FAILED $(date '+%F %T') ==="
    exit 1
  fi
fi

# pastram doar ultimele 100 de loguri
ls -1t "$LOG_DIR"/post_*.log 2>/dev/null | tail -n +101 | xargs -r rm -f

) 200>"$LOCK_FILE" >>"$LOG" 2>&1

