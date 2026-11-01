import React,{useState} from 'react'
import {FiArrowDown,FiArrowUpRight,FiChevronDown,FiChevronRight,FiSearch,FiStar,FiX} from 'react-icons/fi'
import AssetIcon,{AssetNetworkBadge,AssetTokenLogo} from './AssetIcon'
import {compactNumber,marketMoney} from './market'
import {walletMoney} from './WalletHome'

function price(value,currency){if(!Number.isFinite(value))return '—';return (currency==='EUR'?'€':currency==='XOF'?'FCFA ':'$')+new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:value>=1?2:value>=.01?6:8}).format(value)}
function Change({asset}){return <small className={(asset.market?.change24h??0)>=0?'positive':'negative'}>{Number.isFinite(asset.market?.change24h)?`${asset.market.change24h>=0?'+':''}${asset.market.change24h.toFixed(2)}%`:'—'}</small>}

function MiniChart({asset}) {
  const raw=asset.market?.sparkline||[]
  if(raw.length<2)return <span className="mini-chart-empty">—</span>
  const stride=Math.max(1,Math.floor(raw.length/28)),values=raw.filter((_,index)=>index%stride===0);if(values.at(-1)!==raw.at(-1))values.push(raw.at(-1))
  const min=Math.min(...values),max=Math.max(...values),span=max-min||1
  const points=values.map((value,index)=>[index/(values.length-1)*70+2,4+(max-value)/span*36])
  const line=points.map(([x,y],index)=>`${index?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '),color=(asset.market?.change24h??0)>=0?'#168858':'#ce3a41'
  return <svg className="market-mini-chart" viewBox="0 0 74 48" role="img" aria-label={`Variation réelle ${asset.symbol}`}><path d={`${line}L72 48H2Z`} fill={color} opacity=".13"/><path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/><circle cx={points.at(-1)[0]} cy={points.at(-1)[1]} r="2.1" fill={color}/></svg>
}

function Listing({asset,currency,onChoose,search=false}) {
  return <div className="asset-row browse-row"><button className="asset-main browse-token" onClick={()=>onChoose(asset.id)}>
    <span className="browse-token-icon"><AssetIcon asset={asset}/><AssetNetworkBadge asset={asset}/></span>
    <span className="browse-token-name"><strong>{search?asset.name:asset.symbol}</strong><small>{search?`${asset.symbol} · ${marketMoney(asset.market?.volume24h,currency,true)} Vol`:`${marketMoney(asset.market?.marketCap,currency,true)} MCap`}</small></span>
    {!search&&<MiniChart asset={asset}/>}
    <span className="browse-token-value"><strong>{search?walletMoney(asset.price,currency,asset.price>=1?2:asset.price>=.01?4:6):price(asset.price,currency)}</strong><Change asset={asset}/></span>
  </button></div>
}

export function MarketsScreen({assets,currency,favorites,preferences={},onPreferences,onChoose,onSwap,onRoute}) {
  const tab=preferences.tab||'crypto',kind=preferences.kind||'Trending',issuer=preferences.issuer||'bStocks',network=preferences.network||'All networks'
  const [networks,setNetworks]=useState(false)
  const update=changes=>onPreferences({...preferences,...changes})
  function switchTab(value){update({tab:value,kind:'Trending',network:value==='stocks'?'BNB Smart Chain':'All networks',issuer:'bStocks',sortActive:false})}
  let rows=tab==='stocks'?assets.filter(asset=>asset.category==='stocks'&&asset.issuer===issuer):[...assets.filter(asset=>asset.trending),...assets.filter(asset=>!asset.trending&&asset.category!=='stocks')]
  if(kind==='Favorites')rows=favorites.map(id=>assets.find(asset=>asset.id===id)).filter(Boolean).filter(asset=>tab==='stocks'?asset.category==='stocks'&&asset.issuer===issuer:asset.category!=='stocks')
  if(network!=='All networks')rows=rows.filter(asset=>asset.network===network)
  if(kind==='Top')rows=[...rows].sort((a,b)=>(b.market?.marketCap||0)-(a.market?.marketCap||0))
  if(kind==='Top gainers')rows=[...rows].sort((a,b)=>(b.market?.change24h||0)-(a.market?.change24h||0))
  if(preferences.sortActive)rows=[...rows].sort((a,b)=>((b.market?.[tab==='stocks'?'marketCap':'volume24h']||0)-(a.market?.[tab==='stocks'?'marketCap':'volume24h']||0))*(preferences.ascending?-1:1))
  return <section className={`markets-screen ${tab==='stocks'?'is-stocks':''}`}>
    <header className="markets-heading"><h1>Markets</h1><div role="tablist" aria-label="Type de marché"><button role="tab" aria-selected={tab==='crypto'} onClick={()=>switchTab('crypto')}>Crypto</button><button role="tab" aria-selected={tab==='stocks'} onClick={()=>switchTab('stocks')}>Stocks</button></div></header>
    {tab==='crypto'&&<section className="market-bluechips"><h2>Bluechips</h2><div>{['btc','eth'].map(id=>{const asset=assets.find(item=>item.id===id);return <button className="market-bluechip" key={id} onClick={()=>onChoose(id)}><AssetIcon asset={asset}/><span><strong>{asset.symbol}</strong><span>{price(asset.price,currency)} <Change asset={asset}/></span></span></button>})}</div></section>}
    <div className="market-categories"><button className={kind==='Favorites'?'selected market-favorite':'market-favorite'} aria-label="Favoris" aria-pressed={kind==='Favorites'} onClick={()=>update({kind:kind==='Favorites'?'Trending':'Favorites'})}><FiStar/></button>{tab==='stocks'?['bStocks','Robinhood','Ondo'].map(name=><button key={name} className={issuer===name&&kind!=='Favorites'?'selected':''} onClick={()=>update({issuer:name,kind:'Trending',network:name==='bStocks'?'BNB Smart Chain':'Ethereum',sortActive:false})}>{name}</button>):['Trending','Top','Stonks Szn','Top gainers'].map(name=><button key={name} className={kind===name?'selected':''} onClick={()=>name==='Stonks Szn'?switchTab('stocks'):update({kind:name,sortActive:false})}>{name}</button>)}</div>
    <div className="market-filters"><button onClick={()=>setNetworks(true)}>{network}<FiChevronDown/></button><button onClick={()=>update({sortActive:true,ascending:!preferences.ascending})}>{tab==='stocks'?'Market cap':'Volume'}<FiArrowDown className={preferences.ascending?'ascending':''}/></button></div>
    <div className="market-list">{rows.map(asset=><Listing key={asset.id} asset={asset} currency={currency} onChoose={onChoose}/>)}{!rows.length&&<div className="empty"><h3>Aucun actif</h3><p>Choisissez un autre réseau ou ajoutez un favori.</p></div>}</div>
    <div className="market-more-links"><button aria-label="Contrats perpétuels Découvrir l’interface de trading" onClick={()=>onRoute('perps')}>Contrats perpétuels<FiChevronRight/></button><button aria-label="Prédictions Explorer les scénarios fictifs" onClick={()=>onRoute('predictions')}>Prédictions<FiChevronRight/></button><a href="https://www.coingecko.com/" target="_blank" rel="noreferrer noopener">CoinGecko · Cours réels</a></div>
    <button className="market-floating-swap" onClick={onSwap}>Swap</button>
    {networks&&<div className="trading-dialog-backdrop" onClick={()=>setNetworks(false)}><section className="network-picker-dialog" role="dialog" aria-modal="true" aria-label="Réseaux" onClick={event=>event.stopPropagation()}><header><h2>All networks</h2><button aria-label="Fermer" onClick={()=>setNetworks(false)}><FiX/></button></header>{['All networks',...new Set(assets.filter(asset=>tab==='stocks'?asset.category==='stocks':asset.category!=='stocks').map(asset=>asset.network))].map(name=><button className={network===name?'selected':''} key={name} onClick={()=>{update({network:name});setNetworks(false)}}>{name}<FiChevronRight/></button>)}</section></div>}
  </section>
}

const DAPPS=[{name:'Uniswap',caption:'Échanges décentralisés',asset:'uni'},{name:'Aave',caption:'Prêt et emprunt',asset:'aave'},{name:'OpenSea',caption:'Collections numériques',asset:'eth'}]
export function SearchScreen({assets,currency,query,onQuery,recents,onClear,onChoose,onDapp,onClose,say}) {
  const [kind,setKind]=useState('Tokens')
  const recentAssets=recents.map(id=>assets.find(asset=>asset.id===id)).filter(Boolean)
  const rows=query.trim()?assets.filter(asset=>`${asset.name} ${asset.symbol} ${asset.network}`.toLowerCase().includes(query.toLowerCase())):assets.filter(asset=>asset.trending)
  async function paste(){try{onQuery((await navigator.clipboard.readText()).trim())}catch{say('Collage indisponible. Saisissez votre recherche.')}}
  return <section className="search-screen">
    <main className="search-screen-content">
      <div className="search-recent-heading"><h1>Récentes</h1><button onClick={onClear} disabled={!recentAssets.length}>Effacer tout</button></div>
      <div className="search-recent-list">{recentAssets.map(asset=><button key={asset.id} onClick={()=>onChoose(asset.id)}><AssetTokenLogo asset={asset}/><span><strong>{asset.symbol}</strong><small>Token</small></span></button>)}</div>
      <div className="search-trending-heading"><h2>{query?'Résultats':'Tendance'}</h2><div role="tablist" aria-label="Catégorie de recherche">{['Tokens','DApps'].map(name=><button role="tab" key={name} aria-selected={name===kind} onClick={()=>setKind(name)}>{name}</button>)}</div></div>
      {kind==='Tokens'?<div className="search-results">{rows.map(asset=><Listing key={asset.id} asset={asset} currency={currency} onChoose={onChoose} search/>)}{!rows.length&&<div className="empty"><FiSearch/><h3>Aucun résultat</h3><p>Essayez un nom, un symbole ou un réseau.</p></div>}</div>:<div className="search-dapps">{DAPPS.filter(app=>app.name.toLowerCase().includes(query.toLowerCase())).map(app=><button key={app.name} onClick={()=>onDapp(app.name)}><AssetIcon asset={assets.find(asset=>asset.id===app.asset)}/><span><strong>{app.name}</strong><small>{app.caption}</small></span><FiArrowUpRight/></button>)}</div>}
    </main>
    <footer className="search-dock"><button className="search-open-tabs" aria-label="Applications ouvertes" onClick={()=>setKind('DApps')}><span>0</span></button><label className="search-dock-input"><FiSearch/><input aria-label="Rechercher un actif" placeholder="Tokens, DApps" value={query} onChange={event=>onQuery(event.target.value)}/><button type="button" onClick={paste}>Coller</button></label><button className="search-close" aria-label="Fermer la recherche" onClick={onClose}><FiX/></button></footer>
  </section>
}
