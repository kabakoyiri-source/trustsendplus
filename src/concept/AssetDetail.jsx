import React,{useMemo,useState} from 'react'
import {FiArrowUpRight,FiBookOpen,FiChevronRight,FiExternalLink,FiGlobe,FiRefreshCw,FiSearch} from 'react-icons/fi'
import {FaRedditAlien} from 'react-icons/fa'
import LiveChart from './LiveChart'
import {compactNumber,marketMoney,useMarketResource} from './market'
import {ScanGlyph,SparkleGlyph,TokenArtwork} from './WalletArtwork'

function plainText(value){const document=new DOMParser().parseFromString(value||'','text/html');document.querySelectorAll('script,style').forEach(node=>node.remove());return document.body.textContent||''}

export default function AssetDetail({asset,currency,balance,range,onRange,onAction,onHistory,history,onTransaction,onCurrency}) {
  const metadata=useMarketResource({type:'detail',asset:asset.id,currency:currency.toLowerCase()})
  const [summary,setSummary]=useState(null),[expanded,setExpanded]=useState(false)
  const description=useMemo(()=>plainText(metadata.data?.description),[metadata.data])
  const money=(number,compact=false)=>marketMoney(number,currency,compact)
  const quote=asset.market
  const change=summary?.change??quote?.priceChange24h,percentage=summary?.percent??asset.change
  const rows=[['24h Volume',money(quote?.volume24h,true)],['Liquidity','--'],['Market Cap',money(quote?.marketCap,true)],['Circulating supply',quote?.circulatingSupply!=null?`${compactNumber(quote.circulatingSupply)} ${asset.symbol}`:'--'],['Contract address',metadata.data?.contractAddress||'--'],['FDV',money(quote?.fdv,true)],['Total Supply',quote?.totalSupply!=null?`${compactNumber(quote.totalSupply)} ${asset.symbol}`:'--'],['Holders','--'],['Security','--']]
  const examples=[{id:'example-send',kind:'send',amount:.0005,address:'0xC9f9…72de4'},{id:'example-receive',kind:'funds',amount:.001,address:'0xb5A0…24fef'},{id:'example-send-2',kind:'send',amount:.131,address:'0xE7CF…80bF8'}]
  const entries=history.length?history:examples
  const links=metadata.data?.links||{}
  return <article className="asset-detail">
    <div className="asset-overview"><span className="asset-detail-coin"><TokenArtwork id={asset.id}/></span><span className="asset-detail-name"><strong>{asset.symbol}</strong><small>{asset.network}</small></span><div className="asset-detail-price"><strong><button aria-label="Changer la devise" onClick={onCurrency}><FiRefreshCw/></button>{money(asset.price)}</strong><small className={(change??0)>=0?'positive':'negative'}>{Number.isFinite(change)?`${change>=0?'+':'-'}${money(Math.abs(change))} (${Math.abs(percentage).toFixed(2)}%)`:'—'}</small></div></div>
    <LiveChart asset={asset} currency={currency} range={range} onRange={onRange} onSummary={setSummary}/>
    <section className="asset-holding"><span>Balance</span><strong>{money(balance===0?0:Number.isFinite(asset.price)?balance*asset.price:null)}</strong><small>{new Intl.NumberFormat('en-US',{maximumFractionDigits:8}).format(balance)} {asset.symbol}</small></section>
    <div className="asset-inline-actions"><button onClick={()=>onAction('send')}><FiArrowUpRight/>Send</button><button onClick={()=>onAction('receive')}><ScanGlyph/>Receive</button><button onClick={()=>onAction('swap')}><FiRefreshCw/>Swap</button></div>
    <section className="asset-about"><h2><SparkleGlyph/>About {asset.symbol}<FiChevronRight/></h2>{description?<p className={expanded?'':'clamped'}>{description}</p>:<p className="muted">{metadata.loading?'Loading…':'Description unavailable'}</p>}{description&&<button className="asset-read-more" onClick={()=>setExpanded(value=>!value)}>{expanded?'Read less':'Read more'}</button>}</section>
    <section className="asset-details-table"><h2>Details</h2>{rows.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="asset-activity"><button className="asset-section-heading" onClick={onHistory}><h2>History</h2><FiChevronRight/>{!history.length&&<small>Demo</small>}</button>{entries.slice(0,3).map(entry=><button className="asset-history-entry" key={entry.id} onClick={()=>history.length?onTransaction(entry):onHistory()}><span className="asset-history-coin"><TokenArtwork id={asset.id}/></span><span className="asset-history-name"><strong>{['send','sell','swap','stake'].includes(entry.kind)?'Sent':'Received'}</strong><small>{entry.address||'Local simulation'}</small></span><strong className={['send','sell','swap','stake'].includes(entry.kind)?'negative':'positive'}>{['send','sell','swap','stake'].includes(entry.kind)?'-':'+'}{entry.amount} {asset.symbol}</strong></button>)}</section>
    <section className="asset-links"><h2>Links</h2><div>{[[FiGlobe,'Website',links.website],[null,'X',links.twitter],[FaRedditAlien,'Reddit',links.reddit],[FiExternalLink,'github',links.github],[FiBookOpen,'Whitepaper',links.whitepaper]].filter(([, ,url])=>url).map(([Icon,label,url])=><a key={label} href={url} target="_blank" rel="noreferrer noopener">{Icon?<Icon/>:<span aria-hidden="true">𝕏</span>}{label}</a>)}</div>{!Object.values(links).some(Boolean)&&<p className="muted">{metadata.loading?'Loading…':'Links unavailable'}</p>}</section>
    <section className="asset-search-x"><h2>Search on X</h2><a href={`https://x.com/search?q=${encodeURIComponent(asset.name)}`} target="_blank" rel="noreferrer noopener"><FiSearch/>Search name</a></section>
    <p className="asset-data-source"><a href="https://www.coingecko.com/" target="_blank" rel="noreferrer noopener">CoinGecko</a>{quote?.updatedAt?` · ${new Date(quote.updatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`:''} · Demo portfolio</p>
    {(metadata.error||metadata.data?.stale)&&<p className="market-delayed">Coin details could not be refreshed. <button onClick={metadata.retry}>Retry</button></p>}
  </article>
}

export function AssetTradeBar({onAction}) {return <div className="asset-trade-bar"><button className="asset-buy" onClick={()=>onAction('buy')}>Buy</button><button className="asset-sell" onClick={()=>onAction('sell')}>Sell</button></div>}
