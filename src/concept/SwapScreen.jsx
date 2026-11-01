import React,{useState} from 'react'
import {FiArrowDown,FiArrowLeft,FiChevronDown,FiChevronRight,FiX} from 'react-icons/fi'
import {SlidersGlyph,WalletGlyph} from './WalletArtwork'
import {AssetTokenLogo} from './AssetIcon'
import {cleanAmount,cryptoAmount,FiatToggleGlyph,NumericKeypad,TokenPicker} from './TradingControls'
import {walletMoney} from './WalletHome'

export default function SwapScreen({assets,source,target,balances,currency,amount,onAmount,onPair,onBack,onReview,tolerance,onTolerance}) {
  const [picker,setPicker]=useState(null),[settings,setSettings]=useState(false),[market,setMarket]=useState(false),[progress,setProgress]=useState(0)
  const number=Number(amount),balance=balances[source.id]||0,hasRate=source.price>0&&target.price>0,received=hasRate&&number>0?number*source.price/target.price:0
  const valid=Number.isFinite(number)&&number>0&&number<=1e9&&number<=balance&&hasRate
  const percent=balance>0?Math.min(100,number/balance*100):0
  const reverse=()=>{onPair(target.id,source.id);setProgress(0)}
  function choose(id){if(picker==='from')onPair(id,id===target.id?source.id:target.id);else onPair(id===source.id?target.id:source.id,id);setPicker(null)}
  function finish(){if(valid&&progress>=95){setProgress(0);onReview()}else setProgress(0)}
  return <section className="swap-screen">
    <header className="swap-header"><button className="swap-round-button" aria-label="Retour" onClick={onBack}><FiArrowLeft/></button><span/><button className="swap-market" onClick={()=>setMarket(true)}>Market<FiChevronDown/></button><button className="swap-round-button" aria-label="Paramètres du swap" onClick={()=>setSettings(true)}><SlidersGlyph/></button></header>
    <div className="swap-quote-cards">
      <div className="swap-quote-card"><input aria-label="Montant de la simulation" inputMode="none" autoComplete="off" placeholder="0" value={amount.replace('.',',')} onChange={event=>{onAmount(event.target.value?cleanAmount(event.target.value):'');setProgress(0)}}/><button className="swap-token-pill" aria-label="Choisir la crypto source" onClick={()=>setPicker('from')}><AssetTokenLogo asset={source}/>{source.symbol}<FiChevronRight/></button><span className="swap-fiat">{walletMoney(number>0&&hasRate?number*source.price:0,currency)}<FiatToggleGlyph/></span><button className="swap-wallet-balance" aria-label="Utiliser tout le solde" onClick={()=>onAmount(String(balance))}><WalletGlyph/>{cryptoAmount(balance)}</button></div>
      <button className="swap-invert" aria-label="Inverser les actifs" onClick={reverse}><FiArrowDown/></button>
      <div className="swap-quote-card"><strong className={received?'':'is-empty'}>{received?cryptoAmount(received):'0'}</strong><button className="swap-token-pill" aria-label="Choisir la crypto destination" onClick={()=>setPicker('to')}><AssetTokenLogo asset={target}/>{target.symbol}<FiChevronRight/></button><span className="swap-fiat">{walletMoney(number>0&&hasRate?received*target.price:0,currency)}</span><span className="swap-wallet-balance"><WalletGlyph/>{cryptoAmount(balances[target.id]||0)}</span></div>
      {number>balance&&<p className="swap-validation" role="alert">Solde insuffisant</p>}{number>0&&!hasRate&&<p className="swap-validation" role="alert">Cours momentanément indisponibles</p>}
    </div>
    <div className="swap-keypad-space"/>
    <div className="swap-percentage"><div aria-hidden="true">{[0,25,50,75,100].map(value=><i key={value}/>)}</div><input type="range" min="0" max="100" step="1" aria-label="Pourcentage du solde" value={percent} disabled={balance===0} onChange={event=>{onAmount(String(balance*Number(event.target.value)/100));setProgress(0)}}/></div>
    <NumericKeypad value={amount} onChange={value=>{onAmount(value);setProgress(0)}}/>
    <footer className="swap-slide-footer"><div className={`swap-slide ${valid?'is-ready':''}`}><span className="swap-slide-handle" style={{left:`calc(5px + (100% - 66px) * ${progress/100})`}}><FiChevronRight/></span><span>Glissez pour swapper</span><input type="range" min="0" max="100" step="1" aria-label="Glissez pour swapper" value={progress} disabled={!valid} onChange={event=>setProgress(Number(event.target.value))} onPointerUp={finish} onKeyUp={event=>{if(['End','Enter','ArrowRight'].includes(event.key)&&valid&&Number(event.currentTarget.value)>=95){setProgress(0);onReview()}}}/></div></footer>
    {picker&&<TokenPicker assets={assets} balances={balances} selected={picker==='from'?source.id:target.id} onPick={choose} onClose={()=>setPicker(null)}/>}
    {(settings||market)&&<div className="trading-dialog-backdrop" onClick={()=>{setSettings(false);setMarket(false)}}><section className="swap-settings-dialog" role="dialog" aria-modal="true" aria-label={settings?'Paramètres du swap':'Type de swap'} onClick={event=>event.stopPropagation()}><header><h2>{settings?'Tolérance de glissement':'Market'}</h2><button aria-label="Fermer" onClick={()=>{setSettings(false);setMarket(false)}}><FiX/></button></header>{settings?<><p>Simulation au cours actuel du marché.</p><div>{['0,5','1','3'].map(value=><button key={value} className={tolerance===value?'selected':''} onClick={()=>onTolerance(value)}>{value} %</button>)}</div></>:<p>Market utilise les cotations actuelles. Le swap reste une simulation locale, sans ordre réel.</p>}</section></div>}
  </section>
}
