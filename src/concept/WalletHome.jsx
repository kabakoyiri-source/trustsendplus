import React from 'react'
import { FiArrowDown, FiArrowUpRight, FiChevronRight, FiPlus, FiRefreshCw, FiSearch, FiTrendingUp, FiZap } from 'react-icons/fi'
import { GlobeArtwork, HistoryGlyph, HomeGlyph, InfinityGlyph, PerpetualBadge, PredictionFlag, ScanGlyph, SlidersGlyph, SparkleGlyph, StockArtwork, TokenArtwork, WalletGlyph } from './WalletArtwork'
import {WalletAvatar} from './WalletVisuals'

const assetGain=(asset,wallet)=>{const units=wallet.balances[asset.id]||0;return units===0?0:Number.isFinite(asset.market?.priceChange24h)?units*asset.market.priceChange24h:null}

function HomeHeading({children,onClick}) { return <button className="section-heading" onClick={onClick}><h2>{children}</h2><FiChevronRight/></button> }

function HomeActions({onAction}) {
  return <div className="quick-actions">{[[FiArrowUpRight,'Envoyer','send'],[FiArrowDown,'Recevoir','receive'],[FiRefreshCw,'Swapper','swap'],[FiPlus,'Acheter','buy']].map(([Icon,label,kind])=><button key={kind} onClick={()=>onAction(kind)}><span className={kind==='swap'?'accent':''}><Icon/></span><small>{label}</small></button>)}</div>
}

function HomeAssetRow({asset,market=false,data,wallet,Coin,onAsset}) {
  const balance=wallet.balances[asset.id]||0
  const money=(n,precision=2)=>walletMoney(n,data.currency,precision)
  const value=market?asset.price:asset.balanceUnknown?null:balance===0?0:Number.isFinite(asset.price)?balance*asset.price:null
  const gain=assetGain(asset,wallet),watch=wallet.type==='watch'
  return <div className="asset-row"><button className="asset-main" onClick={()=>onAsset(asset.id)}>
    <Coin asset={asset}/>
    <span className="row-text"><strong>{market||watch&&!asset.native?asset.symbol:asset.name}</strong><small>{market?`${data.currency==='USD'?'$':data.currency==='XOF'?'FCFA ':'€'}${asset.cap} Cap.`:`${asset.balanceUnknown?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:8,useGrouping:false}).format(balance)} ${asset.symbol}`}</small></span>
    <span className="asset-value"><strong>{data.hide&&!market?'••••••':money(value,watch&&value>0&&value<1?4:2)}</strong><small className={market?(asset.change>=0?'positive':'negative'):balance>0?(gain>=0?'positive':'negative'):'muted'}>{market?Number.isFinite(asset.market?.change24h)?`${asset.change>0?'+':''}${asset.change.toFixed(2)}%`:'—':asset.balanceUnknown?'—':balance>0?Number.isFinite(gain)?`${gain>=0?'+':''}${money(gain,watch?Math.abs(gain)>=1?2:6:4)}`:'—':money(0)}</small></span>
  </button></div>
}

export function walletMoney(value, currency, precision=2) {
  if(!Number.isFinite(value))return '—'
  const amount=value
  const number=new Intl.NumberFormat('en-US',{minimumFractionDigits:precision,maximumFractionDigits:precision,useGrouping:Math.abs(amount)>=1000}).format(Math.abs(amount)).replaceAll(',','\u202f').replace('.',',')
  return `${amount<0?'-':''}${currency==='USD'?'$':currency==='XOF'?'FCFA ': '€'}${number}`
}

export function WalletHeader({name,appearance,total,currency,hide,collapsed,onWallets,onHistory,onScan}) {
  return <header className={`home-header wallet-header ${collapsed?'is-collapsed':''}`}>
    <button className="wallet-selector" onClick={onWallets} aria-label={`Portefeuille : ${name}`}>
      {appearance?<WalletAvatar wallet={appearance} className="wallet-avatar"/>:<span className="wallet-avatar"><WalletGlyph/></span>}
      <span>{collapsed?(hide?'••••••':walletMoney(total,currency)):name}</span>
    </button>
    <div className="header-icons">
      <button className="icon-button" aria-label="Historique" onClick={onHistory}><HistoryGlyph/></button>
      <button className="icon-button" aria-label="Scanner" onClick={onScan}><ScanGlyph/></button>
    </div>
  </header>
}

export function WalletNavigation({tab,onChange}) {
  return <nav className="bottom-nav wallet-navigation" aria-label="Navigation principale">
    <div className="nav-pill">{[[HomeGlyph,'home','Accueil'],[FiTrendingUp,'markets','Marchés'],[InfinityGlyph,'perpetuals','Perpétuels']].map(([Icon,id,label])=><button key={id} aria-label={label} aria-current={tab===id?'page':undefined} className={tab===id?'active':''} onClick={()=>onChange(id)}><Icon/></button>)}</div>
    <button className={`nav-search ${tab==='search'?'active':''}`} aria-label="Recherche" onClick={()=>onChange('search')}><FiSearch/></button>
  </nav>
}

