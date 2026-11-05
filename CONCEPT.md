# Trust Concept — proposition indépendante de redesign

## Références et direction visuelle

La provenance de version des captures utilisateur n'est pas vérifiée. Elles constituent la référence visuelle principale : fond clair, grands montants, cartes gris perle, quatre actions rapides, accent bleu violet, navigation flottante. Les écrans d’accueil, de réception, de fiche actif, d’envoi, de marchés, de swap et de recherche reprennent les références fournies.

L’accueil après le PIN suit les trois captures de référence : carte de portefeuille jaune « Youg client », historique et scan, annonce bStocks, solde en euros, quatre actions, Tokens, Contrats perpétuels, Prédictions, Trust Wallet AI, liste de surveillance et personnalisation. L’en-tête remplace le nom par le solde pendant le défilement. La navigation flottante comporte trois icônes (Accueil, Marchés, Perpétuels) et une recherche séparée. Earn et le staking sont accessibles depuis les paramètres des Perpétuels, puis Explorer depuis Earn ; les réglages de l’application sont accessibles depuis le sélecteur de portefeuille.

La mise en page utilise des marges de 16 px, des icônes de tokens vectorielles, une police Inter locale avec sa licence, des cartes gris perle et des zones de sécurité iOS. Le mode sombre et les données locales sont conservés. La barre d’état et les indicateurs système du téléphone ne sont pas dessinés dans la page. Les trois captures de comparaison sont enregistrées dans `qa/concept/reference-01-home.png`, `reference-02-scroll.png` et `reference-03-watchlist.png` ; elles simulent une zone supérieure de sécurité de 59 px.

## Inventaire réalisé

| Famille | Écrans et interactions |
| --- | --- |
| Entrée | Accès direct au code PIN à six chiffres, écran épuré suivant la référence, clavier tactile et physique, erreur PIN, verrouillage |
| Portefeuille | Accueil conforme à l’ordre des captures, solde masquable, en-tête au défilement, tokens, contrats perpétuels, prédictions, assistant, surveillance et personnalisation |
| Marchés | Crypto/Stocks, Bluechips, tendances, favoris, émetteurs bStocks/Robinhood/Ondo, réseaux, tri, 31 actifs, prix et mini-courbes CoinGecko, fiches détaillées et sept périodes réelles de graphique |
| Envoi | Volet destinataire et volet montant selon les captures, carnet de trois contacts, collage, sélection d’actif, clavier numérique, conversion fiat, maximum, solde insuffisant, vérification et confirmation locale |
| Réception | Volet conforme à la référence, QR scannable encodant l’adresse publique affichée, validation du réseau, crypto et adresse modifiables, réglage Changer les adresses par crypto/portefeuille avec collage et remise par défaut, Copy/Share et dépôt Coinbase simulé |
| Swap | Deux cartes source/destination, inversion, clavier numérique, pourcentage du solde, taux actuel, tolérance et confirmation par glissement avant la revue locale |
| Recherche | Vue plein écran, consultations récentes, liste Tendance, Tokens/DApps, recherche et collage dans la barre flottante |
| Achat/Vente | Écrans des captures, devise/crypto, clavier, minimum illustratif, fournisseur indisponible et mode de simulation locale avec conversion fiat, revue et confirmation |
| Tous les tokens | Liste dédiée après Tout voir, recherche, valeurs et variations réelles appliquées aux soldes fictifs, accès séparé à la gestion des actifs |
| Activité | Vue Activity regroupée par date, filtres type/actif/origine, détails, simulations locales et transactions publiques du portefeuille surveillé |
| Earn | Allocations de session, actifs de staking, fiche validateur fictif, parcours de simulation |
| Explorer | Aperçus de dApps, fenêtre de connexion fictive, assistant préécrit |
| Perpétuels | Écran ∞ de référence, données et mini-courbes Hyperliquid, Dépôt fictif, Long/Short, marge/levier, clôture et historique locaux par portefeuille |
| Autres explorations | Prédictions sans mise |
| Portefeuilles | Liste des espaces enregistrés, ajout, méthodes de démonstration, nom/couleur/icône, suppression et lecture seule réelle par réseau/adresse |
| Réglages | Fonds fictifs, tokens, réseaux, notifications locales, sécurité, préférences, profil, installation, à propos |
| Modales | Réseaux, actifs, devises, tolérance, connexion, création/renommage, réinitialisation avec confirmation |
| PWA | Bouclier bleu avec dégradé vert, icônes et favicon assortis, manifeste, cache du build, mode standalone |

## Périmètre et limites

