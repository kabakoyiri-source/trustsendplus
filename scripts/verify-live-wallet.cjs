const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),QRCode=require('qrcode');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname,'../qa/browsers');
const {webkit}=require('playwright'),{marketFixture,perpetualFixture}=require('./market-fixture.cjs');
const SEED=require('../src/concept/main-wallet-seed.json'),WATCH=require('../src/concept/default-watch-wallet.json');
const KEY='trust-concept-local-v1',dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../qa/live-wallet'),ADDRESS=SEED.sourceAddress,OTHER='0x1111111111111111111111111111111111111111';
const money=n=>'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).replaceAll(',','\u202f').replace('.',',');
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=await webkit.launch({headless:true});let page;
 try{
  let factor=1,direction=-1,unavailable=false;const errors=[],requests=[],external=[];
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   window.__cameraMode='ready';window.__streams=[];window.__scanEnabled=false;
   Object.defineProperty(window,'BarcodeDetector',{configurable:true,value:undefined});
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=>'',writeText:async value=>window.__copied=value}});
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async options=>{
    window.__cameraOptions=options;
    if(window.__cameraMode==='denied')throw new DOMException('denied','NotAllowedError');
    const media={},record={stops:0,constraints:[]};window.__streams.push(record);
    const track={stop:()=>record.stops++,getCapabilities:()=>({torch:true}),applyConstraints:async constraints=>record.constraints.push(constraints)};
    media.getTracks=()=>[track];media.getVideoTracks=()=>[track];
    if(window.__cameraMode==='pending')await new Promise(resolve=>window.__resolveCamera=resolve);
    return media;
   }}});
   HTMLVideoElement.prototype.play=async function(){};
   Object.defineProperty(HTMLVideoElement.prototype,'srcObject',{configurable:true,get(){return this.__testStream},set(value){this.__testStream=value}});
   for(const [key,value] of Object.entries({readyState:4,videoWidth:640,videoHeight:640}))Object.defineProperty(HTMLVideoElement.prototype,key,{configurable:true,get:()=>value});
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(source,...rest){if(source instanceof HTMLVideoElement){if(window.__scanEnabled&&window.__scanImage)return draw.call(this,window.__scanImage,...rest);this.fillStyle='#444';return this.fillRect(0,0,this.canvas.width,this.canvas.height)}return draw.call(this,source,...rest)};
  });
  await context.route('https://live-wallet.test/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/market'){
    requests.push(url.href);const body=marketFixture(url.href);
    if(body.quotes)for(const quote of Object.values(body.quotes)){quote.price*=factor;quote.change24h=direction*3;quote.priceChange24h=quote.price-(quote.price/(1+quote.change24h/100));if(unavailable){quote.price=null;quote.change24h=null;quote.priceChange24h=null}}
    return route.fulfill({json:body});
   }
   if(url.pathname==='/api/perpetuals')return route.fulfill({json:perpetualFixture()});
   if(url.pathname==='/api/watch')throw Error('The default simulated account must not request a blockchain balance');
   let file=path.join(dist,decodeURIComponent(url.pathname));if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');
   return route.fulfill({path:file,contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});
  });
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith('https://live-wallet.test')&&!request.url().startsWith('data:')&&!request.url().startsWith('blob:'))external.push(request.url())});
  const click=name=>page.getByRole('button',{name,exact:true}).click(),unlock=async()=>{for(const digit of '787878')await click(digit)},read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  const quote=()=>marketFixture('https://live-wallet.test/api/market?currency=usd').quotes.eth.price*factor;
  async function reloadQuotes(){await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('trust-market-v1:'))localStorage.removeItem(key)});await page.reload();await unlock();await page.waitForFunction(()=>document.querySelector('.balance-block h1')?.textContent!== '\u2014')}
  await page.goto('https://live-wallet.test');await unlock();await page.waitForFunction(()=>document.querySelector('.balance-block h1')?.textContent.startsWith('$'));
  assert.equal((await read()).wallets.length,1);assert.equal((await read()).currency,'USD');assert.equal((await read()).wallets[0].name,'Young client');
  assert.equal(await page.locator('.balance-block h1').innerText(),money(SEED.ethUnits*quote()));assert(await page.locator('.balance-block > p').getAttribute('class')==='negative');assert((await page.locator('.balance-block > p').innerText()).includes('-3.00%'));
  assert(await page.getByText('Portefeuille simulé · Cours du marché',{exact:true}).isVisible());
  await click('Envoyer');await page.getByRole('button',{name:/^D Main 1 /}).click();await click('Continuer');await page.getByLabel('Montant de la simulation').fill('1');
  assert((await page.locator('.send-fiat-toggle').innerText()).includes(money(quote())));await click('Vérifier la simulation');assert((await page.locator('.detail-list').innerText()).includes('$'));await click('Retour');await click('Retour');await click('Retour');
  await page.locator('.home-tokens .asset-main').first().click();assert((await page.locator('.asset-detail-price strong').innerText()).includes('$'));assert.equal(await page.locator('.asset-activity .asset-history-entry').count(),0);assert.equal(await page.locator('.asset-section-heading small').count(),0);await click('Retour');
  // Rename, immediately reopen a page, and change quotes: name and quantities survive.
  await page.locator('.wallet-selector').click();assert.equal(await page.locator('.manager-wallet-row').count(),1);await click('Options de Young client');await click('Nom, couleur et icône');await page.getByLabel('Nom du portefeuille',{exact:true}).fill('Mes actifs');await click('Enregistrer');assert.equal((await read()).wallets[0].name,'Mes actifs');
  await page.close();page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('https://live-wallet.test');await unlock();assert.equal(await page.locator('.wallet-selector').innerText(),'Mes actifs');
  factor=1.2;direction=1;await reloadQuotes();assert.equal(await page.locator('.balance-block h1').innerText(),money(SEED.ethUnits*quote()));assert.equal((await read()).wallets[0].balances.eth,SEED.ethUnits);assert.equal(await page.locator('.balance-block > p').getAttribute('class'),'positive');assert((await page.locator('.balance-block > p').innerText()).includes('3.00%'));
  await page.screenshot({path:path.join(out,'01-live-usd.png')});
  // Remove only the app-provided View-only account, preserve custom public imports/name/history.
  await page.evaluate(({key,watch})=>{const data=JSON.parse(localStorage.getItem(key));delete data.defaultWatchRemoved;delete data.liveUsdPricing;data.currency='EUR';data.wallets.push(watch,{...watch,id:'user-watch',name:'Ma veille'});data.active=watch.id;localStorage.setItem(key,JSON.stringify(data))},{key:KEY,watch:WATCH});
  await page.reload();await unlock();let saved=await read();assert.deepEqual(saved.wallets.map(wallet=>wallet.id),['main','user-watch']);assert.equal(saved.active,'main');assert.equal(saved.wallets[0].name,'Mes actifs');assert.equal(saved.currency,'USD');
  await page.reload();await unlock();assert.equal((await read()).wallets.length,2);assert.equal((await read()).wallets[0].name,'Mes actifs');
  // Camera UI, rear lens/no microphone, torch, layout, shutdown, real jsQR decoding.
  const qr=await QRCode.toDataURL(OTHER,{width:640,errorCorrectionLevel:'H',margin:4});
  await click('Scanner');await page.waitForFunction(()=>window.__streams.length>0);assert.equal((await page.evaluate(()=>window.__cameraOptions)).audio,false);assert.equal((await page.evaluate(()=>window.__cameraOptions)).video.facingMode.ideal,'environment');
  await click('Allumer la lampe');assert.equal(await page.getByRole('button',{name:'Allumer la lampe'}).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>window.__streams.every(stream=>stream.stops>0));
  const streamCount=await page.evaluate(()=>window.__streams.length);await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});window.dispatchEvent(new Event('pageshow'))});await page.waitForFunction(count=>window.__streams.length>count,streamCount);
  for(const size of [{width:320,height:568},{width:393,height:852},{width:430,height:932},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.locator('.qr-scanner').evaluate(el=>{const rect=el.getBoundingClientRect(),frame=el.querySelector('.qr-scanner-window').getBoundingClientRect();return rect.width<=innerWidth+1&&frame.left>=0&&frame.right<=innerWidth+1&&frame.top>70&&frame.bottom<=innerHeight}),'Scanner must fit '+JSON.stringify(size))}
  await page.setViewportSize({width:393,height:852});await page.screenshot({path:path.join(out,'02-scanner.png')});
  await page.evaluate(async source=>{const image=new Image();image.src=source;await image.decode();window.__scanImage=image;window.__scanEnabled=true},qr);
  await page.getByLabel('Destinataire',{exact:true}).waitFor();assert.equal(await page.getByLabel('Destinataire',{exact:true}).inputValue(),OTHER);assert((await page.locator('.send-network-pill').innerText()).includes('Ethereum'));assert(await page.evaluate(()=>window.__streams.every(stream=>stream.stops>0)));
  await click('Continuer');await page.getByLabel('Montant de la simulation').fill('1');assert((await page.locator('.send-fiat-toggle').innerText()).includes(money(quote())));await click('Retour');
  await page.evaluate(()=>window.__scanEnabled=false);await click('Scanner une adresse');await click('Fermer le scanner');assert.equal(await page.getByLabel('Destinataire').inputValue(),OTHER);await click('Retour');
  // A permission refusal is recoverable and QR images stay local.
  await page.evaluate(()=>window.__cameraMode='denied');await click('Scanner');await page.getByText(/Accès à la caméra refusé/).waitFor();
  const imageFile=path.join(out,'qr-public-address.png');await QRCode.toFile(imageFile,'ethereum:'+ADDRESS+'@1',{width:640,errorCorrectionLevel:'H',margin:4});
  await page.getByLabel('Image du code QR',{exact:true}).setInputFiles(imageFile);await page.getByLabel('Destinataire').waitFor();assert.equal(await page.getByLabel('Destinataire').inputValue(),ADDRESS);await click('Retour');
  // Reject unknown/action QR payloads rather than navigating to their URLs.
  await click('Scanner');await page.getByText(/Accès à la caméra refusé/).waitFor();await QRCode.toFile(imageFile,'https://example.com/unsafe',{width:640,margin:4});await page.getByLabel('Image du code QR').setInputFiles(imageFile);await page.getByText(/Adresse non valide ou réseau non disponible/).waitFor();assert(page.url().startsWith('https://live-wallet.test'));await click('Fermer le scanner');
  // A late permission result after closing also releases its track.
  await page.evaluate(()=>window.__cameraMode='pending');await click('Scanner');await page.waitForFunction(()=>Boolean(window.__resolveCamera));await click('Fermer le scanner');await page.evaluate(()=>window.__resolveCamera());await page.waitForFunction(()=>window.__streams.every(stream=>stream.stops>0));
  // Missing prices stay unavailable and cannot silently produce a zero-dollar send.
  unavailable=true;await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('trust-market-v1:'))localStorage.removeItem(key)});await page.reload();await unlock();assert.equal(await page.locator('.balance-block h1').innerText(),'—');await click('Envoyer');await page.getByRole('button',{name:/^D Main 1 /}).click();await click('Continuer');await page.getByLabel('Montant de la simulation').fill('1');assert((await page.locator('.send-fiat-toggle').innerText()).includes('—'));assert(await page.getByRole('button',{name:'Vérifier la simulation',exact:true}).isDisabled());
  assert(requests.every(url=>new URL(url).searchParams.get('currency')==='usd'));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: live USD prices and signed 24h variations; 1 ETH conversion; unavailable prices; rename across close/reopen; scoped default-wallet removal; no invented history; rear camera/torch/layout/shutdown/late permission; actual jsQR camera and image decoding; unsupported QR rejection.');
 }catch(error){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error}finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
