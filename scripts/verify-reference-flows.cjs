const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname,'../qa/browsers');
const {webkit}=require('playwright');
const {marketFixture}=require('./market-fixture.cjs');
const {createMarketHandler}=require('../server/market-data.cjs');
const live=process.argv.includes('--live');
const sizes=[{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}];

async function main(){
 const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../qa/reference-flows');fs.mkdirSync(out,{recursive:true});
 const browser=await webkit.launch({headless:true}),provider=createMarketHandler(),requests=[],errors=[];
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   localStorage.setItem('trust-concept-local-v1',JSON.stringify({wallets:[{id:'main',name:'Youg client',balances:{usdc:1000,eth:.00063687,btc:0,sol:0,bnb:0,usdt:0,pol:0}}],active:'main',currency:'USD'}));
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=>window.__clipboard||'',writeText:async text=>{window.__copied=text}}});
  });
  await context.route('https://reference.test/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/market'){
    if(!live)return route.fulfill({json:marketFixture(url.href)});
    let body;const response={statusCode:200,setHeader(){},end(value){body=value}};
    await provider({method:'GET',url:url.pathname+url.search},response);requests.push({query:url.search,status:response.statusCode});
    return route.fulfill({status:response.statusCode,contentType:'application/json',body});
   }
   let file=path.join(dist,decodeURIComponent(url.pathname));if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');
   return route.fulfill({path:file,contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const click=label=>page.getByRole('button',{name:label,exact:true}).click();
  const snapshot=async name=>{await page.setViewportSize({width:393,height:852});await page.locator('.wallet-app').evaluate(el=>el.style.setProperty('--wallet-safe-top','24px'));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(out,name+'.png')});};
  async function responsive(screen,footer){
   for(const size of sizes){await page.setViewportSize(size);const container=page.locator(screen);assert(await container.evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Overflow in ${screen} at ${size.width}`);if(footer){await page.locator(footer).scrollIntoViewIfNeeded();const box=await page.locator(footer).boundingBox();assert(box&&box.y>=0&&box.y+box.height<=size.height+1,`${footer} unreachable at ${JSON.stringify(size)}`)}}
   await page.setViewportSize({width:393,height:852});
  }
  await page.goto('https://reference.test');for(const key of '787878')await click(key);
  await page.waitForFunction(()=>!document.querySelector('.balance-block h1')?.textContent.includes('—'));
  await click('Envoyer');assert(await page.getByRole('heading',{name:'Envoyer à'}).isVisible());assert(await page.getByRole('button',{name:'Continuer',exact:true}).isDisabled());
  await snapshot('01-send-recipient');await responsive('.send-recipient-scroll','.trading-sheet-footer button');
  await page.evaluate(()=>{window.__clipboard='example.eth'});await click('Coller');assert.equal(await page.getByLabel('Destinataire',{exact:true}).inputValue(),'example.eth');
  await page.getByRole('button',{name:/^Wallet 4 /}).click();await click('Continuer');
  assert(await page.getByRole('heading',{name:'Montant',exact:true}).isVisible());assert((await page.locator('.send-recipient-strip').textContent()).includes('0xc9f92f48'));
  await snapshot('02-send-amount');await responsive('.send-amount-panel','.trading-sheet-footer button');
  await page.getByLabel('Montant de la simulation').fill('2');assert(await page.getByRole('alert').isVisible());assert(await page.getByRole('button',{name:'Vérifier la simulation'}).isDisabled());
  await page.getByLabel('Montant de la simulation').fill('');for(const key of ['0','Virgule','0','0','0','5'])await click(key);
  assert.equal(await page.getByLabel('Montant de la simulation').inputValue(),'0,0005');
  await click('Max');assert.equal(await page.getByLabel('Montant de la simulation').inputValue(),'0,00063687');
  await page.getByLabel('Montant de la simulation').fill('0.0005');await click('Vérifier la simulation');assert(await page.getByRole('button',{name:'Confirmer la simulation'}).isVisible());
  await click('Retour');await click('Retour');await click('Retour');
  await click('Marchés');await page.getByRole('tab',{name:'Crypto',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.market-mini-chart').length>2);
  await snapshot('03-markets-crypto');await responsive('main');
  await page.getByRole('tab',{name:'Stocks',exact:true}).click();assert(await page.locator('.browse-token').filter({hasText:'SPCXB'}).isVisible());
  await snapshot('04-markets-stocks');await responsive('main');
  await click('Robinhood');assert.equal(await page.locator('.browse-token').filter({hasText:'SPCXB'}).count(),0);assert(await page.locator('.browse-token').filter({hasText:'SPCX'}).isVisible());
  await click('Ondo');assert(await page.locator('.browse-token').filter({hasText:'SPCXON'}).isVisible());await click('bStocks');
  await page.locator('.market-filters button').first().click();await page.getByRole('dialog').getByRole('button',{name:'All networks',exact:true}).click();
  const first=await page.locator('.browse-token-name strong').first().textContent();await page.locator('.market-filters button').last().click();assert.notEqual(await page.locator('.browse-token-name strong').first().textContent(),first,'Sorting must reorder market rows');
  await click('Swap');assert(await page.getByLabel('Choisir la crypto source').textContent().then(text=>text.includes('ETH')));assert(await page.getByLabel('Choisir la crypto destination').textContent().then(text=>text.includes('USDT')));
  await snapshot('05-swap');await responsive('.swap-screen','.swap-slide');
  await page.getByLabel('Choisir la crypto source').click();await page.getByLabel('Choisir USDC',{exact:true}).click();await page.getByLabel('Montant de la simulation').fill('20');
  await page.getByLabel('Paramètres du swap').click();await click('1 %');await click('Fermer');
  const slider=page.getByRole('slider',{name:'Glissez pour swapper',exact:true});await slider.focus();await slider.press('End');assert(await page.getByRole('button',{name:'Confirmer la simulation'}).isVisible());await click('Retour');
  const dragBox=await page.getByRole('slider',{name:'Glissez pour swapper',exact:true}).boundingBox();assert(dragBox);
  await page.mouse.move(dragBox.x+12,dragBox.y+dragBox.height/2);await page.mouse.down();await page.mouse.move(dragBox.x+dragBox.width-6,dragBox.y+dragBox.height/2,{steps:15});await page.mouse.up();
  await page.getByRole('button',{name:'Confirmer la simulation'}).waitFor();await click('Confirmer la simulation');await click('Retour au portefeuille');
  await click('Marchés');await click('Recherche');assert(await page.getByRole('heading',{name:'Récentes'}).isVisible());assert(await page.locator('.search-recent-list').getByRole('button',{name:'USDT Token'}).isVisible());
  await snapshot('06-search');await responsive('.search-screen-content','.search-dock');
  await page.evaluate(()=>{window.__clipboard='Morpho'});await click('Coller');assert.equal(await page.locator('.search-results .asset-row').count(),1);
  await page.getByLabel('Rechercher un actif').fill('no-such-asset');assert(await page.getByRole('heading',{name:'Aucun résultat'}).isVisible());
  await page.getByLabel('Rechercher un actif').fill('');await page.getByRole('tab',{name:'DApps',exact:true}).click();assert.equal(await page.locator('.search-dapps > button').count(),3);await page.getByRole('tab',{name:'Tokens',exact:true}).click();
  await click('Effacer tout');assert.equal(await page.locator('.search-recent-list > button').count(),0);
  await click('Fermer la recherche');assert(await page.getByRole('heading',{name:'Markets',exact:true}).isVisible());
  assert.deepEqual(errors,[]);if(live)assert(requests.every(request=>request.status===200),JSON.stringify(requests));
  console.log(`PASS: six screenshots, all five viewport sizes, contact/paste, numeric keypad, Max, insufficient balance, Crypto/Stocks/providers, networks/sorting, keyboard and drag swap, search/tokens/DApps/recents. ${live?'Live CoinGecko data.':'Deterministic API fixture.'}`);
 }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
