const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname,'../qa/browsers');
const {webkit}=require('playwright'),{marketFixture}=require('./market-fixture.cjs'),{watchFixture,ADDRESS}=require('./watch-fixture.cjs'),{scanReceiveQr,scanQrPng}=require('./receive-qr-test.cjs');
const OTHER='0x1111111111111111111111111111111111111111',BTC='1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',SOL='DEMo111111111111111111111111111111111111111',TRON='TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';
async function main(){
 const {validReceiveAddress}=await import('../src/concept/receive-address.mjs');
 for(const [network,address] of [['Ethereum',ADDRESS],['BNB Smart Chain',ADDRESS],['Polygon',ADDRESS],['HyperEVM',ADDRESS],['Bitcoin',BTC],['Solana',SOL],['Tron',TRON]])assert(await validReceiveAddress({network},address));
 for(const [network,address] of [['Ethereum','0xDEMO-address'],['Ethereum',ADDRESS+'00'],['Bitcoin',ADDRESS],['Bitcoin',BTC.slice(0,-1)+'b'],['Solana',ADDRESS],['Tron',TRON.slice(0,-1)+'8'],['Ethereum','<svg onload=alert(1)>']])assert(!await validReceiveAddress({network},address));
 assert.equal(scanQrPng(await sharp(path.resolve(__dirname,'../public/receive-qr.svg')).resize(600,600).png().toBuffer()),ADDRESS);
 const browser=await webkit.launch({headless:true}),dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../qa/receive-qr'),errors=[],external=[];
 fs.mkdirSync(out,{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=>window.__clipboard||'',writeText:async value=>window.__copied=value}});Object.defineProperty(navigator,'share',{configurable:true,value:async value=>window.__shared=value})});
  await context.route('https://qr.test/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/api/market')return route.fulfill({json:marketFixture(url.href)});if(url.pathname==='/api/watch')return route.fulfill({json:watchFixture(url.searchParams.get('network'),url.searchParams.get('address'))});let file=path.join(dist,decodeURIComponent(url.pathname));if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');return route.fulfill({path:file,contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream'})});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith('https://qr.test')&&!request.url().startsWith('data:'))external.push(request.url())});
  const click=name=>page.getByRole('button',{name,exact:true}).click(),unlock=async()=>{for(const digit of '787878')await click(digit)};
  async function choose(symbol){await page.locator('.receive-network').click();await page.getByLabel(`Choisir ${symbol}`,{exact:true}).click()}
  async function edit(address){await page.locator('.receive-address').click();await page.getByLabel('Adresse',{exact:true}).fill(address);await click('Enregistrer')}
  async function matches(address){assert.equal(await scanReceiveQr(page),address);assert.equal(await page.locator('.receive-address').innerText(),address);await click('Copy');assert.equal(await page.evaluate(()=>window.__copied),address);await click('Share');assert((await page.evaluate(()=>window.__shared.text)).endsWith('\n'+address))}
  await page.goto('https://qr.test');await unlock();await click('Recevoir');await matches(ADDRESS);
  for(const size of [{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}]){await page.setViewportSize(size);assert.equal(await scanReceiveQr(page),ADDRESS)}
  await page.setViewportSize({width:393,height:852});await page.screenshot({path:path.join(out,'01-ethereum.png')});
  await choose('USDC');await matches(ADDRESS);await choose('ETH');await edit(OTHER);await matches(OTHER);
  await choose('USDC');await matches(ADDRESS);await choose('ETH');await matches(OTHER);
  for(const [symbol,address] of [['BTC',BTC],['SOL',SOL],['USDT',TRON]]){
   await choose(symbol);assert.equal(await page.getByTestId('receive-qr').count(),0);assert(await page.getByRole('button',{name:'Copy',exact:true}).isDisabled());
   await edit('0xDEMO-invalid');assert(await page.getByRole('alert').isVisible());assert.equal(await page.getByTestId('receive-qr').count(),0);await page.getByLabel('Adresse',{exact:true}).fill(address);await click('Enregistrer');await matches(address);
  }
  await page.screenshot({path:path.join(out,'02-tron.png')});await click('Retour');
  await page.reload();await unlock();await click('Recevoir');await matches(OTHER);await choose('BTC');await matches(BTC);await click('Retour');
  await page.locator('.wallet-selector').click();await click('Sélectionner View-only wallet');await page.locator('.watch-home .home-tokens .asset-main').first().click();await click('Receive');await matches(ADDRESS);
  await page.screenshot({path:path.join(out,'03-view-only.png')});await click('Retour');await click('Retour');
  // The settings editor configures the same per-wallet/per-asset destinations as Receive.
  const SECOND='0x2222222222222222222222222222222222222222',read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('trust-concept-local-v1')));
  async function settings(){await page.locator('.wallet-selector').click();await click('Réglages');await click('Changer les adresses');await page.getByRole('heading',{name:'Changer les adresses',exact:true}).waitFor()}
  async function settingsAsset(symbol){await page.getByLabel('Choisir la crypto à configurer').click();await page.getByLabel('Rechercher une crypto').fill(symbol);await page.getByLabel(`Choisir ${symbol}`,{exact:true}).click()}
  const field=()=>page.getByLabel('Adresse de réception',{exact:true});
  await settings();assert.equal(await field().inputValue(),ADDRESS);await field().fill(SECOND);await click('Enregistrer l’adresse');
  let data=await read();const watch=data.wallets.find(wallet=>wallet.type==='watch');assert.equal(watch.watch.address,ADDRESS);assert.equal(data.receiveAddresses[watch.id+':watch:ethereum:native'],SECOND);
  await click('Voir le QR code');await matches(SECOND);await click('Retour');await click('Utiliser l’adresse par défaut');assert.equal(await field().inputValue(),ADDRESS);await click('Retour');await click('Retour');
  await page.locator('.wallet-selector').click();await click('Sélectionner Young client');
  const walletsBefore=(await read()).wallets;await settings();assert.equal(await field().inputValue(),OTHER);
  await field().fill(BTC);await click('Enregistrer l’adresse');await page.getByRole('alert').waitFor();assert.equal((await read()).receiveAddresses['main:eth'],OTHER);
  await page.evaluate(value=>window.__clipboard=value,SECOND);await click('Coller');assert.equal(await field().inputValue(),SECOND);await click('Enregistrer l’adresse');assert.equal((await read()).receiveAddresses['main:eth'],SECOND);assert(await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).isDisabled());
  for(const size of [{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.locator('.wallet-content').evaluate(element=>element.scrollWidth<=element.clientWidth+1),'Address settings overflow at '+size.width);await page.getByRole('button',{name:'Voir le QR code',exact:true}).scrollIntoViewIfNeeded();assert(await page.getByRole('button',{name:'Voir le QR code',exact:true}).isVisible())}
  await page.setViewportSize({width:393,height:852});await page.locator('.wallet-content').evaluate(element=>element.scrollTop=0);await page.screenshot({path:path.join(out,'04-address-settings.png')});
  await page.getByLabel('Choisir la crypto à configurer').click();await page.keyboard.press('Escape');assert(await page.getByRole('heading',{name:'Changer les adresses',exact:true}).isVisible());
  await click('Voir le QR code');await matches(SECOND);await click('Retour');assert.equal(await field().inputValue(),SECOND);
  await settingsAsset('BTC');assert.equal(await field().inputValue(),BTC);await click('Utiliser l’adresse par défaut');assert.equal(await field().inputValue(),'');assert(await page.getByRole('button',{name:'Voir le QR code',exact:true}).isDisabled());
  await field().fill(BTC);await click('Enregistrer l’adresse');await click('Voir le QR code');await matches(BTC);await click('Retour');assert((await page.getByLabel('Choisir la crypto à configurer').innerText()).includes('BTC'));
  await settingsAsset('USDC');assert.equal(await field().inputValue(),ADDRESS);await settingsAsset('ETH');assert.equal(await field().inputValue(),SECOND);assert.deepEqual((await read()).wallets,walletsBefore);
  await page.reload();await unlock();await settings();assert.equal(await field().inputValue(),SECOND);await settingsAsset('BTC');assert.equal(await field().inputValue(),BTC);await settingsAsset('ETH');await click('Utiliser l’adresse par défaut');await click('Voir le QR code');await matches(ADDRESS);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: independently decoded QR at five sizes; exact ETH/USDC/BTC/SOL/Tron and watch addresses; settings search/select/paste/save/reset/QR/back/persistence; invalid-address rejection; crypto/wallet isolation; monitored accounts and balances unchanged; local generation.');
 }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
