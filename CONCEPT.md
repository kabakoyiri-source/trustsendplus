# Trust Concept — proposition indépendante de redesign

## Références et direction visuelle

La page officielle https://trustwallet.com/download consultée le 30 octobre 2026 affiche iOS 26.43.14. La provenance de version des captures utilisateur n'est pas vérifiée. Elles constituent la référence visuelle principale : fond clair, grands montants, cartes gris perle, quatre actions rapides, accent bleu violet, navigation flottante. Les écrans complémentaires sont des propositions originales, sans prétendre reproduire une version officielle.

Direction : typographie système iOS, mise en page mobile, marges de 22 px, cibles tactiles généreuses, surfaces arrondies de 17 à 28 px, modes clair et sombre, zones de sécurité iOS. Navigation : Accueil, Marchés, Earn, Explorer, Recherche. Les réglages et l'activité restent accessibles depuis l'en-tête.

## Inventaire réalisé

| Famille | Écrans et interactions |
| --- | --- |
| Entrée | Accès direct au code PIN à six chiffres, écran épuré suivant la référence, clavier tactile et physique, erreur PIN, verrouillage |
| Portefeuille | Solde masquable, liste des tokens, actifs favoris, sélection réseau, personnalisation |
| Marchés | Tendances, favoris, gagnants, recherche, fiches d'actifs, six périodes de graphique et inspection au pointeur |
| Envoi | Destinataire fictif, carnet de trois contacts, sélection d'actif, montant, maximum, solde insuffisant, vérification, confirmation |
| Réception | Motif décoratif explicitement non scannable, identifiant fictif copiable, crédit simulé |
| Swap | Choix source et destination, inversion, taux figé, tolérance illustrative, revue et confirmation |
| Achat | Crédit fictif sans paiement, revue, confirmation |
| Activité | Historique local par portefeuille, filtres, détails et identifiants locaux |
| Earn | Allocations de session, actifs de staking, fiche validateur fictif, parcours de simulation |
| Explorer | Aperçus de dApps, fenêtre de connexion fictive, assistant préécrit |
| Autres explorations | Contrats perpétuels illustratifs, scénario Long/Short sans ordre, prédictions sans mise |
| Portefeuilles | Ajout d'espace, sélection, renommage, soldes indépendants |
| Réglages | Fonds fictifs, tokens, réseaux, notifications locales, sécurité, préférences, profil, installation, à propos |
| Modales | Réseaux, actifs, devises, tolérance, connexion, création/renommage, réinitialisation avec confirmation |
| PWA | Bouclier bleu avec dégradé vert, icônes et favicon assortis, manifeste, cache du build, mode standalone |

## Périmètre et limites

- Aucun backend, appel API, blockchain, génération de wallet, clé, phrase de récupération ou transaction réelle dans le nouveau point d'entrée.
- Données et cours fictifs. Taux d'affichage figés : 1 EUR = 1,114 USD ou 655,957 XOF.
- Le PIN fixe 787878 est une barrière de présentation, pas une mesure de sécurité. Ne pas saisir de secret réel.
- Les portefeuilles, soldes, préférences et opérations persistent dans localStorage sous `trust-concept-local-v1`. L'allocation Earn n'est conservée que pendant la session.
- Ancien projet bancaire conservé dans les anciens modules de `src` pour référence. Il n'est plus importé par `src/main.jsx`. Ses tests historiques ne valident pas le nouveau concept.
- iPhone Safari et installation physique doivent être contrôlés sur appareil réel après publication. Les tests automatisés utilisent WebKit et des dimensions mobiles, ce qui ne remplace pas un iPhone.
- Aucune affiliation à Trust Wallet. Les logos de tokens sont des représentations typographiques locales, pas des ressources officielles.

## Lancer et valider

```sh
npm install
npm run dev
npm run build
npm run verify:concept
```

Les captures de vérification sont générées dans `qa/concept`.

La suite WebKit sert les véritables fichiers compilés via interception locale des requêtes du navigateur, car les connexions loopback de WebKit ne sont pas disponibles dans cet environnement. Elle couvre le PIN, les erreurs de solde, les crédits fictifs, envois, swaps, achats, staking, historique, recherche, préférences, persistance, portefeuilles, réseaux/tokens, parcours Web3, modales et réinitialisation. Elle contrôle aussi cinq dimensions d'écran (320, 375, 393, 430 px et paysage 844 × 390), la position de la navigation, l'absence de débordement horizontal, les erreurs JavaScript et les requêtes externes. Le manifeste, les ressources du cache de production et l'exclusion des icônes des réécritures Vercel sont également vérifiés.

Cela ne valide pas l'installation physique sur iPhone, les notifications système ou le comportement réel du service worker dans Safari installé. Ces contrôles restent à faire après hébergement HTTPS.

## Déploiement Vercel gratuit

Importer le dépôt dans Vercel. Choisir `frontend` comme Root Directory si le dépôt contient le dossier parent ; si le dépôt commence directement par package.json, garder la racine. Framework : Vite. Build : `npm run build`. Output Directory : `dist`. Aucune variable d'environnement requise pour le concept. Ne pas importer les anciennes variables Supabase.

Une fois l'URL HTTPS disponible : Safari sur iPhone → Partager → Sur l'écran d'accueil → Ajouter. Ouvrir Trust Concept et entrer 787878. En cas d'ancienne version installée, fermer puis relancer l'application avec une connexion réseau pour mettre à jour son cache.

Avant présentation client : contrôler le plein écran, les zones sûres, les champs avec clavier iOS, le retour depuis chaque parcours, l'icône installée et le chargement hors ligne après une première ouverture connectée.
