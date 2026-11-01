const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname,'../qa/browsers');
const {webkit}=require('playwright');
const {createMarketHandler}=require('../server/market-data.cjs');

async function main(){
 const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../qa/concept');
 fs.mkdirSync(out,{recursive:true});
 const handler=createMarketHandler(),requests=[];
 const browser=await webkit.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
  // A disposable demo balance is used only for visual comparison; no user storage is touched.
  await context.addInitScript(()=>localStorage.setItem('trust-concept-local-v1',JSON.stringify({wallets:[{id:'main',name:'Youg client',balances:{usdc:248.715418,eth:.000636,btc:0,sol:0,bnb:0,usdt:0,pol:0}}],active:'main',currency:'USD'})));
  await context.route('https://live-market.test/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/market'){
    let payload;const response={statusCode:200,setHeader(){},end(value){payload=value}};
    await handler({method:'GET',url:url.pathname+url.search},response);
    requests.push({query:url.search,status:response.statusCode});
    return route.fulfill({status:response.statusCode,contentType:'application/json',body:payload});
   }
   let file=path.join(dist,decodeURIComponent(url.pathname));
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(dist,'index.html');
   return route.fulfill({path:file,contentType:({'.js':'application/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();await page.goto('https://live-market.test');
  for(const key of '787878')await page.getByRole('button',{name:key,exact:true}).click();
  await page.locator('.wallet-home .asset-main').filter({hasText:'Ethereum'}).click();
  await page.getByRole('img',{name:'Cours réel Ethereum, 1Y'}).waitFor({timeout:30000});
  await page.waitForFunction(()=>document.querySelector('.asset-details-table')?.textContent.includes('B'));
  await page.screenshot({path:path.join(out,'live-eth-chart.png')});
  await page.locator('main').evaluate(el=>{el.scrollTop=360});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:path.join(out,'live-eth-details.png')});
  await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:path.join(out,'live-eth-history.png')});
  await page.locator('main').evaluate(el=>{el.scrollTop=0});
  await page.getByRole('button',{name:'Receive',exact:true}).click();
  await page.screenshot({path:path.join(out,'receive-eth-reference.png')});
  const viewports=[{width:320,height:568},{width:375,height:812},{width:393,height:852},{width:430,height:932},{width:844,height:390}];
  for(const size of viewports){
   await page.setViewportSize(size);
   assert(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Receive horizontal overflow: ${size.width}`);
   await page.locator('main').evaluate(el=>{el.scrollTop=el.scrollHeight});
   assert(await page.getByRole('button',{name:'Deposit from Coinbase'}).isVisible());
  }
  await page.getByRole('button',{name:'Retour',exact:true}).click();
  for(const size of viewports){
   await page.setViewportSize(size);
   assert(await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Asset horizontal overflow: ${size.width}`);
   assert(await page.locator('.asset-trade-bar').evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1}),`Trade controls outside viewport: ${size.width}`);
  }
  assert(requests.length>=3);assert(requests.every(request=>request.status===200),JSON.stringify(requests));
  console.log('PASS: live CoinGecko quotes, one-year Ethereum chart, coin details, four reference captures, receive/asset layouts at five viewport sizes.');
  console.log(JSON.stringify(requests));
 }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
