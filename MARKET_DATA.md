# Marchés et réception

Les cours et graphiques sont fournis par CoinGecko. Les soldes, réceptions, achats, ventes et échanges restent des simulations locales.

## API du site

La fonction `api/market.js` est déployée automatiquement par Vercel. Le serveur Vite expose la même route en développement avec `npm run dev`.

- `/api/market?type=markets&currency=eur` : prix, variation et volume sur 24 heures, capitalisation, FDV et offre des sept actifs.
- `/api/market?type=chart&asset=eth&currency=usd&days=365` : historique réel. Les périodes de 15 minutes à un jour utilisent les points de la dernière journée ; une semaine, un mois et un an utilisent leurs historiques respectifs.
- `/api/market?type=detail&asset=eth&currency=usd` : description et liens publics.

Les actifs, périodes, devises et fournisseurs autorisés sont limités côté serveur. Aucune URL de proxy arbitraire n’est acceptée. Le cache regroupe les requêtes et conserve les cours une minute, les historiques longs cinq minutes et les fiches trente minutes. Le navigateur rafraîchit les cours environ chaque minute lorsque l’application est visible, ainsi qu’au retour en ligne.

Les prix sont demandés dans la devise choisie. Le FCFA utilise la cotation EUR multipliée par la parité 655,957 ; aucun ancien taux USD fixe n’est appliqué.

L’accès public sans clé a été vérifié. En cas de limitation sur l’hébergement, une clé Demo CoinGecko peut être configurée dans Vercel avec la variable serveur `COINGECKO_DEMO_API_KEY`. Ne pas lui ajouter le préfixe `VITE_` et ne pas la placer dans le code client.

Si CoinGecko est indisponible, les dernières données connues sont signalées comme anciennes. En l’absence d’historique disponible, l’interface affiche une erreur avec un bouton Retry ; aucune courbe fictive n’est substituée. Les champs non fournis (liquidité, détenteurs, audit de sécurité) restent à `--`.

## Réception

Le volet de réception reprend la référence : badge réseau, carte QR, adresse, Copy/Share et bouton Coinbase. La crypto et l’adresse affichée peuvent être modifiées ; les adresses sont conservées par portefeuille et actif.

Le fichier `public/receive-qr.svg` est constant. Son contenu est **Trust Concept DEMO. No real crypto deposits.**, et n’encode aucune adresse de paiement. Le logo posé au centre suit la crypto choisie, sans changer la matrice du QR. Les adresses par défaut comportent `DEMO` et ne sont pas des adresses de dépôt réelles. La mention de démonstration reste visible sur le volet. Le bouton Coinbase ouvre une simulation locale, sans connexion ni transfert.

Régénération du QR : `node scripts/generate-receive-qr.cjs`.

## Vérifications

```text
npm run build
npm run verify:market
npm run verify:concept
```

Les tests d’API couvrent les paramètres refusés, le cache, la mutualisation, les pannes, les points historiques et les devises. Les tests WebKit utilisent un fournisseur simulé pour être reproductibles et contrôlent aussi les changements de crypto/adresse, Copy/Share, le QR constant, les périodes et l’absence de fausse courbe lors d’une panne. Les accès au fournisseur réel sont vérifiés séparément.
