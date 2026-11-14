#!/usr/bin/env bash
set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="mac-m1"
REMOTE_DIR="/Users/macminim1/docker/street-brawler"
HOMEPAGE_ICONS_DIR="/Users/macminim1/docker/homepage/config/icons"

echo "1/4 - Création du répertoire distant sur ${REMOTE_HOST}..."
ssh "${REMOTE_HOST}" "mkdir -p '${REMOTE_DIR}' '${HOMEPAGE_ICONS_DIR}'"

echo "2/4 - Synchronisation des fichiers du jeu vers ${REMOTE_HOST}:${REMOTE_DIR}..."
rsync -avz --delete \
  --exclude 'raw_assets' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  "${LOCAL_DIR}/" "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "3/4 - Déploiement de l'icône SVG dans Homepage..."
rsync -avz "${LOCAL_DIR}/street-brawler.svg" "${REMOTE_HOST}:${HOMEPAGE_ICONS_DIR}/street-brawler.svg"

echo "4/4 - Build et démarrage du conteneur OrbStack sur ${REMOTE_HOST}..."
ssh "${REMOTE_HOST}" 'bash -lc "
  export PATH=\"\$HOME/.orbstack/bin:/usr/local/bin:/opt/homebrew/bin:\$PATH\"
  cd \"'"${REMOTE_DIR}"'\"
  docker compose up -d --build
  docker ps --filter name=street-brawler
"'

echo "Déploiement terminé !"
