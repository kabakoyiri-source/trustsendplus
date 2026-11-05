# Marchés et réception

Les cours et graphiques sont fournis par CoinGecko. Les réceptions, achats, ventes et échanges restent des simulations locales. Le mode lecture seule affiche également des soldes et historiques publics réels, sans les modifier : voir `WATCH_WALLETS.md`.

## API du site

La fonction `api/market.js` est déployée automatiquement par Vercel. Le serveur Vite expose la même route en développement avec `npm run dev`.

- `/api/market?type=markets&currency=eur` : prix, variation et volume sur 24 heures, capitalisation, FDV, offre et historique miniature sur sept jours des 31 actifs du catalogue.
- `/api/market?type=chart&asset=eth&currency=usd&days=365` : historique réel. Les périodes de 15 minutes à un jour utilisent les points de la dernière journée ; une semaine, un mois et un an utilisent leurs historiques respectifs.
- `/api/market?type=detail&asset=eth&currency=usd` : description et liens publics.

Les actifs, périodes, devises et fournisseurs autorisés sont limités côté serveur. Aucune URL de proxy arbitraire n’est acceptée. Le cache regroupe les requêtes et conserve les cours une minute, les historiques longs cinq minutes et les fiches trente minutes. Le navigateur rafraîchit les cours environ chaque minute lorsque l’application est visible, ainsi qu’au retour en ligne.

Les prix sont demandés dans la devise choisie. Le FCFA utilise la cotation EUR multipliée par la parité 655,957 ; aucun ancien taux USD fixe n’est appliqué.

Le catalogue partagé `src/concept/asset-catalog.json` associe chaque actif à son identifiant CoinGecko vérifié. Il comprend les cryptos principales, les tokens de la liste Tendance et les actions tokenisées bStocks, Robinhood et Ondo. Les cours des actions tokenisées correspondent à ces tokens précis. Les images supplémentaires sont conservées dans `public/tokens` et dans le cache PWA. Les mini-courbes des listes utilisent les points fournis par CoinGecko ; elles ne sont pas générées à partir de formes décoratives.

L’onglet Markets propose Crypto/Stocks, les émetteurs, les favoris, le filtrage par réseau et le tri par volume ou capitalisation. La recherche propose les dernières consultations, les tokens, les DApps et le collage depuis le presse-papiers. Les filtres et les recherches récentes sont conservés localement.

L’accès public sans clé a été vérifié. En cas de limitation sur l’hébergement, une clé Demo CoinGecko peut être configurée dans Vercel avec la variable serveur `COINGECKO_DEMO_API_KEY`. Ne pas lui ajouter le préfixe `VITE_` et ne pas la placer dans le code client.

Si CoinGecko est indisponible, les dernières données connues sont signalées comme anciennes. En l’absence d’historique disponible, l’interface affiche une erreur avec un bouton Retry ; aucune courbe fictive n’est substituée. Les champs non fournis (liquidité, détenteurs, audit de sécurité) restent à `--`.

## Réception

Le volet de réception reprend la référence : badge réseau, carte QR, adresse, Copy/Share et bouton Coinbase. La crypto et l’adresse affichée peuvent être modifiées ; les adresses sont conservées par portefeuille et actif.

Réglages → **Changer les adresses**, juste sous Ajouter des fonds fictifs, permet aussi de choisir une crypto, rechercher un token, saisir ou coller son adresse de réception, la valider et l’enregistrer. Le bouton Voir le QR code ouvre Recevoir avec cette crypto. Utiliser l’adresse par défaut retire uniquement la personnalisation de cette crypto et de ce portefeuille. Cet écran et Recevoir utilisent la même configuration ; les soldes et l’adresse blockchain surveillée ne sont pas modifiés.

Le QR est généré dans le navigateur à partir de l’adresse publique affichée, avec correction d’erreurs élevée et marge blanche de quatre modules. Le logo central suit la crypto sélectionnée. Changer l’adresse recalcule le QR ; deux cryptos ayant la même adresse ont le même contenu encodé. Copy et Share utilisent aussi cette adresse. Aucun service QR externe n’est contacté.

Les réseaux EVM reprennent par défaut l’adresse fournie `0x91237DB0DAFBC93195b7CcAcEbA9D0a2EB654935`. Les autres réseaux demandent une adresse réelle saisie par l’utilisateur ; aucune adresse fictive ni adresse EVM incompatible n’est utilisée en remplacement. Les formats, tailles Base58 et checksums Bitcoin/Tron sont contrôlés avant affichage du QR. Une adresse invalide ou absente ne produit aucun QR et ne peut pas être copiée ou partagée. Les adresses enregistrées restent propres au portefeuille et à l’actif. Le bouton Coinbase conserve son parcours de simulation locale.

