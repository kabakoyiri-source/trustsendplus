import React,{useEffect,useState} from 'react'
import {FiArrowLeft,FiChevronDown,FiChevronRight,FiX} from 'react-icons/fi'
import {ScanGlyph} from './WalletArtwork'
import AssetIcon from './AssetIcon'
import {cleanAmount,cryptoAmount,FiatToggleGlyph,NumericKeypad,TokenPicker} from './TradingControls'
import {walletMoney} from './WalletHome'

export const ADDRESS_CONTACTS=[
  {name:'D Main 1',address:'0xde64ee9b488b608f5240fea359525ca44c4ba22a'},
  {name:'Main Wallet Test QR',address:'0xa52d5c2ce7128941a1632554bcd154e567f771d9'},
  {name:'Wallet 4',address:'0xc9f92f48bb45cf54e31cffa5785771978f372de4'},
]
function ContactAvatar(){return <span className="send-contact-avatar"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 5 7v8c0 7 5 12 11 15V3Z" fill="#3c29ff"/><path d="m16 3 11 4v8c0 7-5 12-11 15Z" fill="none" stroke="#3c29ff" strokeWidth="1.6"/></svg></span>}

export function SendRecipient({asset,assets,balances,address,onAddress,onAsset,onClose,onContinue,onScan,say}) {
  const [picker,setPicker]=useState(false),[addressBook,setAddressBook]=useState(false)
  const networkAsset=assets.find(item=>item.name===asset.network||asset.network==='Ethereum'&&item.id==='eth')||asset
  async function paste(){try{onAddress((await navigator.clipboard.readText()).trim())}catch{say('Collage indisponible. Saisissez une adresse ou choisissez un contact.')}}
  return <section className="send-panel send-recipient-panel">
    <header className="trading-sheet-header"><button aria-label="Retour" onClick={onClose}><FiX/></button><h1>Envoyer à</h1><button aria-label="Scanner une adresse" onClick={onScan}><ScanGlyph/></button></header>
    <div className="send-recipient-scroll">
      <div className="send-address-card"><textarea aria-label="Destinataire" placeholder="Adresse ou nom de domaine" maxLength={180} value={address} onChange={event=>onAddress(event.target.value)}/><div><button className="send-network-pill" onClick={()=>setPicker(true)} aria-label="Choisir la crypto à envoyer"><AssetIcon asset={networkAsset}/>{asset.network}<FiChevronDown/></button><button className="send-paste" onClick={paste}>Coller</button></div></div>
      <section className="send-address-book"><button className="send-address-heading" onClick={()=>setAddressBook(value=>!value)}><h2>Carnet d’adresses</h2><FiChevronRight/></button>{ADDRESS_CONTACTS.map(contact=><button className={`send-contact ${address===contact.address?'selected':''}`} key={contact.name} onClick={()=>onAddress(contact.address)}><ContactAvatar/><span><strong>{contact.name}</strong><small>{contact.address}</small></span></button>)}</section>
    </div>
    <footer className="trading-sheet-footer"><button className="trading-primary" disabled={address.trim().length<3} onClick={onContinue}>Continuer</button></footer>
    {picker&&<TokenPicker assets={assets} balances={balances} selected={asset.id} onPick={id=>{onAsset(id);setPicker(false)}} onClose={()=>setPicker(false)}/>}
    {addressBook&&<div className="trading-dialog-backdrop" onClick={()=>setAddressBook(false)}><section className="trading-token-picker" role="dialog" aria-modal="true" aria-label="Carnet d’adresses" onClick={event=>event.stopPropagation()}><header><h2>Carnet d’adresses</h2><button aria-label="Fermer" onClick={()=>setAddressBook(false)}><FiX/></button></header>{ADDRESS_CONTACTS.map(contact=><button className="send-contact" key={contact.name} onClick={()=>{onAddress(contact.address);setAddressBook(false)}}><ContactAvatar/><span><strong>{contact.name}</strong><small>{contact.address}</small></span></button>)}</section></div>}
  </section>
}

export function SendAmount({asset,assets,balance,balances,address,currency,amount,onAmount,onAsset,onBack,onReview}) {
  const [entry,setEntry]=useState(amount),[fiat,setFiat]=useState(false),[picker,setPicker]=useState(false)
  const number=Number(entry),units=fiat?asset.price>0?number/asset.price:0:number
  const valid=Number.isFinite(units)&&units>0&&units<=1e9,insufficient=valid&&units>balance
  useEffect(()=>onAmount(entry&&Number.isFinite(units)?String(units):''),[entry,fiat,asset.price,onAmount])
  function toggle(){if(!asset.price)return;setEntry(entry?String(fiat?number/asset.price:number*asset.price):'');setFiat(value=>!value)}
  function maximum(){setFiat(false);setEntry(String(balance))}
  return <section className="send-panel send-amount-panel">
    <header className="trading-sheet-header"><button aria-label="Retour" onClick={onBack}><FiArrowLeft/></button><h1>Montant</h1><span/></header>
    <div className="send-recipient-strip"><span>À :</span><strong>{address}</strong></div>
    <div className="send-amount-hero"><input className={entry?'':'is-empty'} aria-label="Montant de la simulation" inputMode="none" autoComplete="off" placeholder="0" value={entry.replace('.',',')} onChange={event=>setEntry(event.target.value?cleanAmount(event.target.value):'')}/><button className="send-fiat-toggle" aria-label="Basculer le montant en monnaie" onClick={toggle}>{fiat?`≈ ${cryptoAmount(units)} ${asset.symbol}`:`≈ ${walletMoney(entry&&Number.isFinite(asset.price)?number*asset.price:0,currency)}`}<FiatToggleGlyph/></button>{insufficient&&<p className="send-amount-error" role="alert">Solde insuffisant</p>}</div>
    <div className="send-available"><button className="send-balance-token" aria-label="Changer la crypto à envoyer" onClick={()=>setPicker(true)}><AssetIcon asset={asset}/><span><strong>{cryptoAmount(balance)} {asset.symbol}</strong><small>{walletMoney(balance===0?0:Number.isFinite(asset.price)?balance*asset.price:null,currency)}</small></span></button><button className="send-max" onClick={maximum}>Max</button></div>
    <NumericKeypad value={entry} onChange={setEntry}/>
    <footer className="trading-sheet-footer"><button className="trading-primary" aria-label="Vérifier la simulation" disabled={!valid||insufficient} onClick={()=>onReview(units)}>Vérifier</button></footer>
    {picker&&<TokenPicker assets={assets} balances={balances} selected={asset.id} onPick={id=>{onAsset(id);setPicker(false)}} onClose={()=>setPicker(false)}/>}
  </section>
}
