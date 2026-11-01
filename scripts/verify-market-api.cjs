const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createMarketHandler}=require('../server/market-data.cjs');

const quote={id:'ethereum',current_price:2000,price_change_percentage_24h:5,price_change_24h:100,market_cap:240e9,total_volume:4e9,fully_diluted_valuation:250e9,circulating_supply:120e6,total_supply:125e6,last_updated:'2026-11-01T12:00:00Z'};
async function call(handler,url,method='GET'){
 const headers={};let body;
 const res={statusCode:0,setHeader:(k,v)=>{headers[k]=v},end:value=>{body=JSON.parse(value)}};
 await handler({url,method},res);return {status:res.statusCode,headers,body};
}
test('public proxy validates all query inputs before requesting a provider',async()=>{
 let calls=0;const handler=createMarketHandler({fetchImpl:async()=>{calls++;throw Error('must not fetch')}});
 for(const url of ['/api/market?type=chart&asset=__proto__','/api/market?type=chart&asset=https://evil.test','/api/market?type=chart&asset=eth&days=999','/api/market?currency=bogus','/api/market?type=unknown'])assert.equal((await call(handler,url)).status,400);
 assert.equal((await call(handler,'/api/market','POST')).status,405);assert.equal(calls,0);
});
test('quotes are real provider fields, cached and converted consistently for XOF',async()=>{
 let calls=0;const handler=createMarketHandler({fetchImpl:async()=>{calls++;return {ok:true,json:async()=>[quote]}},apiKey:()=>undefined});
 const first=await call(handler,'/api/market?type=markets&currency=eur');
 assert.equal(first.status,200);assert.equal(first.body.quotes.eth.price,2000);assert.equal(first.body.quotes.eth.change24h,5);assert.equal(first.body.quotes.eth.marketCap,240e9);
 await call(handler,'/api/market?type=markets&currency=eur');assert.equal(calls,1);
 const xof=await call(handler,'/api/market?type=markets&currency=xof');assert.equal(xof.body.quotes.eth.price,2000*655.957);assert.equal(calls,1);
 assert.equal(first.body.quotes.btc.price,null,'Missing provider prices must never become fabricated prices');
});
test('concurrent browser requests share one upstream request and keys stay server-side',async()=>{
 let calls=0;const handler=createMarketHandler({fetchImpl:async(url,options)=>{calls++;assert.equal(options.headers['x-cg-demo-api-key'],'test-secret');assert(!url.includes('test-secret'));await new Promise(resolve=>setTimeout(resolve,5));return {ok:true,json:async()=>[quote]}},apiKey:()=>'test-secret'});
 const results=await Promise.all([call(handler,'/api/market'),call(handler,'/api/market')]);assert.equal(calls,1);assert(!JSON.stringify(results).includes('test-secret'));
});
test('an upstream outage retains timestamped cached data as stale',async()=>{
 let at=100000,failing=false;const handler=createMarketHandler({now:()=>at,fetchImpl:async()=>({ok:!failing,status:429,json:async()=>[quote]})});
 await call(handler,'/api/market');at+=61000;failing=true;
 const result=await call(handler,'/api/market');assert.equal(result.status,200);assert.equal(result.body.stale,true);assert.equal(result.body.fetchedAt,100000);assert.equal(result.headers['Cache-Control'],'no-store');
 at+=25*60*60*1000;assert.equal((await call(handler,'/api/market')).status,503);
});
test('historical series uses provider points and rejects unusable histories',async()=>{
 const handler=createMarketHandler({fetchImpl:async()=>({ok:true,json:async()=>({prices:[[3000,12],[1000,10],[2000,11],[4000,null]]})})});
 const result=await call(handler,'/api/market?type=chart&asset=eth&days=365');assert.equal(result.status,200);assert.deepEqual(result.body.prices,[[1000,10],[2000,11],[3000,12]]);
 const invalid=createMarketHandler({fetchImpl:async()=>({ok:true,json:async()=>({prices:[]})})});assert.equal((await call(invalid,'/api/market?type=chart&asset=eth')).status,503);
});
test('coin descriptions return safe HTTPS links and never invent security results',async()=>{
 const handler=createMarketHandler({fetchImpl:async()=>({ok:true,json:async()=>({id:'ethereum',description:{en:'Ethereum'},links:{homepage:['javascript:alert(1)','https://ethereum.org'],repos_url:{github:['https://github.com/ethereum']},twitter_screen_name:'ethereum'}})})});
 const result=await call(handler,'/api/market?type=detail&asset=eth');assert.equal(result.status,200);assert.equal(result.body.links.website,'https://ethereum.org/');assert.equal(result.body.links.twitter,'https://x.com/ethereum');assert.equal(result.body.security,undefined);
});
