# Portefeuilles et consultation publique

La liste affiche les portefeuilles déjà enregistrés dans l’application, avec leur propre nom, couleur et icône. Aucun des noms d’exemple des captures n’est ajouté aux données de l’utilisateur. L’ajout propose création, méthodes d’import de démonstration, puis « Voir plus » → « Portefeuille en lecture seule ». Les autres méthodes ne demandent aucune phrase secrète, clé privée ou connexion Google.

Le mode lecture seule demande un réseau et une adresse publique. Les adresses EVM peuvent aussi être résolues depuis un nom `.eth` par Blockscout. Après vérification auprès du fournisseur, l’utilisateur choisit le nom, la couleur et l’icône. Aucun compte n’est connecté et aucune autorisation de dépense n’est créée.

## Données réelles

`api/watch.js` et `server/watch-data.cjs` exposent uniquement des consultations GET. Les URL, réseaux et méthodes RPC sont fixés côté serveur. La validation refuse les clés privées, phrases secrètes, formats d’adresse incompatibles, paramètres de proxy arbitraires et curseurs d’un autre compte.

| Réseau | Source du solde et de l’historique |
| --- | --- |
| Ethereum | Blockscout : ETH, ERC-20, transactions et opérations internes ; secours Ethplorer et RPC Ethereum si l’indexeur est indisponible |
| Optimism, Gnosis | Instances Blockscout de ces réseaux |
| Solana | RPC public : SOL, comptes SPL classiques et Token-2022 ; signatures et transactions analysées |
| BNB Smart Chain | Binplorer : BNB, BEP-20 et historique ; RPC BNB en secours pour le solde natif |
| Tron | TronGrid : TRX, comptes TRC-20 et transferts |
| Bitcoin | Blockstream Esplora : solde confirmé et mempool, transactions paginées |

Les soldes entiers EVM/TRC-20 et leurs décimales sont conservés dans `rawBalance` et `balanceExact`, avant conversion pour l’affichage. Les tokens sans décimales connues n’ont pas de quantité inventée. Les cours proviennent de CoinGecko ou du fournisseur du token ; les montants sans cours ne sont pas ajoutés au total en monnaie. L’interface indique alors une valorisation partielle.

L’historique Activity regroupe les lignes par date et distingue envoi, réception, approbation, révocation et interaction de contrat selon les données disponibles. Le détail permet d’ouvrir la transaction dans l’explorateur. Le chargement des pages fusionne les événements sans dupliquer les transferts racines. Les filtres permettent de choisir le type, l’actif et l’origine réelle ou simulée.

Les requêtes sont mutualisées et mises en cache une minute, cinq minutes pour Binplorer afin de respecter son quota public. En cas de panne, un instantané datant de moins d’une heure peut être renvoyé avec `stale: true`. Le navigateur conserve aussi le dernier instantané et signale les anciennes données. Une panne ne remplace pas un solde par zéro et un historique indisponible n’est pas présenté comme un historique vide complet.

Le secours Ethereum a ses propres données indexées et peut avoir une profondeur différente de Blockscout. L’interface indique la source et les limites rencontrées ; elle ne complète pas l’historique avec des opérations fictives. Le solde natif peut encore être lu via RPC si les services d’indexation limitent leurs appels.

## Simulations et données locales

Les portefeuilles de démonstration conservent leurs soldes fictifs habituels. Pour un portefeuille surveillé, Envoyer, Recevoir, Achat/Vente et Swap enregistrent uniquement des simulations locales : ils ne changent pas les soldes observés et n’envoient aucune transaction. Ces lignes sont marquées Simulation et peuvent être isolées dans Activity. Le QR de réception reste le QR de démonstration constant demandé précédemment ; il n’encode pas l’adresse surveillée.

Les noms, préférences et simulations restent dans `trust-concept-local-v1`. Les instantanés publics sont également conservés sous `trust-watch-v1:<réseau>:<adresse>`. Supprimer un portefeuille retire son espace et ses simulations de l’application, sans agir sur la blockchain.

## Limites des fournisseurs

- Binplorer impose des quotas à sa clé publique de développement et recommande une clé personnelle pour la production. En cas de limitation, le solde BNB reste consultable via RPC, mais les tokens et l’historique sont explicitement signalés indisponibles. La profondeur historique dépend du plan du fournisseur.
- Solana charge l’historique de l’adresse et des huit premiers comptes SPL actifs, avec pagination. Les comptes SPL fermés et les comptes au-delà de cette limite nécessitent un indexeur spécialisé pour un historique exhaustif. Les détails manquants ou limités par le RPC sont signalés.
- Tron charge au plus 150 soldes TRC-20 non nuls et enrichit leurs métadonnées depuis les transferts et le registre des tokens reconnus. Une quantité inconnue reste à `—`.
- La consultation porte sur le réseau sélectionné, pas sur tous les réseaux possédant la même adresse EVM. Les NFT, positions DeFi, rendements et moteurs de liquidation ne sont pas valorisés.

Variables serveur facultatives pour les installations utilisant un fournisseur personnel : `ETHPLORER_API_KEY`, `BINPLORER_API_KEY`, `TRONGRID_API_KEY`, `SOLANA_RPC_URL`, `COINGECKO_DEMO_API_KEY`. Ne pas leur donner le préfixe `VITE_`. Elles ne sont jamais renvoyées au navigateur. Aucun changement du fichier `.env` local n’est nécessaire pour consulter Ethereum avec le fournisseur public.

## Vérifier

```text
npm run build
npm run verify:watch-api
npm run verify:wallets
node scripts/verify-wallet-flows.cjs --live
```

Les tests API couvrent formats et checksums, unités exactes, entrées refusées avant accès réseau, transferts ERC-20, pagination, cache et pannes, adresses Solana sensibles à la casse et non-divulgation des clés serveur. Les tests WebKit couvrent les écrans et cinq tailles, les méthodes sans secrets, l’import, la personnalisation, les transferts fictifs sans modification des soldes réels, le QR constant, la persistance et l’isolation entre portefeuilles.

Les captures sont écrites dans `qa/wallet-flows`. L’option `--live` utilise réellement Blockscout et CoinGecko avec l’adresse d’exemple donnée par l’utilisateur, sans opération on-chain.

Sources techniques : [API Blockscout](https://github.com/blockscout/blockscout-api-v2-swagger), [Solana RPC](https://solana.com/docs/rpc), [Binplorer](https://github.com/amilabs/Binplorer/wiki/Binplorer-API), [TronGrid](https://developers.tron.network/docs/api), [Esplora](https://github.com/Blockstream/esplora/blob/master/API.md).
