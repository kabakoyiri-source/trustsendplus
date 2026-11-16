const {scanReceiveQr}=require('./receive-qr-test.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname,'../qa/browsers');
const {webkit}=require('playwright'),{marketFixture}=require('./market-fixture.cjs'),{watchFixture,ADDRESS}=require('./watch-fixture.cjs');
const {createMarketHandler}=require('../server/market-data.cjs'),{createWatchHandler}=require('../server/watch-data.cjs');
const SEED=require('../src/concept/main-wallet-seed.json');
const live=process.argv.includes('--live'),dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../qa/watch-layout'),KEY='trust-concept-local-v1';
const sizes=[{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}];
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=await webkit.launch({headless:true}),market=createMarketHandler(),watch=createWatchHandler(),errors=[],requests=[],chainRequests=[];
 let priceFactor=1,holdingFactor=1;
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.__copied=value}}));
  await context.route('https://layout.test/**',async route=>{
   const url=new URL(route.request().url());
   if(['/api/market','/api/watch'].includes(url.pathname)){
    if(url.pathname==='/api/watch')chainRequests.push(url.href);
    if(!live){
     const body=url.pathname==='/api/market'?marketFixture(url.href):watchFixture(url.searchParams.get('network'),url.searchParams.get('address'));
     for(const quote of Object.values(body.quotes||{}))for(const key of ['price','priceChange24h'])if(Number.isFinite(quote[key]))quote[key]*=priceFactor;
     for(const holding of body.holdings||[])holding.balance*=holdingFactor;
     return route.fulfill({json:body});
    }
    let body;const response={setHeader(){},end:value=>body=value};
    await (url.pathname==='/api/market'?market:watch)({method:'GET',url:url.pathname+url.search},response);
    requests.push(response.statusCode);return route.fulfill({status:response.statusCode,body,contentType:'application/json'});
   }
   let file=path.join(dist,decodeURIComponent(url.pathname));if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');
   return route.fulfill({path:file,contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.setDefaultTimeout(live?90000:30000);page.on('pageerror',error=>errors.push(error.message));
  const click=name=>page.getByRole('button',{name,exact:true}).click(),unlock=async()=>{for(const key of '787878')await click(key)},read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  async function snap(name){await page.setViewportSize({width:393,height:852});await page.locator('.wallet-app').evaluate(el=>el.style.setProperty('--wallet-safe-top','24px'));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(out,name+'.png')})}
  async function layout(selector){for(const size of sizes){await page.setViewportSize(size);const result=await page.locator(selector).evaluate(home=>({fits:home.closest('.wallet-content').scrollWidth<=home.closest('.wallet-content').clientWidth+1,rows:[...home.querySelectorAll('.asset-main')].map(row=>{const text=row.querySelector('.row-text').getBoundingClientRect(),value=row.querySelector('.asset-value').getBoundingClientRect();return {gap:value.left-text.right,within:value.right<=row.getBoundingClientRect().right+1}})}));assert(result.fits&&result.rows.every(row=>row.gap>=9&&row.within),JSON.stringify({size,result}));const nav=await page.locator('.wallet-navigation').evaluate(element=>({bottom:element.getBoundingClientRect().bottom,widths:[...element.querySelectorAll('.nav-pill svg')].map(svg=>svg.getBoundingClientRect().width),shadow:getComputedStyle(element.querySelector('.nav-pill')).boxShadow}));assert(nav.bottom<=size.height+1&&nav.widths.every(width=>width<=20));assert.equal(nav.shadow,'none')}await page.setViewportSize({width:393,height:852})}

  await page.goto('https://layout.test');await unlock();await page.waitForFunction(()=>document.querySelector('.balance-block h1')?.textContent.startsWith('$'));let data=await read();
  assert.equal(data.active,'main');assert.equal(data.wallets[0].name,'Young client');assert.equal(data.wallets[0].type,'demo');assert.equal(data.wallets[0].watch,undefined);assert.equal(data.wallets[0].receiveAddress,ADDRESS);assert.equal(data.wallets.length,1);assert.equal(data.currency,'USD');
  const firstTotal=await page.locator('.balance-block h1').innerText();
  assert.equal(await page.locator('.watch-type-pill').count(),0);assert.equal(await page.locator('.quick-actions > button').count(),4);assert.equal(chainRequests.length,0);
  await snap('00-young-client-live-quotes');await layout('.fixed-home');
  await click('Historique');assert.equal(await page.locator('.activity-row').count(),0);await click('Retour');
  await click('Recevoir');assert.equal(await page.locator('.receive-address').innerText(),ADDRESS);await click('Copy');assert.equal(await page.evaluate(()=>window.__copied),ADDRESS);assert.equal(await scanReceiveQr(page),ADDRESS);await click('Retour');
  priceFactor=2;await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('trust-market-v1:'))localStorage.removeItem(key)});await page.reload();await unlock();await page.waitForFunction(()=>document.querySelector('.balance-block h1')?.textContent.startsWith('$'));
  if(!live)assert.notEqual(await page.locator('.balance-block h1').innerText(),firstTotal);assert.equal((await read()).wallets[0].balances.eth,SEED.ethUnits);assert.equal(chainRequests.length,0);
  await click('Envoyer');await page.getByRole('button',{name:/^D Main 1 /}).click();await click('Continuer');await page.getByLabel('Montant de la simulation').fill('0.001');await click('Vérifier la simulation');await click('Confirmer la simulation');await click('Retour au portefeuille');
  assert.equal((await read()).wallets[0].balances.eth,SEED.ethUnits-.001);assert.equal(chainRequests.length,0);
  // An explicitly saved watch account remains available; none is inserted automatically.
  await page.evaluate(({key,watch})=>{const current=JSON.parse(localStorage.getItem(key));current.wallets.push(watch);current.defaultWatchRemoved=true;localStorage.setItem(key,JSON.stringify(current))},{key:KEY,watch:require('../src/concept/default-watch-wallet.json')});
  await page.reload();await unlock();await page.locator('.wallet-selector').click();await click('Sélectionner View-only wallet');await page.waitForFunction(()=>!document.querySelector('.balance-block h1')?.textContent.includes('—'));await snap('02-watch-home');
  assert(chainRequests.length>0);const watchTotal=await page.locator('.balance-block h1').innerText();
  await click('Historique');await page.locator('.activity-row').first().waitFor();await click('Retour');
  const beforeRefresh=chainRequests.length;holdingFactor=2;await click('Informations du portefeuille en lecture seule');await click('Actualiser le portefeuille surveillé');await click('Fermer');
  if(!live)await page.waitForFunction(total=>document.querySelector('.balance-block h1').textContent!==total,watchTotal);
  assert(chainRequests.length>beforeRefresh);await layout('.watch-home');
  const text=await page.locator('.wallet-content').innerText();for(const fragment of ['Valorisation partielle','Ethereum RPC','Blockscout','Détails du chargement','Lecture seule · Solde réel','0x91237'])assert(!text.includes(fragment));
  await click('Copier l’adresse surveillée');assert.equal(await page.evaluate(()=>window.__copied),ADDRESS);
  await page.locator('.wallet-selector').click();await click('Sélectionner Young client');await snap('03-light-navigation');
  for(const linked of [false,true]){
   await page.evaluate(({key,address,linked})=>localStorage.setItem(key,JSON.stringify({wallets:[{id:'main',name:'Mon nom conservé',balances:linked?{}:{usdc:248.715418},...(linked?{type:'watch',watch:{network:'ethereum',address},previousDemoBalances:{usdc:248.715418}}:{}),visible:['usdc']},{id:'watch-ethereum-default',name:'View-only wallet',type:'watch',balances:{},watch:{network:'ethereum',address}}],active:'watch-ethereum-default',defaultWatchAdded:true,receiveAddresses:{'main:eth':'0xDEMO-old','custom:eth':'0x1111111111111111111111111111111111111111'}})),{key:KEY,address:ADDRESS,linked});
   const before=chainRequests.length;await page.reload();await unlock();data=await read();assert.equal(data.active,'main');assert.equal(data.wallets[0].name,'Mon nom conservé');assert.equal(data.wallets[0].type,'demo');assert.equal(data.wallets[0].watch,undefined);assert.equal(data.wallets[0].previousDemoBalances.usdc,248.715418);assert.equal(data.wallets[0].balances.eth,SEED.ethUnits);assert.equal(data.receiveAddresses['main:eth'],ADDRESS);assert.equal(data.receiveAddresses['custom:eth'],'0x1111111111111111111111111111111111111111');assert.equal(data.wallets.length,1);assert.equal(chainRequests.length,before);
   await page.reload();await unlock();assert.equal((await read()).wallets[0].name,'Mon nom conservé');
  }
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({wallets:[{id:'saved',name:'Mes réserves',balances:{usdc:42}}],active:'saved',currency:'EUR'})),KEY);await page.reload();await unlock();data=await read();assert.equal(data.active,'saved');assert.equal(data.wallets[0].name,'Mes réserves');assert.equal(data.wallets[0].balances.usdc,42);assert.equal(data.wallets.length,1);
  assert.deepEqual(errors,[]);if(live)assert(requests.every(status=>status===200),JSON.stringify(requests));
  console.log('PASS: live USD valuation of unchanged Young client quantities, independent simulated sends, single default account, scannable address, public watch refresh/history, scoped migrations preserving names/selections, five viewports.');
 }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
