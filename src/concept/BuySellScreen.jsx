import React,{useState} from 'react'
import {FiArrowLeft,FiCheck,FiChevronRight} from 'react-icons/fi'
import AssetIcon from './AssetIcon'
import {cleanAmount,cryptoAmount,NumericKeypad,TokenPicker,TradingDialog} from './TradingControls'

const CURRENCIES=[{id:'USD',name:'Dollar américain',flag:'🇺🇸'},{id:'EUR',name:'Euro',flag:'🇪🇺'},{id:'XOF',name:'Franc CFA',flag:'🌍'}]
function CurrencyFlag({currency}){return <span className="retail-flag" aria-hidden="true">{currency==='USD'?<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/><path d="M0 2h24M0 6h24M0 10h24M0 14h24M0 18h24M0 22h24" stroke="#dc3345" strokeWidth="2"/><path d="M0 0h13v13H0Z" fill="#1353a0"/><path d="M2 2h9M2 5h9M2 8h9M2 11h9" stroke="#fff" strokeWidth="1" strokeDasharray="1 2"/></svg>:currency==='EUR'?<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#174598"/>{Array.from({length:12},(_,index)=><circle key={index} cx={12+7*Math.cos(index*Math.PI/6)} cy={12+7*Math.sin(index*Math.PI/6)} r=".8" fill="#ffda00"/>)}</svg>:'🌍'}</span>}
function CurrencyPill({currency,onClick}){return <button className="retail-selector" aria-label="Choisir la devise" onClick={onClick}><CurrencyFlag currency={currency}/>{currency}<FiChevronRight/></button>}

export default function BuySellScreen({kind,asset,assets,balances,currency,amount,onAmount,onKind,onAsset,onCurrency,onBack,onReview,simulation,onSimulation}) {
  const [picker,setPicker]=useState(null)
  const selling=kind==='sell',number=Number(amount),balance=balances[asset.id]||0
  const minimum=asset.id==='eth'?.0013:['usdc','usdt'].includes(asset.id)?1:.001
  const units=selling?number:asset.price>0?number/asset.price:0
  const valid=Number.isFinite(number)&&number>0&&Number.isFinite(units)&&units>0&&units<=1e9&&(!selling||units>=minimum&&units<=balance)&&asset.price>0
  const message=selling&&number<minimum?`Le montant minimal est de ${cryptoAmount(minimum)} ${asset.symbol}`:selling&&units>balance?'Solde insuffisant':simulation?'Simulation locale':'Aucun fournisseur disponible'
  const converted=amount&&asset.price>0&&(selling||simulation)?selling?number*asset.price:number/asset.price:null
  const [whole,fraction]=amount.split('.'),display=(selling?whole:whole.replace(/\B(?=(\d{3})+(?!\d))/g,' '))+(fraction!==undefined?','+fraction:''),fontSize=`clamp(26px,${Math.max(7,18-Math.max(0,amount.length-5)*1.5)}cqw,68px)`
  const assetPill=<button className="retail-selector retail-asset-selector" aria-label="Choisir la crypto à acheter ou vendre" onClick={()=>setPicker('asset')}><AssetIcon asset={asset}/>{asset.symbol}<FiChevronRight/></button>
  return <section className={`retail-screen ${selling?'is-selling':'is-buying'}`}>
    <header className="retail-header"><button className="retail-back reference-round" aria-label="Retour" onClick={onBack}><FiArrowLeft/></button><div className="retail-tabs" role="tablist" aria-label="Acheter ou vendre">{[['buy','Acheter'],['sell','Vendre']].map(([id,label])=><button key={id} role="tab" aria-selected={kind===id} onClick={()=>onKind(id)}>{label}</button>)}</div><span/></header>
    <button className={`retail-status ${message==='Simulation locale'?'is-simulation':''}`} aria-label="Choisir un fournisseur" onClick={()=>setPicker('provider')}>{message}</button>
    <div className="retail-amounts">
      <div className="retail-amount-line"><input className={selling&&(!valid||number===0)?'is-invalid':''} aria-label="Montant de la simulation" inputMode="none" autoComplete="off" placeholder="0" style={{fontSize}} value={display} onChange={event=>onAmount(event.target.value?cleanAmount(event.target.value):'')}/>{selling?assetPill:<CurrencyPill currency={currency} onClick={()=>setPicker('currency')}/>}</div>
      <div className="retail-amount-line retail-conversion"><span>{converted===null?(selling?'0':'—'):selling?new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(converted):cryptoAmount(converted)}</span>{selling?<CurrencyPill currency={currency} onClick={()=>setPicker('currency')}/>:assetPill}</div>
    </div>
    {!selling&&<button className={`retail-payment ${simulation?'is-simulation':''}`} aria-label="Mode de paiement" onClick={()=>setPicker('provider')}><span className="retail-google-pay" aria-hidden="true">{simulation?<FiCheck/>:<><b>G</b><span>Pay</span></>}</span><span><small>Payer avec</small><strong>{simulation?'Simulation locale':'Google Pay'}</strong></span><FiChevronRight/></button>}
    <NumericKeypad value={amount} onChange={onAmount}/>
    <footer className="retail-footer"><button className="trading-primary" aria-label="Vérifier la simulation" disabled={!simulation||!valid} onClick={()=>onReview(units)}>Continuer</button></footer>
    {picker==='asset'&&<TokenPicker assets={assets.filter(item=>item.category!=='stocks')} selected={asset.id} balances={balances} onPick={id=>{onAsset(id);setPicker(null)}} onClose={()=>setPicker(null)}/>}
    {['currency','provider'].includes(picker)&&<TradingDialog className="retail-options" title={picker==='currency'?'Devise':'Payer avec'} onClose={()=>setPicker(null)}>{picker==='currency'?CURRENCIES.map(item=><button className="retail-option" key={item.id} onClick={()=>{onCurrency(item.id);setPicker(null)}}><CurrencyFlag currency={item.id}/><span><strong>{item.id}</strong><small>{item.name}</small></span>{currency===item.id&&<FiCheck/>}</button>):<><button className="retail-option" disabled><span className="retail-google-pay"><b>G</b><span>Pay</span></span><span><strong>Google Pay</strong><small>Aucun fournisseur disponible</small></span></button><button className="retail-option" onClick={()=>{onSimulation();setPicker(null)}}><FiCheck/><span><strong>Simulation locale</strong><small>Soldes fictifs, aucun paiement ni transfert réel.</small></span><FiChevronRight/></button></>}</TradingDialog>}
  </section>
}
