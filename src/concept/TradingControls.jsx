import React,{useEffect,useState} from 'react'
import {FiCheck,FiDelete,FiSearch,FiX} from 'react-icons/fi'
import AssetIcon from './AssetIcon'

export function cleanAmount(value){const text=String(value).replaceAll(',','.').replace(/[^0-9.]/g,'');const [whole,...fraction]=text.split('.');return ((whole.replace(/^0+(?=\d)/,'')||'0')+(fraction.length?'.'+fraction.join('').slice(0,18):'')).slice(0,27)}
export function NumericKeypad({value,onChange}) {
  const enter=key=>{if(key==='delete')onChange(value.slice(0,-1));else if(key==='.'&&value.includes('.'))return;else onChange(cleanAmount(value+key))}
  useEffect(()=>{const handle=event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.target?.closest?.('input,textarea,[contenteditable]'))return
    if(/^[0-9.,]$/.test(event.key)){event.preventDefault();enter(event.key===','?'.':event.key)}
    if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();enter('delete')}
  };window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle)},[value,onChange])
  return <div className="numeric-keypad" role="group" aria-label="Clavier du montant">{['1','2','3','4','5','6','7','8','9','.','0','delete'].map(key=><button type="button" key={key} aria-label={key==='delete'?'Effacer le montant':key==='.'?'Virgule':key} onClick={()=>enter(key)}>{key==='delete'?<FiDelete/>:key==='.'?',':key}</button>)}</div>
}

export function TokenPicker({assets,selected,balances={},onPick,onClose}) {
  const [query,setQuery]=useState('')
  const rows=assets.filter(asset=>`${asset.name} ${asset.symbol} ${asset.network}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="trading-dialog-backdrop" onClick={onClose}><section className="trading-token-picker" role="dialog" aria-modal="true" aria-label="Choisir une crypto" onClick={event=>event.stopPropagation()} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose()}}}>
    <header><h2>Choisir une crypto</h2><button aria-label="Fermer" onClick={onClose}><FiX/></button></header>
    <label className="trading-token-search"><FiSearch/><input aria-label="Rechercher une crypto" placeholder="Rechercher" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <div className="trading-token-list">{rows.map(asset=><button key={asset.id} aria-label={`Choisir ${asset.symbol}`} onClick={()=>onPick(asset.id)}><AssetIcon asset={asset}/><span><strong>{asset.symbol}</strong><small>{asset.name} · {asset.network}</small></span><small>{new Intl.NumberFormat('fr-FR',{maximumFractionDigits:8,useGrouping:false}).format(balances[asset.id]||0)}</small>{selected===asset.id&&<FiCheck/>}</button>)}{!rows.length&&<p className="empty">Aucun résultat</p>}</div>
  </section></div>
}

export function FiatToggleGlyph(){return <svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M5 14V3m0 0L2 6m3-3 3 3M13 4v11m0 0 3-3m-3 3-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}

export function cryptoAmount(value){return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:8,useGrouping:false}).format(Number.isFinite(value)?value:0)}
