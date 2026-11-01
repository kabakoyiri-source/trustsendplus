// Deterministic API responses used only by automated browser tests.
const PRICES={usdc:.8974,eth:1988.26,btc:68760.31,sol:84.82,bnb:622.83,usdt:.8971,pol:.186};
const CHANGES={usdc:.13,eth:-4.70,btc:-4.55,sol:-6.09,bnb:-6.60,usdt:.02,pol:2.36};
const CAPS={usdc:54.2e9,eth:242.91e9,btc:1.38e12,sol:50.05e9,bnb:81.91e9,usdt:145.2e9,pol:1.8e9};
const catalog=require('../src/concept/asset-catalog.json');
for(const [index,asset] of catalog.entries()){
 if(PRICES[asset.id]!==undefined)continue;
 PRICES[asset.id]=asset.category==='stocks'?137+index*3:asset.id==='whype'?88.14:asset.id==='morpho'?2.33:1+index/10;
 CHANGES[asset.id]=index%3===0?-1.27:1.15+index/20;
 CAPS[asset.id]=257e6-index*3e6;
}
function marketFixture(url) {
 const q=new URL(url).searchParams,currency=(q.get('currency')||'eur').toUpperCase(),rate=currency==='USD'?1.114:currency==='XOF'?655.957:1;
 const asset=q.get('asset')||'eth',price=PRICES[asset]*rate,now=Date.now();
 const meta={source:'CoinGecko',currency,fetchedAt:now,stale:false};
 if(q.get('type')==='chart'){
  const days=Number(q.get('days')||1),count=days===1?289:120;
  return {...meta,asset,days,prices:Array.from({length:count},(_,i)=>[now-(count-1-i)*days*86400000/(count-1),price*(1.08-i/(count-1)*.08+Math.sin(i*.4)*.015)])};
 }
 if(q.get('type')==='detail')return {...meta,asset,description:'Ethereum is a decentralized, open-source blockchain platform that enables the creation of smart contracts and applications. Market information is supplied by the provider.',contractAddress:null,links:{website:'https://ethereum.org/',github:'https://github.com/ethereum',reddit:'https://www.reddit.com/r/ethereum/',twitter:'https://x.com/ethereum',whitepaper:'https://ethereum.org/en/whitepaper/'}};
 return {...meta,quotes:Object.fromEntries(Object.entries(PRICES).map(([id,value],index)=>[id,{price:value*rate,change24h:CHANGES[id],priceChange24h:value*rate*CHANGES[id]/(100+CHANGES[id]),marketCap:CAPS[id]*rate,volume24h:(4.36e9-index*1e6)*rate,fdv:CAPS[id]*rate,circulatingSupply:122.18e6,totalSupply:122.18e6,maxSupply:null,sparkline:Array.from({length:40},(_,i)=>value*rate*(.9+i/400+Math.sin(i*.8)*.015)),updatedAt:new Date(now).toISOString()}]))};
}
function perpetualFixture(){return {source:'Hyperliquid',currency:'USD',fetchedAt:Date.now(),stale:false,markets:['BTC','HYPE','ETH','ZEC','SOL','XRP','DOGE'].map((symbol,index)=>({id:symbol.toLowerCase(),symbol,price:[77955,87.662,2268.5,1244.1,95.305,1.254,.0758][index],change24h:[.74,-.02,1.10,-2.49,-.44,.5,.1][index],volume24h:[602.82e6,365.27e6,263.4e6,174.61e6,91.77e6,15e6,2.5e6][index],maxLeverage:[40,10,25,10,20,20,10][index],sparkline:Array.from({length:40},(_,i)=>100+Math.sin(i*.8)*2+i*(index%2?-.3:.3))}))}}
module.exports={marketFixture,perpetualFixture};
