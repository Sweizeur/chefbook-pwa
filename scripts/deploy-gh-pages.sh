#!/bin/bash

set -e  # Exit on error

echo "🚀 Déploiement sur GitHub Pages..."

# Vérifier qu'on est sur la branche main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Attention: vous n'êtes pas sur la branche main (actuellement: $CURRENT_BRANCH)"
  read -p "Continuer quand même? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build web
echo "📦 Build de la version web..."
npx expo export --platform web

# Copier les fichiers PWA si nécessaire
if [ -f "public/manifest.json" ]; then
  echo "📱 Copie des fichiers PWA..."
  cp public/manifest.json dist/ 2>/dev/null || true
fi

# Sauvegarder l'état actuel
echo "💾 Sauvegarde de l'état actuel..."
git stash

# Passer sur gh-pages
echo "🔄 Passage sur la branche gh-pages..."
git checkout gh-pages

# Supprimer tous les fichiers sauf .git
echo "🧹 Nettoyage de la branche gh-pages..."
git rm -rf . 2>/dev/null || true

# Copier les fichiers du build
echo "📋 Copie des fichiers du build..."
cp -R dist/* .

# Ajouter tous les fichiers
git add .

# Commit
echo "💬 Création du commit..."
git commit -m "Deploy latest web build - $(date +'%Y-%m-%d %H:%M:%S')" || {
  echo "⚠️  Aucun changement à commiter"
}

# Push
echo "⬆️  Push vers GitHub..."
git push origin gh-pages

# Revenir sur main
echo "🔄 Retour sur la branche main..."
git checkout main

# Restaurer l'état
echo "📦 Restauration de l'état..."
git stash pop 2>/dev/null || true

echo "✅ Déploiement terminé!"
echo "🌐 Le site sera disponible dans quelques minutes sur:"
echo "   https://sweizeur.github.io/chefbook-pwa/"

