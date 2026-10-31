const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(__dirname, '../qa/browsers');
const { webkit } = require('playwright');
const base = 'https://concept.test';
const out = path.join(__dirname,'../qa/concept');
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const dist=path.resolve(__dirname,'../dist');
 const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.json'),'utf8'));
 assert.equal(manifest.display,'standalone');
 const sw=fs.readFileSync(path.join(dist,'service-worker.js'),'utf8');
 const cached=JSON.parse(sw.match(/const ASSETS = (\[[^;]+\]);/)[1]);
 assert(cached.some(p=>p.startsWith('/assets/')&&p.endsWith('.js')),'Offline cache must contain the production JS');
 assert(cached.some(p=>p.startsWith('/assets/')&&p.endsWith('.css')),'Offline cache must contain the production CSS');
 for(const file of [...cached,...manifest.icons.map(i=>i.src)])assert(fs.existsSync(path.join(dist,file==='/'?'index.html':file)),`Missing PWA resource: ${file}`);
 const rewrites=JSON.parse(fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8')).rewrites;
 for(const icon of manifest.icons)assert(!new RegExp('^'+rewrites[0].source+'$').test(icon.src),'Vercel must not rewrite the icon to HTML');
 const browser=await webkit.launch({headless:true});
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
 // Serve the real production files through browser routing: this environment blocks WebKit loopback connections.
 await context.route('https://concept.test/**',async route=>{let file=path.join(dist,decodeURIComponent(new URL(route.request().url()).pathname));if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');await route.fulfill({path:file,contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]||'application/octet-stream'})});
 const page=await context.newPage();const errors=[], external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url())});
 const click=label=>page.getByRole('button',{name:label,exact:true}).click();
 const back=()=>click('Retour');
 async function unlock(){for(const k of '787878')await click(k)}
 try{
 await page.goto(base);
 assert(await page.getByRole('heading',{name:'Saisir le code d’accès'}).isVisible(),'First visit must open the PIN screen directly');
 assert.equal(await page.getByRole('button',{name:'Explorer le concept'}).count(),0);
 assert.equal(await page.locator('.lock-screen .brand-logo, .lock-top, .lock-orb, .lock-footer, .pin-hint').count(),0,'PIN screen must stay minimal');
 assert.equal(await page.locator('.pin-slots > span').count(),6);
 await page.screenshot({path:path.join(out,'01-pin.png')});
 for(const size of [{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(size);
  const layout=await page.locator('.lock-screen').evaluate(el=>{const keys=[...el.querySelectorAll('.keypad button')];return {fits:el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1,keysFit:keys.every(k=>{const r=k.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&r.height>=44})}});
  assert(layout.fits&&layout.keysFit,`PIN layout must fit with usable keys: ${JSON.stringify({size,layout})}`);
  await page.screenshot({path:path.join(out,`pin-${size.width}.png`)});
 }
 await page.setViewportSize({width:393,height:852});
 await page.keyboard.type('78');assert.equal(await page.locator('.pin-slots').getAttribute('aria-label'),'2 chiffres saisis sur 6');
 await page.keyboard.press('Backspace');assert.equal(await page.locator('.pin-slots').getAttribute('aria-label'),'1 chiffres saisis sur 6');
 await click('Effacer');
 for(const k of '111111')await click(k);assert(await page.getByRole('status').textContent().then(t=>t.includes('incorrect')));
 await page.screenshot({path:path.join(out,'02-pin.png')});await unlock();
 assert(await page.getByTestId('wallet-app').isVisible());
 await page.screenshot({path:path.join(out,'03-home.png')});
 await click('Réglages');await page.getByRole('button',{name:'Ajouter des fonds fictifs Créditer le portefeuille de démonstration'}).click();
 await page.locator('input[type=number]').fill('1000');await click('Ajouter des fonds fictifs');await back();await back();
 assert((await page.locator('.balance-block h1').textContent()).includes('1'));
 await click('Envoyer');await page.locator('textarea').fill('Alice démo');await page.getByRole('button',{name:'Continuer'}).click();
 await page.getByLabel('Montant de la simulation').fill('999999');assert(await page.getByRole('alert').isVisible());assert(await page.getByRole('button',{name:'Vérifier la simulation'}).isDisabled());
 await page.getByLabel('Montant de la simulation').fill('10');await page.getByRole('button',{name:'Vérifier la simulation'}).click();await page.screenshot({path:path.join(out,'04-review.png')});await page.getByRole('button',{name:'Confirmer la simulation'}).click();await page.getByRole('button',{name:'Retour au portefeuille'}).click();
 await click('Swapper');await page.getByLabel('Montant de la simulation').fill('20');await page.getByRole('button',{name:'Vérifier la simulation'}).click();await page.getByRole('button',{name:'Confirmer la simulation'}).click();await page.getByRole('button',{name:'Retour au portefeuille'}).click();
 await click('Historique');assert.equal(await page.locator('.history-row').count(),3);await page.locator('.history-row').first().click();assert(await page.getByRole('heading',{name:'Simulation terminée'}).isVisible());await back();await back();
 await click('Recevoir');assert(await page.getByLabel('Motif décoratif de démonstration, pas un QR de paiement').isVisible());await back();
 for(const tab of ['Marchés','Earn','Explorer','Recherche']){await click(tab);assert((await page.locator('main').innerText()).length>150)}
 await page.getByLabel('Rechercher un actif').fill('Bitcoin');assert.equal(await page.locator('.asset-row').count(),1);await page.getByLabel('Rechercher un actif').fill('zzzzz');assert(await page.getByRole('heading',{name:'Aucun résultat'}).isVisible());
 await click('Marchés');await page.locator('.asset-main').filter({hasText:'BTC'}).click();await click('1S');await click('Favori');await page.screenshot({path:path.join(out,'05-asset.png')});await back();
 await click('Accueil');await click('Réglages');await page.getByRole('button',{name:'Préférences Clair'}).click();await page.getByRole('button',{name:'Sombre'}).click();await page.screenshot({path:path.join(out,'06-dark.png')});await back();
 await page.getByRole('button',{name:'Portefeuilles 1'}).click();await page.getByRole('button',{name:'Ajouter un espace de démo'}).click();await page.getByPlaceholder('Ex. : Mes projets').fill('Deuxième espace');await page.getByRole('button',{name:'Enregistrer',exact:true}).click();assert.equal(await page.locator('.wallet-card').count(),2);await back();await back();assert((await page.locator('.balance-block h1').textContent()).includes('0,00'));
 await page.reload();assert.equal(await page.locator('.lock-screen').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(252, 252, 252)');await page.keyboard.type('787878');assert((await page.locator('.wallet-selector').textContent()).includes('Deuxième espace'));assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await click('Réglages');
 for(const name of ['Gérer les tokens','Réseaux','Sécurité','Notifications','Installer sur iPhone','À propos du concept']){await page.getByRole('button',{name,exact:true}).click();assert((await page.locator('main').innerText()).length>100);await back()}
 await back();await click('Accueil');
 // Network filtering and token selection are independent of portfolio balances.
 await click('Réglages');await click('Gérer les tokens');await page.getByRole('button',{name:'Tous les réseaux',exact:true}).click();await page.getByRole('button',{name:'Solana',exact:true}).click();assert.equal(await page.locator('.asset-row').count(),1);await page.getByRole('switch',{name:'Afficher Solana'}).click();assert(await page.getByRole('switch',{name:'Afficher Solana'}).getAttribute('aria-checked')==='true');await back();await back();
 await page.locator('.wallet-selector').click();await page.locator('.wallet-card').first().click();
 await click('Acheter');await page.getByLabel('Montant de la simulation').fill('5');await page.getByRole('button',{name:'Vérifier la simulation'}).click();await page.getByRole('button',{name:'Confirmer la simulation'}).click();await page.getByRole('button',{name:'Retour au portefeuille'}).click();
 await click('Earn');await page.locator('.stake-row').filter({hasText:'Ethereum'}).click();await page.getByRole('button',{name:'Simuler un staking'}).click();await page.getByLabel('Montant de la simulation').fill('0.001');await page.getByRole('button',{name:'Vérifier la simulation'}).click();await page.getByRole('button',{name:'Confirmer la simulation'}).click();await page.getByRole('button',{name:'Retour au portefeuille'}).click();
 await click('Explorer');await page.locator('.dapp-row').first().click();await page.getByRole('button',{name:'Prévisualiser la connexion'}).click();assert(await page.getByRole('dialog').isVisible());await page.getByRole('button',{name:'Simuler la connexion',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);await back();
 await page.getByRole('button',{name:'Assistant du concept Une visite guidée de votre prototype'}).click();await page.getByRole('button',{name:'Comment fonctionne la démo ?'}).click();await back();await back();
 await click('Marchés');await page.getByRole('button',{name:'Contrats perpétuels Découvrir l’interface de trading'}).click();await page.locator('.perp-card').first().click();assert(await page.getByRole('dialog').isVisible());await click('Fermer');await back();
 await page.getByRole('button',{name:'Prédictions Explorer les scénarios fictifs'}).click();await page.getByRole('button',{name:'Oui · 62 %'}).first().click();await back();
 await click('Accueil');await click('Réglages');await page.getByRole('button',{name:'Sécurité',exact:true}).click();await page.getByRole('button',{name:'Réinitialiser les données de démo'}).click();await page.getByRole('button',{name:'Conserver mes données'}).click();assert.equal(await page.getByRole('dialog').count(),0);await page.getByRole('button',{name:'Réinitialiser les données de démo'}).click();await page.getByRole('button',{name:'Réinitialiser la démo',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');assert.equal(await page.locator('.asset-row').count(),6);
 await page.getByRole('status').waitFor({state:'hidden'});
 for(const size of [{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.locator('.bottom-nav').evaluate(el=>el.getBoundingClientRect().bottom<=window.innerHeight+1),'Navigation below viewport');await page.screenshot({path:path.join(out,`responsive-${size.width}.png`)});const overflow=await page.evaluate(()=>{const m=document.querySelector('main'),r=m.getBoundingClientRect();return {ok:m.scrollWidth<=m.clientWidth+1,width:m.clientWidth,scroll:m.scrollWidth,offenders:[...m.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>r.right+1).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',right:e.getBoundingClientRect().right})).slice(0,12)}});assert(overflow.ok,`Horizontal overflow ${size.width}: ${JSON.stringify(overflow)}`)}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: PIN, top-up, insufficient funds, send, swap, buy, staking, history, receive, tabs, search, chart, theme, wallets, persistence, settings, network/token selection, Web3, assistant, perps, predictions, reset, 5 viewports. No external requests or JS errors.');
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exit(1)});


