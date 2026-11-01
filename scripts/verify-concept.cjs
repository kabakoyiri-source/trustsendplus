const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { marketFixture } = require('./market-fixture.cjs');
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
 const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 const htmlIcons=[...html.matchAll(/<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(htmlIcons.length,2,'Declare both the favicon and iPhone icon');
 assert(manifest.icons.some(icon=>icon.purpose==='maskable'),'Android must have a dedicated maskable icon');
 assert(manifest.icons.every(icon=>icon.purpose==='any'||icon.purpose==='maskable'),'Do not reuse one file for both icon purposes');
 for(const file of [...manifest.icons.map(icon=>icon.src),...htmlIcons]){
  assert(/-v\d+\.(png|svg)$/.test(file),'Icon URLs must be versioned so installed apps can detect a change');
  assert(cached.includes(file),`Icon must remain available offline: ${file}`);
  assert(!new RegExp('^'+rewrites[0].source+'$').test(file),'Vercel must not rewrite the icon to HTML');
 }
 assert(!new RegExp('^'+rewrites[0].source+'$').test('/apple-touch-icon.png'),'Keep the iOS fallback available as an image');
 for(const weight of ['Regular','Medium','SemiBold','ExtraBold']){
  const font=`/fonts/Inter-${weight}.woff2`;
  assert(cached.includes(font),'Typography must be available offline');
  assert(!new RegExp('^'+rewrites[0].source+'$').test(font),'Vercel must serve the actual font file');
 }
 const browser=await webkit.launch({headless:true});
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
 // Serve the real production files through browser routing: this environment blocks WebKit loopback connections.
 let marketOffline=false;
 await context.route('https://concept.test/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/market')return route.fulfill({status:marketOffline?503:200,json:marketOffline?{error:'Temporary market outage'}:marketFixture(url.href)});
  let file=path.join(dist,decodeURIComponent(url.pathname));
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');
  await route.fulfill({path:file,contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});
 });
 await context.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=>window.__clipboard||'',writeText:async value=>{window.__copied=value}}});
  Object.defineProperty(navigator,'share',{configurable:true,value:async value=>{window.__shared=value}});
 });
 const page=await context.newPage();const errors=[], external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url())});
 const click=async label=>{
  if(['Marchés','Accueil','Earn','Explorer'].includes(label)&&await page.getByRole('button',{name:'Fermer la recherche',exact:true}).count())await page.getByRole('button',{name:'Fermer la recherche',exact:true}).click();
  if(label==='Réglages'&&!await page.getByRole('button',{name:label,exact:true}).count())await page.locator('.wallet-selector').click();
  if(label==='Explorer'&&!await page.getByRole('button',{name:label,exact:true}).count())await page.getByRole('button',{name:'Earn',exact:true}).click();
  await page.getByRole('button',{name:label,exact:true}).click();
 };
 const back=()=>click('Retour');
 async function unlock(){for(const k of '787878')await click(k)}
 try{
 await page.goto(base);
 await page.getByRole('heading',{name:'Saisir le code d’accès'}).waitFor({state:'visible'});
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
 await page.waitForFunction(()=>document.querySelector('.balance-block h1')?.textContent==='€223,20');
 assert.equal(await page.locator('.balance-block h1').textContent(),'€223,20');
 assert.equal(await page.locator('.wallet-selector').textContent(),'Youg client');
 assert.equal(await page.locator('.nav-pill button').count(),3);
 assert.deepEqual(await page.locator('.wallet-home .section-heading h2').allTextContents(),['Tokens','Contrats perpétuels','Prédictions','Liste de surveillance']);
 await page.locator('.wallet-app').evaluate(el=>el.style.setProperty('--wallet-safe-top','59px'));
 await page.screenshot({path:path.join(out,'reference-01-home.png')});
 await page.locator('main').evaluate(el=>{el.scrollTop=550});
 await page.waitForFunction(()=>document.querySelector('.wallet-header').classList.contains('is-collapsed'));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await page.locator('main').evaluate(el=>el.scrollTop),550,'Collapsing the header must not shift the scroll position');
 assert.equal(await page.locator('.wallet-selector').textContent(),'€223,20');
 await page.screenshot({path:path.join(out,'reference-02-scroll.png')});
 await page.locator('main').evaluate(el=>{el.scrollTop=840});
 await page.screenshot({path:path.join(out,'reference-03-watchlist.png')});
 await page.locator('.wallet-app').evaluate(el=>el.style.removeProperty('--wallet-safe-top'));
 await page.locator('main').evaluate(el=>{el.scrollTop=0});
 await page.waitForFunction(()=>!document.querySelector('.wallet-header').classList.contains('is-collapsed'));
 await page.screenshot({path:path.join(out,'03-home.png')});
 await click('Réglages');await page.getByRole('button',{name:'Ajouter des fonds fictifs Créditer le portefeuille de démonstration'}).click();
 await page.locator('input[type=number]').fill('1000');await click('Ajouter des fonds fictifs');await back();await back();
 assert((await page.locator('.balance-block h1').textContent()).includes('1'));
 await click('Envoyer');await page.getByLabel('Choisir la crypto à envoyer').click();await page.getByLabel('Choisir USDC',{exact:true}).click();await page.locator('textarea').fill('Alice démo');await page.getByRole('button',{name:'Continuer'}).click();
 await page.getByLabel('Montant de la simulation').fill('999999');assert(await page.getByRole('alert').isVisible());assert(await page.getByRole('button',{name:'Vérifier la simulation'}).isDisabled());
 await page.getByLabel('Montant de la simulation').fill('10');await page.getByRole('button',{name:'Vérifier la simulation'}).click();await page.screenshot({path:path.join(out,'04-review.png')});await page.getByRole('button',{name:'Confirmer la simulation'}).click();await page.getByRole('button',{name:'Retour au portefeuille'}).click();
 await click('Swapper');await page.getByLabel('Choisir la crypto source').click();await page.getByLabel('Choisir USDC',{exact:true}).click();await page.getByLabel('Choisir la crypto destination').click();await page.getByLabel('Choisir ETH',{exact:true}).click();await page.getByLabel('Montant de la simulation').fill('20');await page.getByRole('slider',{name:'Glissez pour swapper',exact:true}).focus();await page.getByRole('slider',{name:'Glissez pour swapper',exact:true}).press('End');await page.getByRole('button',{name:'Confirmer la simulation'}).click();await page.getByRole('button',{name:'Retour au portefeuille'}).click();
 await click('Historique');assert.equal(await page.locator('.history-row').count(),3);await page.locator('.history-row').first().click();assert(await page.getByRole('heading',{name:'Simulation terminée'}).isVisible());await back();await back();
 await click('Recevoir');
 assert(await page.getByRole('heading',{name:'Receive USDC'}).isVisible());
 const qr=await page.getByTestId('fixed-receive-qr').getAttribute('src');
 await page.getByLabel('Choisir la crypto à recevoir').click();await page.getByLabel('Choisir ETH',{exact:true}).click();
 assert(await page.getByRole('heading',{name:'Receive ETH'}).isVisible());
 assert.equal(await page.getByTestId('fixed-receive-qr').getAttribute('src'),qr);
 await page.screenshot({path:path.join(out,'07-receive-eth.png')});
 await page.getByLabel('Modifier l’adresse affichée').click();await page.getByLabel('Adresse',{exact:true}).fill('0xDEMO-edited-address');await click('Enregistrer');
 assert.equal(await page.getByTestId('fixed-receive-qr').getAttribute('src'),qr,'Editing an address must not regenerate the QR');
 await click('Copy');assert.equal(await page.evaluate(()=>window.__copied),'0xDEMO-edited-address');
 await click('Share');assert((await page.evaluate(()=>window.__shared.text)).includes('0xDEMO-edited-address'));
 await page.getByLabel('Choisir la crypto à recevoir').click();await page.getByLabel('Choisir BTC',{exact:true}).click();assert.equal(await page.getByTestId('fixed-receive-qr').getAttribute('src'),qr);
 await click('Deposit from Coinbase');assert(await page.getByRole('dialog').isVisible());await click('Fermer');await back();
 for(const tab of ['Marchés','Earn','Explorer','Recherche']){await click(tab);assert((await page.locator('main').innerText()).length>150)}
 await page.getByLabel('Rechercher un actif').fill('Bitcoin');assert.equal(await page.locator('.asset-row').count(),1);await page.getByLabel('Rechercher un actif').fill('zzzzz');assert(await page.getByRole('heading',{name:'Aucun résultat'}).isVisible());
 await click('Marchés');await page.locator('.asset-main').filter({hasText:'BTC'}).click();await click('1W');await click('Favori');
 await page.getByRole('img',{name:'Cours réel Bitcoin, 1W'}).waitFor();
 await page.screenshot({path:path.join(out,'05-asset.png')});
 assert(await page.getByRole('button',{name:'Buy',exact:true}).isVisible());assert(await page.getByRole('button',{name:'Sell',exact:true}).isVisible());
 await page.locator('main').evaluate(el=>{el.scrollTop=650});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert(await page.locator('.asset-page-header').isVisible());await page.screenshot({path:path.join(out,'08-asset-details.png')});
 await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(out,'09-asset-history.png')});
 await page.locator('main').evaluate(el=>{el.scrollTop=0});marketOffline=true;await click('1M');
 await page.getByText('Chart unavailable',{exact:false}).waitFor();assert.equal(await page.locator('.live-price-chart').count(),0,'An API failure must not display a fabricated curve');
 marketOffline=false;await click('Retry');await page.getByRole('img',{name:'Cours réel Bitcoin, 1M'}).waitFor();await back();
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


