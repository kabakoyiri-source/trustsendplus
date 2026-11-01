const CATALOG=require('../src/concept/asset-catalog.json');
const COINS=Object.freeze(Object.fromEntries(CATALOG.map(asset=>[asset.id,asset.providerId])));
const finite = value => typeof value === 'number' && Number.isFinite(value);

function createMarketHandler({fetchImpl=globalThis.fetch,now=Date.now,apiKey=()=>process.env.COINGECKO_DEMO_API_KEY}={}) {
  const cache=new Map(), pending=new Map();
  async function load(url,ttl) {
    const old=cache.get(url);
    if(old&&now()-old.fetchedAt<ttl)return {...old,stale:false};
    if(pending.has(url))return pending.get(url);
    const request=(async()=>{
      try {
        const key=apiKey();
        const response=await fetchImpl(url,{headers:{Accept:'application/json',...(key?{'x-cg-demo-api-key':key}:{})},signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw Error(`Market provider HTTP ${response.status}`);
        const data=await response.json();
        if(!data||data.error||data.status?.error_code)throw Error('Invalid market response');
        const value={data,fetchedAt:now()};
        cache.set(url,value);
        return {...value,stale:false};
      } catch(error) {
        if(old&&now()-old.fetchedAt<24*60*60*1000)return {...old,stale:true};
        throw error;
      } finally { pending.delete(url); }
    })();
    pending.set(url,request);
    return request;
  }
  return async function marketHandler(req,res) {
    const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));};
    if(req.method!=='GET'){res.setHeader('Allow','GET');return send(405,{error:'Method not allowed'});}
    const query=new URL(req.url,'http://localhost').searchParams;
    const type=query.get('type')||'markets', currency=query.get('currency')||'eur';
    const asset=query.get('asset'),days=Number(query.get('days')||1);
    if(!['markets','chart','detail'].includes(type)||!['eur','usd','xof'].includes(currency)||(type!=='markets'&&!Object.hasOwn(COINS,asset))||(type==='chart'&&![1,7,30,365].includes(days)))return send(400,{error:'Unsupported market request'});
    const upstreamCurrency=currency==='xof'?'eur':currency, rate=currency==='xof'?655.957:1;
    let pathname,params,ttl;
    if(type==='markets') {
      pathname='/coins/markets';params={vs_currency:upstreamCurrency,ids:Object.values(COINS).join(','),price_change_percentage:'24h',sparkline:'true'};ttl=60000;
    } else if(type==='chart') {
      pathname=`/coins/${COINS[asset]}/market_chart`;params={vs_currency:upstreamCurrency,days:String(days)};ttl=days===1?60000:300000;
    } else {
      pathname=`/coins/${COINS[asset]}`;params={localization:'false',tickers:'false',market_data:'false',community_data:'false',developer_data:'false',sparkline:'false'};ttl=30*60*1000;
    }
    try {
      const result=await load(`https://api.coingecko.com/api/v3${pathname}?${new URLSearchParams(params)}`,ttl);
      const meta={source:'CoinGecko',currency:currency.toUpperCase(),fetchedAt:result.fetchedAt,stale:result.stale};
      let body;
      if(type==='markets') {
        if(!Array.isArray(result.data)||!result.data.length)throw Error('Invalid quotes');
        body={...meta,quotes:Object.fromEntries(Object.entries(COINS).map(([id,providerId])=>{
          const row=result.data.find(item=>item.id===providerId)||{};
          const amount=key=>finite(row[key])?row[key]*rate:null;
          return [id,{price:amount('current_price'),change24h:finite(row.price_change_percentage_24h)?row.price_change_percentage_24h:null,priceChange24h:amount('price_change_24h'),marketCap:amount('market_cap'),volume24h:amount('total_volume'),fdv:amount('fully_diluted_valuation'),circulatingSupply:row.circulating_supply??null,totalSupply:row.total_supply??null,maxSupply:row.max_supply??null,sparkline:(row.sparkline_in_7d?.price||[]).filter(value=>finite(value)&&value>0).map(value=>value*rate),updatedAt:row.last_updated||null}];
        }))};
      } else if(type==='chart') {
        const prices=result.data.prices;
        if(!Array.isArray(prices)||prices.filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1])&&p[1]>0).length<2)throw Error('Invalid price history');
        body={...meta,asset,days,prices:prices.filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1])&&p[1]>0).map(([time,price])=>[time,price*rate]).sort((a,b)=>a[0]-b[0])};
      } else {
        const coin=result.data;
        if(coin.id!==COINS[asset])throw Error('Invalid coin details');
        const links=coin.links||{};
        const https=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:null}catch{return null}};
        body={...meta,asset,description:coin.description?.en||'',contractAddress:coin.platforms?.[asset==='usdt'?'tron':asset==='bnb'?'binance-smart-chain':'ethereum']||null,links:{website:(links.homepage||[]).map(https).find(Boolean)||null,whitepaper:https(links.whitepaper),github:(links.repos_url?.github||[]).map(https).find(Boolean)||null,reddit:https(links.subreddit_url),twitter:/^[A-Za-z0-9_]{1,30}$/.test(links.twitter_screen_name||'')?`https://x.com/${links.twitter_screen_name}`:null}};
      }
      res.setHeader('Cache-Control',result.stale?'no-store':`public, max-age=0, s-maxage=${ttl/1000}, stale-while-revalidate=300`);
      return send(200,body);
    } catch {
      res.setHeader('Cache-Control','no-store');res.setHeader('Retry-After','60');
      return send(503,{error:'Market data is temporarily unavailable. Please retry.',source:'CoinGecko'});
    }
  };
}
module.exports={createMarketHandler,COINS};
