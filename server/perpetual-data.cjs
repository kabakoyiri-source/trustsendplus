const SYMBOLS=Object.freeze(['BTC','HYPE','ETH','ZEC','SOL','XRP','DOGE']);
const number=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;

function createPerpetualHandler({fetchImpl=globalThis.fetch,now=Date.now}={}) {
  const cache=new Map(),pending=new Map();
  async function load(key,body,ttl){
    const old=cache.get(key);if(old&&now()-old.fetchedAt<ttl)return {...old,stale:false};
    if(pending.has(key))return pending.get(key);
    const promise=Promise.resolve().then(async()=>{try{
      const response=await fetchImpl('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error('Perpetual provider unavailable');
      const data=await response.json();if(!Array.isArray(data))throw Error('Invalid perpetual response');
      const value={data,fetchedAt:now()};cache.set(key,value);return {...value,stale:false};
    }catch(error){if(old&&now()-old.fetchedAt<24*3600000)return {...old,stale:true};throw error;}finally{pending.delete(key)}});
    pending.set(key,promise);return promise;
  }
  return async function handler(req,res){
    const send=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body))};
    if(req.method!=='GET'){res.setHeader('Allow','GET');return send(405,{error:'Method not allowed'})}
    const query=new URL(req.url,'http://localhost').searchParams;
    if([...query.keys()].some(key=>key!=='type')||query.has('type')&&query.get('type')!=='perpetuals')return send(400,{error:'Unsupported perpetual request'});
    try{
      const metadata=await load('metadata',{type:'metaAndAssetCtxs'},30000),[meta,contexts]=metadata.data;
      if(!Array.isArray(meta?.universe)||!Array.isArray(contexts))throw Error('Invalid perpetual market data');
      const end=now(),charts=await Promise.allSettled(SYMBOLS.map(coin=>load(coin,{type:'candleSnapshot',req:{coin,interval:'30m',startTime:end-24*3600000,endTime:end}},60000)));
      const markets=SYMBOLS.flatMap((symbol,index)=>{
        const position=meta.universe.findIndex(item=>item.name===symbol&&!item.isDelisted);if(position<0)return [];
        const contract=meta.universe[position],context=contexts[position]||{},price=number(context.markPx),previous=number(context.prevDayPx);
        const chart=charts[index].status==='fulfilled'?charts[index].value:null;
        const points=(chart?.data||[]).map(item=>[number(item.t),number(item.c)]).filter(([time,value])=>time!==null&&time<=end&&value>0).sort((a,b)=>a[0]-b[0]);
        return [{id:symbol.toLowerCase(),symbol,price,change24h:price>0&&previous>0?(price/previous-1)*100:null,volume24h:number(context.dayNtlVlm),maxLeverage:number(contract.maxLeverage),funding:number(context.funding),sparkline:points.map(point=>point[1]),chartUpdatedAt:chart?.fetchedAt||null,chartUnavailable:points.length<2,stale:metadata.stale||Boolean(chart?.stale)}];
      });
      if(!markets.some(item=>item.price>0))throw Error('No perpetual quotes');
      const stale=markets.some(item=>item.stale);res.setHeader('Cache-Control',stale?'no-store':'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
      return send(200,{source:'Hyperliquid',currency:'USD',fetchedAt:metadata.fetchedAt,stale,markets});
    }catch{res.setHeader('Cache-Control','no-store');res.setHeader('Retry-After','30');return send(503,{source:'Hyperliquid',error:'Perpetual market data is temporarily unavailable.'})}
  };
}
module.exports={createPerpetualHandler,SYMBOLS};
