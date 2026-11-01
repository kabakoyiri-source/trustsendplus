import React,{useState} from 'react'
import {FiAlertCircle,FiCheck,FiChevronRight,FiCopy,FiUpload,FiX} from 'react-icons/fi'
import {TokenArtwork} from './WalletArtwork'
import AssetIcon from './AssetIcon'

const DEMO_ADDRESSES={eth:'0xDEMO4EE9b488B608F5240FeA359525cA44c4ba22A',usdc:'0xDEMO4EE9b488B608F5240FeA359525cA44c4ba22A',bnb:'0xDEMO4EE9b488B608F5240FeA359525cA44c4ba22A',btc:'bc1qDEMO-bitcoin-no-real-deposits-000000',sol:'DEMO-Solana-NoRealDeposits-11111111111111',usdt:'T-DEMO-Tron-NoRealDeposits-111111111111',pol:'0xDEMO4EE9b488B608F5240FeA359525cA44c4ba22A'}

export default function ReceivePanel({asset,assets,walletId,addresses,onAddress,onAsset,onClose,onDeposit,say,readOnlyAddress}) {
  const key=`${walletId}:${asset.id}`,address=addresses?.[key]||readOnlyAddress||DEMO_ADDRESSES[asset.id]||DEMO_ADDRESSES.eth
  const networkIcon={Ethereum:'eth',Bitcoin:'btc',Solana:'sol','BNB Smart Chain':'bnb',Tron:'usdt',Polygon:'pol'}[asset.network]||asset.id
  const [picker,setPicker]=useState(false),[editing,setEditing]=useState(false),[draft,setDraft]=useState('')
  async function copy(){try{await navigator.clipboard.writeText(address);say('Adresse copiée')}catch{say('Copie indisponible. Sélectionnez l’adresse affichée.')}}
  async function share(){try{if(navigator.share)await navigator.share({title:`Receive ${asset.symbol} · Demo`,text:`${asset.name} · Demo only, no real deposits\n${address}`});else await copy()}catch(error){if(error.name!=='AbortError')say('Partage indisponible')}}
  return <section className="receive-panel" aria-labelledby="receive-title">
    <header className="receive-header"><button className="receive-close" aria-label="Retour" onClick={onClose}><FiX/></button><h1 id="receive-title">Receive {asset.symbol}</h1><span/></header>
    <div className="receive-body">
      <button className="receive-network" onClick={()=>setPicker(true)} aria-label="Choisir la crypto à recevoir"><span><TokenArtwork id={networkIcon}/></span>{asset.network}</button>
      <div className="receive-qr-card">
        <div className="receive-qr-art"><img src="/receive-qr.svg" alt="QR de démonstration, identique pour tous les actifs" data-testid="fixed-receive-qr"/><span className="receive-qr-logo"><span style={{background:asset.color}}><AssetIcon asset={asset}/></span></span></div>
        <button className="receive-address" aria-label="Modifier l’adresse affichée" onClick={()=>{setDraft(address);setEditing(true)}}>{address}</button>
      </div>
      <div className="receive-notice"><FiAlertCircle/><p>{readOnlyAddress?'Adresse surveillée en lecture seule. Le QR reste un QR de démonstration et n’encode pas cette adresse.':`Demo only. Do not send real assets to this address. ${asset.network} network preview.`}</p></div>
      <div className="receive-actions"><button onClick={copy}><span><FiCopy/></span>Copy</button><button onClick={share}><span><FiUpload/></span>Share</button></div>
      <button className="receive-coinbase" onClick={onDeposit}><span aria-hidden="true">C</span>Deposit from Coinbase</button>
    </div>
    {(picker||editing)&&<div className="receive-options-backdrop" onClick={()=>{setPicker(false);setEditing(false)}}><div className="receive-options" role="dialog" aria-modal="true" aria-label={picker?'Choisir la crypto':'Modifier l’adresse de démonstration'} onClick={e=>e.stopPropagation()}>
      <button className="receive-options-close" aria-label="Fermer" onClick={()=>{setPicker(false);setEditing(false)}}><FiX/></button>
      {picker?<><h2>Receive</h2>{assets.map(item=><button className="receive-asset-option" key={item.id} aria-label={`Choisir ${item.symbol}`} onClick={()=>{onAsset(item.id);setPicker(false)}}><span><AssetIcon asset={item}/></span><strong>{item.name}<small>{item.network}</small></strong>{item.id===asset.id?<FiCheck/>:<FiChevronRight/>}</button>)}</>:<><h2>Adresse affichée</h2><p className="muted">Le QR de démonstration reste identique.</p><label className="field-label">Adresse<input autoFocus maxLength={128} value={draft} onChange={e=>setDraft(e.target.value)}/></label><button className="primary" disabled={!draft.trim()} onClick={()=>{onAddress(key,draft.trim());setEditing(false)}}>Enregistrer</button></>}
    </div></div>}
  </section>
}