export default function WalletHome({data,wallet,assets,marketAssets=assets,total,Coin,onAction,onRoute,onAsset,onMarkets,onTokens,onCustomize,onToggleBalance,watch=false}) {
  const money=(n,precision=2)=>walletMoney(n,data.currency,precision)
  const quoted=assets.filter(a=>(wallet.balances[a.id]||0)>0&&Number.isFinite(a.price)&&Number.isFinite(a.market?.priceChange24h))
  const totalGain=watch?(quoted.length?quoted.reduce((sum,a)=>sum+assetGain(a,wallet),0):null):assets.some(a=>assetGain(a,wallet)===null)?null:assets.reduce((sum,a)=>sum+assetGain(a,wallet),0)
  const pricedTotal=watch?quoted.reduce((sum,a)=>sum+(wallet.balances[a.id]||0)*a.price,0):total
  const percentage=Number.isFinite(totalGain)&&Number.isFinite(pricedTotal)&&pricedTotal-totalGain>0?totalGain/(pricedTotal-totalGain)*100:null
  const tokens=assets.filter(a=>data.visible.includes(a.id))
  const homeTokens=watch?tokens.filter(a=>a.native||(wallet.balances[a.id]||0)*a.price>=.005).slice(0,2):tokens
  const favorites=watch?[...data.favorites].sort((a,b)=>['eth','sol','bnb','btc'].indexOf(a)-['eth','sol','bnb','btc'].indexOf(b)):data.favorites
  const balanceLabel=data.hide?'••••••':money(total)
  return <div className={`wallet-home ${watch?'watch-home':wallet.valuation?'fixed-home':''}`}>
    {!watch&&<button className="announcement" onClick={onMarkets}>
      <span className="announcement-pages" aria-hidden="true"><i/><i/><i/></span><StockArtwork/>
      <span><strong>bStocks now live, 0% fees</strong><small>Buy now</small></span>
    </button>}
    <div className="balance-block">
      <button className="wallet-balance-toggle" aria-label={data.hide?'Afficher le solde':'Masquer le solde'} onClick={onToggleBalance}><h1 style={watch||wallet.valuation?{'--watch-balance-size':`${Math.min(10.2,154/Math.max(balanceLabel.length,1))}cqw`}:undefined}>{balanceLabel}</h1></button>
      {(!watch||Number.isFinite(totalGain))&&<p className={(totalGain??0)>=0?'positive':'negative'}><span className="gain-arrow" aria-hidden="true"/>{money(totalGain,watch?2:4)} <span>{percentage!==null?`(${percentage.toFixed(2)}%)`:''}</span></p>}
    </div>
    {!watch&&<HomeActions onAction={onAction}/>}
    <section className="section home-tokens">
      <HomeHeading onClick={onTokens}>Tokens</HomeHeading>
      {homeTokens.map(asset=><HomeAssetRow key={asset.id} asset={asset} data={data} wallet={wallet} Coin={Coin} onAsset={onAsset}/>)}
      <button className="soft compact" onClick={onTokens}>Tout voir <FiChevronRight/></button>
    </section>
    {!watch&&<section className="section home-perpetuals">
      <HomeHeading onClick={()=>onRoute('perps')}>Contrats perpétuels</HomeHeading>
      <div className="home-carousel perpetual-carousel">{[{id:'btc',symbol:'BTC',leverage:'40x',volume:'$7B'},{id:'eth',symbol:'ETH',leverage:'25x',volume:'$3.25B'},{id:'hype',symbol:'HYPE',leverage:'10x',volume:'$250M'}].map(a=><button className="home-perpetual-card" key={a.id} onClick={()=>onRoute('perps')}>
        <span className="home-perpetual-coin"><TokenArtwork id={a.id}/><PerpetualBadge/></span>
        <span className="perpetual-symbol"><strong>{a.symbol}</strong><small>{a.leverage}</small></span><span className="perpetual-volume">{a.volume} Vol</span>
      </button>)}</div>
    </section>}
    {!watch&&<section className="section home-predictions">
      <HomeHeading onClick={()=>onRoute('predictions')}>Prédictions</HomeHeading>
      <div className="home-carousel prediction-carousel">
        <button className="home-prediction-card" onClick={()=>onRoute('predictions')}>
          <span className="prediction-card-top"><span className="prediction-country"><PredictionFlag/><span className="prediction-network"><TokenArtwork id="pol"/></span></span><span className="prediction-date"><FiZap/> Jan 1</span></span>
          <strong>Will the Iranian regime fall<br/>before 2027?</strong>
        </button>
        <button className="home-prediction-card prediction-discover" onClick={()=>onRoute('predictions')}><GlobeArtwork/><strong>Gagnez selon l’actualité :<br/>politiques, sports et bien<br/>encore</strong></button>
      </div>
    </section>}
    <button className="wallet-ai" onClick={()=>onRoute('assistant')}><span className="wallet-ai-title"><SparkleGlyph/>Trust Wallet AI</span><span className="wallet-ai-action">Je vous écoute<FiChevronRight/></span></button>
    <section className="section home-watchlist">
      <HomeHeading onClick={onMarkets}>Liste de surveillance</HomeHeading>
      {favorites.map(id=>marketAssets.find(a=>a.id===id)).filter(Boolean).map(asset=><HomeAssetRow key={asset.id} asset={asset} data={data} wallet={wallet} Coin={Coin} onAsset={onAsset} market/>)}
    </section>
    <button className="soft customize" onClick={onCustomize}><SlidersGlyph/>Personnaliser</button>
  </div>
}
