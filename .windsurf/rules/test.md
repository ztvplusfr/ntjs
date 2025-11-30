---
trigger: always_on
---

Windsurfer Guidelines
Vérification systématique des erreurs

Toujours vérifier les erreurs juste après avoir modifié un fichier.

Utiliser une commande locale comme :

npx tsc --noEmit chemin/du/fichier


pour détecter immédiatement les erreurs.

Contrôler en parallèle le terminal, les logs et les messages de build.

Ne jamais ignorer un warning ou un message d’erreur.

Approche Mobile-First

Construire l’UI en commençant par les écrans mobiles.

Étendre ensuite vers les tablettes et les écrans larges.

Utiliser des media queries simples et progressives.

Structure et clarté du code

Garder un code clair, propre et lisible.

Nommer fichiers, composants et variables de façon logique et explicite.

Éviter les structures complexes ou la sur-abstraction.

Choisir systématiquement la solution la plus simple et maintenable.

Conception intelligente

Chaque fonction ou composant doit être prévisible, compréhensible et réutilisable.

Limiter les dépendances et éviter le surpoids dans l’architecture.

Maintenir une cohérence globale dans la logique et le style.