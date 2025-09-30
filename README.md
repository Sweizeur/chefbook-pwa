# RecetteApp - Application de Gestion de Recettes

Une application React Native élégante et moderne pour gérer vos recettes de cuisine sur iOS (iPhone et iPad).

## 🍽️ Fonctionnalités

### Gestion des Recettes
- ✅ Ajouter, modifier et supprimer des recettes
- ✅ Ajouter des photos à vos recettes
- ✅ Organiser par catégories personnalisables
- ✅ Temps de préparation
- ✅ Liste d'ingrédients
- ✅ Instructions étape par étape

### Gestion des Catégories
- ✅ Créer des catégories personnalisées
- ✅ Choisir des couleurs pour chaque catégorie
- ✅ Modifier et supprimer des catégories

### Partage
- ✅ Partager vos recettes sous forme d'image
- ✅ Partage via Messages, WhatsApp, Mail, etc.
- ✅ Image générée automatiquement avec toutes les informations

### Design
- ✅ Thème sombre élégant
- ✅ Interface moderne et intuitive
- ✅ Optimisé pour iPhone et iPad
- ✅ Animations fluides

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 16 ou plus récente)
- npm ou yarn
- Expo CLI
- iOS Simulator ou appareil iOS

### Installation
```bash
# Cloner le projet
cd RecetteApp

# Installer les dépendances
npm install

# Lancer l'application
npm run ios
```

### Commandes Disponibles
```bash
npm run ios          # Lancer sur iOS Simulator
npm run android      # Lancer sur Android (non supporté dans cette version)
npm run web          # Lancer sur navigateur web
npm start            # Démarrer le serveur de développement
```

## 📱 Utilisation

### Ajouter une Recette
1. Appuyez sur le bouton "+" en bas à droite
2. Ajoutez une photo (optionnel)
3. Saisissez le titre de la recette
4. Sélectionnez une catégorie
5. Indiquez le temps de préparation
6. Ajoutez les ingrédients (un par ligne)
7. Ajoutez les instructions (une par ligne)
8. Appuyez sur "Créer"

### Gérer les Catégories
1. Allez dans l'onglet "Catégories"
2. Appuyez sur "+" pour créer une nouvelle catégorie
3. Choisissez un nom et une couleur
4. Modifiez ou supprimez les catégories existantes

### Partager une Recette
1. Ouvrez une recette
2. Appuyez sur "Partager"
3. Choisissez l'application de partage
4. L'image sera générée automatiquement

## 🛠️ Technologies Utilisées

- **React Native** avec Expo
- **TypeScript** pour la sécurité des types
- **React Navigation** pour la navigation
- **AsyncStorage** pour le stockage local
- **Expo Image Picker** pour la sélection d'images
- **Expo Sharing** pour le partage
- **Expo File System** pour la gestion des fichiers

## 📁 Structure du Projet

```
src/
├── constants/
│   └── colors.ts          # Palette de couleurs
├── navigation/
│   └── AppNavigator.tsx   # Configuration de navigation
├── screens/
│   ├── RecipeListScreen.tsx      # Liste des recettes
│   ├── RecipeDetailScreen.tsx    # Détail d'une recette
│   ├── RecipeFormScreen.tsx      # Formulaire d'ajout/édition
│   └── CategoryManagementScreen.tsx # Gestion des catégories
├── services/
│   ├── storage.ts         # Service de stockage local
│   └── shareService.ts    # Service de partage
└── types/
    └── index.ts           # Types TypeScript
```

## 🎨 Personnalisation

### Couleurs
Les couleurs sont définies dans `src/constants/colors.ts`. Vous pouvez facilement modifier la palette pour personnaliser l'apparence de l'application.

### Catégories par Défaut
L'application commence avec des catégories vides. Vous pouvez ajouter des catégories par défaut en modifiant le service de stockage.

## 📝 Notes Importantes

- **Stockage Local** : Toutes les données sont stockées localement sur l'appareil
- **Pas de Backend** : Aucune donnée n'est envoyée sur internet
- **iOS Uniquement** : Cette version est optimisée pour iOS (iPhone et iPad)
- **Partage d'Images** : Les recettes partagées sont générées sous forme d'images SVG

## 🔧 Développement

### Ajouter de Nouvelles Fonctionnalités
1. Créez les types nécessaires dans `src/types/index.ts`
2. Ajoutez la logique dans les services appropriés
3. Créez ou modifiez les écrans
4. Mettez à jour la navigation si nécessaire

### Tests
L'application peut être testée sur :
- iOS Simulator (recommandé)
- Appareil iOS physique
- Expo Go (pour les tests rapides)

## 📄 Licence

Ce projet est créé à des fins éducatives et personnelles.

---

**RecetteApp** - Gardez vos recettes organisées et partagez-les facilement ! 🍳✨