- Les cours du marché spot viennent de CoinGecko via `/api/market` et ceux des Perpétuels d’Hyperliquid via `/api/perpetuals`. Les portefeuilles de démonstration gardent leurs soldes fictifs. La lecture seule affiche les soldes et opérations publics via `/api/watch`, sans signer ni transmettre de transaction et sans demander de secret. Les opérations proposées dans l’application restent des simulations. Voir `MARKET_DATA.md` et `WATCH_WALLETS.md`.
- Les cours EUR et USD sont demandés dans la devise choisie. Le FCFA suit la cotation EUR avec la parité 655,957. Les anciennes données de marché figées ne sont plus affichées.
- Le PIN fixe 787878 est une barrière de présentation, pas une mesure de sécurité. Ne pas saisir de secret réel.
- Les portefeuilles, préférences et simulations persistent sous `trust-concept-local-v1`. Les instantanés des adresses publiques sont également gardés sous `trust-watch-v1:<réseau>:<adresse>`. Les simulations d’un portefeuille surveillé ne changent pas les soldes réels. L’allocation Earn n’est conservée que pendant la session.
- Ancien projet bancaire conservé dans les anciens modules de `src` pour référence. Il n'est plus importé par `src/main.jsx`. Ses tests historiques ne valident pas le nouveau concept.
- iPhone Safari et installation physique doivent être contrôlés sur appareil réel après publication. Les tests automatisés utilisent WebKit et des dimensions mobiles, ce qui ne remplace pas un iPhone.
- Aucune affiliation à Trust Wallet. Les actifs principaux et petites illustrations utilisent des dessins vectoriels locaux ; les autres logos de tokens proviennent des images publiques CoinGecko et sont conservés dans le projet.

## Lancer et valider

```sh
npm install
npm run dev
npm run build
npm run verify:concept
npm run verify:market
npm run verify:reference
npm run verify:secondary
npm run verify:perpetuals
npm run verify:watch-api
npm run verify:wallets
```

Les captures sont générées dans `qa/concept`, `qa/reference-flows`, `qa/secondary-flows` et `qa/wallet-flows`. Les scripts `verify-reference-flows.cjs`, `verify-secondary-flows.cjs` et `verify-wallet-flows.cjs` acceptent `--live` pour contrôler les interfaces avec les fournisseurs réels.

Les icônes sont générées par `node scripts/generate-concept-icons.cjs`. La révision `v3` utilise des URL distinctes pour le SVG compact, l’icône iPhone et les icônes Android. L’icône Android adaptative a ses propres marges. Toute modification ultérieure des icônes doit aussi changer leur URL dans le manifeste et les liens HTML : remplacer seulement les pixels d’une image à la même adresse ne suffit pas pour signaler une mise à jour d’icône aux versions récentes de Chrome. Le fallback `apple-touch-icon.png` est conservé, et les icônes référencées sont incluses dans le cache hors ligne.

La suite WebKit sert les véritables fichiers compilés via interception locale des requêtes du navigateur, car les connexions loopback de WebKit ne sont pas disponibles dans cet environnement. Elle couvre le PIN, les erreurs de solde, les crédits fictifs, envois, swaps, achats, staking, historique, recherche, préférences, persistance, portefeuilles, réseaux/tokens, parcours Web3, modales et réinitialisation. Elle contrôle aussi cinq dimensions d'écran (320, 375, 393, 430 px et paysage 844 × 390), la position de la navigation, l'absence de débordement horizontal, les erreurs JavaScript et les requêtes externes. Le manifeste, les ressources du cache de production et l'exclusion des icônes des réécritures Vercel sont également vérifiés.

Cela ne valide pas l'installation physique sur iPhone, les notifications système ou le comportement réel du service worker dans Safari installé. Ces contrôles restent à faire après hébergement HTTPS.

## Déploiement Vercel gratuit

Importer le dépôt dans Vercel. Choisir `frontend` comme Root Directory si le dépôt contient le dossier parent ; si le dépôt commence directement par package.json, garder la racine. Framework : Vite. Build : `npm run build`. Output Directory : `dist`. Aucune variable d'environnement requise pour le concept. Ne pas importer les anciennes variables Supabase.

Une fois l'URL HTTPS disponible : Safari sur iPhone → Partager → Sur l'écran d'accueil → Ajouter. Ouvrir Trust Concept et entrer 787878. En cas d'ancienne version installée, fermer puis relancer l'application avec une connexion réseau pour mettre à jour son cache.

Avant présentation client : contrôler le plein écran, les zones sûres, les champs avec clavier iOS, le retour depuis chaque parcours, l'icône installée et le chargement hors ligne après une première ouverture connectée.