`public/receive-qr.svg` contient aussi le QR de l’adresse Ethereum par défaut ; régénération : `node scripts/generate-receive-qr.cjs`. L’application utilise la génération dynamique dans `src/concept/receive-qr.mjs`.

## Vérifications

```text
npm run build
npm run verify:market
npm run verify:concept
npm run verify:reference
node scripts/verify-reference-flows.cjs --live
```

Les tests d’API couvrent les paramètres refusés, le cache, la mutualisation, les pannes, les points historiques et les devises. Les tests WebKit utilisent un fournisseur simulé pour être reproductibles et contrôlent aussi les changements de crypto/adresse, Copy/Share, le QR encodant l’adresse affichée, les périodes et l’absence de fausse courbe lors d’une panne. Les accès au fournisseur réel sont vérifiés séparément.

`verify:reference` contrôle les six nouveaux écrans sur cinq tailles de fenêtre : envoi au destinataire, montant, marchés Crypto, marchés Stocks, swap et recherche. Il couvre également le carnet d’adresses, le collage, le clavier, Max, le solde insuffisant, les filtres, le glissement de confirmation et les recherches récentes. L’option `--live` utilise le véritable fournisseur et génère les captures correspondantes dans `qa/reference-flows`.

## Acheter, vendre et tous les tokens

Acheter/Vendre reprend les onglets, les sélecteurs devise/crypto et le clavier numérique des captures. Aucun fournisseur de paiement n’est intégré : Google Pay apparaît indisponible et Continuer reste désactivé. Le choix explicite « Simulation locale » dans Payer avec (ou le message de fournisseur) permet de conserver le parcours de démonstration. Le montant d’achat est saisi en monnaie et converti en unités de token avec la cotation actuelle ; la vente utilise les unités du token. Le retour depuis la vérification conserve le montant saisi et le mode local. Les minimums sont des règles de présentation de la simulation, pas des conditions d’un prestataire réel.

« Tout voir » et le titre Tokens ouvrent une liste dédiée des actifs visibles, des tokens détenus et des actifs ETH/BNB/SOL. La loupe filtre cette liste ; les curseurs ouvrent la gestion des actifs. Les valeurs et variations utilisent les soldes locaux et la variation réelle sur 24 heures.

## Perpétuels

L’icône ∞ et les liens Contrats perpétuels ouvrent le même écran. `/api/perpetuals?type=perpetuals` interroge uniquement l’API publique Hyperliquid : [`metaAndAssetCtxs`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals) pour prix de référence, variation depuis la veille, volume notionnel et levier maximal ; [`candleSnapshot`](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#candle-snapshot) pour 24 heures de clôtures à intervalles de 30 minutes.

Les sept contrats autorisés sont BTC, HYPE, ETH, ZEC, SOL, XRP et DOGE. Le serveur met en cache les cotations 30 secondes et les bougies une minute, mutualise les appels concurrents et signale les anciennes données lors d’une panne. Une courbe indisponible reste vide. Les montants de cet écran sont en USD.

Dépôt ajoute des dollars fictifs au solde Perpétuels du portefeuille local. Long/Short ouvre un aperçu puis crée une position simulée avec marge et levier ; la clôture utilise le dernier prix disponible, sans frais ni financement et avec perte limitée à la marge. Ces positions ne sont pas une reproduction du moteur de liquidation d’une plateforme. Les soldes, positions et historiques restent dans localStorage, séparés par portefeuille. Aucun compte, secret, dépôt blockchain ou ordre n’est envoyé à Hyperliquid. Earn et le staking restent accessibles dans les paramètres de cette rubrique.

```text
npm run verify:perpetuals
npm run verify:secondary
node scripts/verify-secondary-flows.cjs --live
```

La dernière commande vérifie les cinq nouvelles captures avec CoinGecko et Hyperliquid, puis les écrit dans `qa/secondary-flows`. Les contrôles incluent le focus sans cadre bleu, les onglets achat/vente, les fournisseurs indisponibles, la conversion fiat, l’édition avant confirmation, les tokens, les dépôts fictifs, l’ouverture/clôture, l’historique et la persistance sur cinq tailles d’écran.
