# Sitemap ZTVPlus - Documentation

## 📋 Vue d'ensemble

Ce projet inclut un système complet de génération de sitemap pour optimiser le référencement de ZTVPlus sur les moteurs de recherche.

## 🚀 Fonctionnalités

- **Génération automatique** du sitemap avec les films et séries depuis Supabase
- **Mise à jour automatique** via Cron Job sur Vercel
- **API Routes** pour régénérer le sitemap à la demande
- **Support Vercel** avec configuration intégrée

## 📁 Fichiers créés

### Fichiers publics
- `public/sitemap.xml` - Sitemap principal (généré automatiquement)
- `public/robots.txt` - Fichier robots.txt pour les moteurs de recherche
- `public/sitemap-index.xml` - Index des sitemaps

### Scripts
- `scripts/generate-sitemap-local.js` - Script de génération local
- `scripts/postbuild.js` - Script exécuté après le build

### API Routes
- `app/api/sitemap/route.ts` - API GET pour récupérer le sitemap
- `app/api/sitemap/update/route.ts` - API POST pour mettre à jour le sitemap

### Configuration
- `vercel.json` - Configuration Cron Job Vercel
- `package.json` - Scripts npm ajoutés

## 🛠 Utilisation

### Commandes npm

```bash
# Générer le sitemap manuellement
npm run sitemap

# Build avec génération automatique du sitemap
npm run build

# Build spécifique avec sitemap
npm run build:sitemap
```

### API Routes

#### Récupérer le sitemap (GET)
```bash
curl https://ztvplus.fr/api/sitemap
```

#### Mettre à jour le sitemap (POST)
```bash
curl -X POST https://ztvplus.fr/api/sitemap/update \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET"
```

### Variables d'environnement

Ajoutez ces variables dans votre `.env.local` :

```env
# Token pour sécuriser la mise à jour du sitemap
SITEMAP_REGENERATION_TOKEN=votre_token_secret

# URL de votre site
NEXT_PUBLIC_SITE_URL=https://ztvplus.fr
```

## ⚙ Configuration Vercel

### Cron Job automatique
Le fichier `vercel.json` configure un Cron Job qui exécute `/api/sitemap` tous les jours à 2h du matin.

```json
{"crons": [{"path": "/api/sitemap", "schedule": "0 2 * * *"}]}
```

### Déploiement
1. Poussez votre code sur GitHub
2. Déployez sur Vercel
3. Configurez les variables d'environnement dans Vercel
4. Le Cron Job sera automatiquement configuré

## 🌐 Accès au sitemap

Une fois déployé, votre sitemap sera accessible à :
- `https://ztvplus.fr/sitemap.xml`
- `https://ztvplus.fr/robots.txt`
- `https://ztvplus.fr/api/sitemap`

## 📊 Contenu du sitemap

Le sitemap inclut :

### Pages statiques (priorité élevée)
- Page d'accueil (`/`) - priority: 1.0
- Browse (`/browse`) - priority: 0.9
- Agenda (`/agenda`) - priority: 0.8
- etc.

### Pages dynamiques (depuis Supabase)
- Pages des films (`/movies/{id}-{slug}`) - priority: 0.8
- Pages de watch des films (`/watch/{id}`) - priority: 0.7
- Pages des séries (`/series/{id}-{slug}`) - priority: 0.8
- Pages des épisodes (`/watch/series/{id}/{season}/{episode}`) - priority: 0.6

## 🔧 Personnalisation

### Ajouter des pages statiques
Modifiez le tableau `staticPages` dans les fichiers API :

```typescript
const staticPages = [
  { url: '/nouvelle-page', changefreq: 'weekly', priority: 0.8 },
  // ...
]
```

### Modifier les priorités
Adaptez les valeurs `priority` selon l'importance des pages :
- `1.0` - Page d'accueil
- `0.9` - Pages très importantes
- `0.8` - Pages importantes
- `0.7` - Pages moyennes
- `0.6` - Pages moins importantes
- `0.5` - Pages secondaires

### Fréquences de mise à jour
- `daily` - Pages mises à jour quotidiennement
- `weekly` - Pages mises à jour hebdomadairement
- `monthly` - Pages mises à jour mensuellement
- `yearly` - Pages mises à jour annuellement

## 🐛 Dépannage

### Erreur 401 sur l'API
Vérifiez que vous utilisez le bon token dans `Authorization: Bearer VOTRE_TOKEN`.

### Sitemap vide
Assurez-vous que les variables d'environnement Supabase sont correctement configurées.

### Cron Job ne fonctionne pas
Vérifiez que le fichier `vercel.json` est bien présent et que le déploiement Vercel inclut les Cron Jobs.

## 📈 Monitoring

### Google Search Console
1. Allez dans Google Search Console
2. Ajoutez votre propriété `https://ztvplus.fr`
3. Soumettez votre sitemap : `https://ztvplus.fr/sitemap.xml`

### Autres moteurs de recherche
- **Bing Webmaster Tools** : Soumettez `https://ztvplus.fr/sitemap.xml`
- **Yandex Webmaster** : Soumettez `https://ztvplus.fr/sitemap.xml`

## 🔄 Mises à jour futures

Idées d'amélioration :
- Ajouter les images dans le sitemap
- Créer plusieurs sitemaps (films, séries, épisodes)
- Ajouter les vidéos dans le sitemap
- Intégrer avec Google Analytics pour suivre les pages indexées

---

**Dernière mise à jour : 30/11/2025**
**Version : v4.21**
