# Pokepedia

Pokepedia est un Pokédex web en français. Recherchez un Pokémon par son nom ou
son numéro, parcourez les suggestions de recherche et consultez ses principales
informations dans une interface adaptée aux écrans mobiles.

## Fonctionnalités

- Recherche avec suggestions en direct, mises à jour à chaque lettre saisie.
- Suggestions basées sur les noms français et anglais, sélectionnables à la
  souris ou au clavier (`↑`, `↓`, `Entrée` ; `Échap` ferme la liste).
- Affichage du numéro, du sprite et des types du Pokémon.
- Navigation vers le Pokémon précédent ou suivant dans le Pokédex.
- Onglets pour consulter les capacités, les informations de base (taille, poids
  et prochaine évolution) et les statistiques.
- Mise en page responsive pour ordinateur et mobile.

## Lancer le site

Le projet ne nécessite ni compilation ni installation de dépendances. Il faut
une connexion Internet pour charger les données de l'API Tyradex.

1. Ouvrez un terminal dans le dossier du projet.
2. Démarrez un serveur web local, par exemple avec Python 3 :

   ```sh
   python -m http.server 8000
   ```

3. Ouvrez [http://localhost:8000/pokepedia.html](http://localhost:8000/pokepedia.html)
   dans votre navigateur.
4. Pour arrêter le serveur, utilisez `Ctrl+C` dans le terminal.

Un serveur local est recommandé plutôt que l'ouverture directe du fichier HTML,
car le navigateur peut bloquer les requêtes vers l'API depuis une adresse
`file://`.

## Utilisation

Saisissez un nom dans la barre de recherche. La liste propose les correspondances
françaises et anglaises à mesure que vous tapez. Choisissez une suggestion ou
validez votre saisie avec le bouton de recherche ou la touche `Entrée`.

Les flèches situées sous les informations permettent de parcourir les Pokémon.
Les trois boutons centraux affichent les capacités, les informations de base et
les statistiques.

## Données

Les informations et les suggestions sont chargées depuis l'API
[Tyradex](https://tyradex.app/). La liste des Pokémon est récupérée à la
première saisie, puis filtrée dans le navigateur ; les détails sont chargés
lorsqu'un Pokémon est recherché ou sélectionné.

## Fichiers du projet

```text
pokepedia/
├── images/
│   └── pokeball.png   # Icône du bouton de recherche
├── pokepedia.html     # Structure de la page
├── styles.css         # Présentation et mise en page responsive
├── script.js          # Recherche, suggestions et affichage des données
└── README.md          # Documentation du projet
```
