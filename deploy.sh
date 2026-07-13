#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/socialecommerce}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
BACKEND_NAME="${BACKEND_NAME:-social-backend}"
FRONTEND_NAME="${FRONTEND_NAME:-social-frontend}"
BACKEND_PORT="${BACKEND_PORT:-5000}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf '\nDeployment failed: %s\n' "$*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git is not installed."
command -v npm >/dev/null 2>&1 || fail "npm is not installed."
command -v pm2 >/dev/null 2>&1 || fail "PM2 is not installed. Run: npm install -g pm2"
command -v curl >/dev/null 2>&1 || fail "curl is not installed."
command -v flock >/dev/null 2>&1 || fail "flock is not installed (package: util-linux)."

[[ -d "$APP_DIR/.git" ]] || fail "$APP_DIR is not a Git repository."
cd "$APP_DIR"

exec 9>"/tmp/socialecommerce-deploy.lock"
flock -n 9 || fail "Another deployment is already running."

if [[ -n "$(git status --porcelain)" ]]; then
  git status --short
  fail "Working tree is not clean. Commit or stash the changes before deploying."
fi

log "Fetching origin/$DEPLOY_BRANCH"
git fetch origin "$DEPLOY_BRANCH"

CURRENT_BRANCH="$(git branch --show-current)"
[[ "$CURRENT_BRANCH" == "$DEPLOY_BRANCH" ]] || fail "Expected branch '$DEPLOY_BRANCH', currently on '$CURRENT_BRANCH'."

log "Fast-forwarding application code"
git merge --ff-only "origin/$DEPLOY_BRANCH"

[[ -f .env ]] || fail ".env is missing. Copy .env.example to .env and configure production values."
grep -Eq '^(MONGODB_URI|DATABASE_URL)=' .env || fail "MONGODB_URI is missing from .env."
grep -Eq '^JWT_SECRET=.{32,}' .env || fail "JWT_SECRET must contain at least 32 characters."
grep -Eq '^NEXT_PUBLIC_API_URL=' .env || fail "NEXT_PUBLIC_API_URL is missing from .env."

log "Installing locked dependencies"
npm ci

log "Running TypeScript validation"
npm run typecheck

log "Building the Next.js frontend"
npm run build

mkdir -p "${UPLOAD_DIR:-$APP_DIR/uploads}"

log "Starting Mongoose backend with PM2"
if pm2 describe "$BACKEND_NAME" >/dev/null 2>&1; then
  pm2 delete "$BACKEND_NAME"
fi
NODE_ENV=production pm2 start npm --name "$BACKEND_NAME" --cwd "$APP_DIR" -- run start:backend

log "Waiting for backend health check"
BACKEND_READY=false
for _ in $(seq 1 30); do
  if curl --fail --silent --show-error "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null; then
    BACKEND_READY=true
    break
  fi
  sleep 1
done

if [[ "$BACKEND_READY" != "true" ]]; then
  pm2 logs "$BACKEND_NAME" --lines 50 --nostream || true
  fail "Backend did not become healthy on port $BACKEND_PORT."
fi

log "Starting Next.js frontend with PM2"
if pm2 describe "$FRONTEND_NAME" >/dev/null 2>&1; then
  pm2 delete "$FRONTEND_NAME"
fi
NODE_ENV=production pm2 start npm --name "$FRONTEND_NAME" --cwd "$APP_DIR" -- start -- -p 3000

pm2 save

log "Deployment completed"
pm2 status "$BACKEND_NAME" "$FRONTEND_NAME"
printf '\nFrontend: http://127.0.0.1:3000\nBackend:  http://127.0.0.1:%s\n' "$BACKEND_PORT"
