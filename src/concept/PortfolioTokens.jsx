import React from 'react'
import {FiArrowLeft,FiSearch,FiX} from 'react-icons/fi'
import {SlidersGlyph} from './WalletArtwork'
import AssetIcon from './AssetIcon'
import {walletMoney} from './WalletHome'

export default function PortfolioTokens({assets,visible,balances,currency,hide,query,onQuery,onBack,onManage,onChoose,includeDefaults=true}) {
  const ids=[...new Set([...visible,...(includeDefaults?['eth','bnb','sol']:[]),...assets.filter(asset=>(balances[asset.id]||0)>0).map(asset=>asset.id)])]
  const rows=ids.map(id=>assets.find(asset=>asset.id===id)).filter(Boolean).filter(asset=>`${asset.name} ${asset.symbol}`.toLowerCase().includes(query.toLowerCase()))
  return <>
    <header className="portfolio-header"><button className="reference-round" aria-label="Retour" onClick={onBack}><FiArrowLeft/></button><h1>Tokens</h1><button className="reference-round" aria-label="Gérer les tokens" onClick={onManage}><SlidersGlyph/></button></header>
    <main className="portfolio-content">
      <label className="portfolio-search"><FiSearch/><input aria-label="Rechercher un token du portefeuille" placeholder="Rechercher" value={query} onChange={event=>onQuery(event.target.value)}/>{query&&<button aria-label="Effacer la recherche" onClick={()=>onQuery('')}><FiX/></button>}</label>
      <div className="portfolio-list">{rows.map(asset=>{const units=balances[asset.id]||0,value=asset.balanceUnknown?null:units===0?0:asset.price>0?units*asset.price:null,gain=asset.balanceUnknown?null:units===0?0:Number.isFinite(asset.market?.priceChange24h)?units*asset.market.priceChange24h:null;return <button className="portfolio-token asset-main" key={asset.id} onClick={()=>onChoose(asset.id)}><span className="portfolio-token-icon"><AssetIcon asset={asset}/></span><span className="portfolio-token-name"><strong>{asset.name}</strong><small>{hide?'••••':asset.balanceUnknown?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:8,useGrouping:false}).format(units)} {asset.symbol}</small></span><span className="portfolio-token-value"><strong>{hide?'••••':walletMoney(value,currency)}</strong><small className={units===0?'muted':(gain??0)>=0?'positive':'negative'}>{hide?'••••':`${gain>0?'+':''}${walletMoney(gain,currency,units===0?2:4)}`}</small></span></button>})}</div>
      {!rows.length&&<div className="empty"><h2>Aucun token</h2><p>Essayez un autre nom ou symbole.</p></div>}
    </main>
  </>
}
