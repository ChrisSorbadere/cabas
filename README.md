# Cabas

Liste de courses par rayon (français / espagnol), magasins proches, suivi des prix, conseils d'achat et partage en direct entre deux téléphones.

Application : https://chrissorbadere.github.io/cabas/

## Partage en direct : mise en place (une seule fois)

1. Créer une feuille Google Sheets (n'importe quel nom).
2. Extensions › Apps Script : remplacer le contenu par `apps-script/Code.gs`.
3. Déployer › Nouveau déploiement › type « Application Web ».
   - Exécuter en tant que : moi
   - Qui a accès : tout le monde
4. Copier l'URL `https://script.google.com/macros/s/…/exec`.
5. Dans Cabas : Plus › Partage en direct, coller l'URL, indiquer son prénom, puis « Partager ».
6. « Inviter par WhatsApp » : l'autre téléphone ouvre le lien, indique son prénom et rejoint la liste (l'URL du script est transmise avec l'invitation).

Toute personne qui possède l'URL du script et le code de la liste peut lire et modifier cette liste.

## Sources de données

- Magasins : © contributeurs OpenStreetMap (Overpass, Nominatim)
- Produits : Open Food Facts
- Prix communautaires : Open Prices (ODbL)
