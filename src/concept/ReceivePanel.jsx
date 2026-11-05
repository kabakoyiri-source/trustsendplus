import React,{useState} from 'react'
import {FiAlertCircle,FiCheck,FiChevronRight,FiCopy,FiPlus,FiUpload,FiX} from 'react-icons/fi'
import {TokenArtwork} from './WalletArtwork'
import AssetIcon from './AssetIcon'
import {validReceiveAddress} from './receive-address.mjs'
import {configuredReceiveAddress,receiveAddressKey} from './receive-config'
import useReceiveQr from './useReceiveQr'

export default function ReceivePanel({asset,assets,wallet,addresses,onAddress,onAsset,onClose,onDeposit,say}) {
  const key=receiveAddressKey(wallet,asset),address=configuredReceiveAddress(wallet,asset,addresses)
  const networkIcon={Ethereum:'eth',Bitcoin:'btc',Solana:'sol','BNB Smart Chain':'bnb',Tron:'usdt',Polygon:'pol'}[asset.network]||asset.id
  const [picker,setPicker]=useState(false),[editing,setEditing]=useState(false),[draft,setDraft]=useState(''),[addressError,setAddressError]=useState(''),[saving,setSaving]=useState(false)
  const qr=useReceiveQr(asset,address)
  function editAddress(){setDraft(address);setAddressError('');setEditing(true)}
  async function saveAddress(){setSaving(true);const value=draft.trim();if(await validReceiveAddress(asset,value)){onAddress(key,value);setEditing(false)}else setAddressError(`Adresse non valide pour ${asset.network}.`);setSaving(false)}
  async function copy(){try{await navigator.clipboard.writeText(address);say('Adresse copiée')}catch{say('Copie indisponible. Sélectionnez l’adresse affichée.')}}
  async function share(){try{if(navigator.share)await navigator.share({title:`Receive ${asset.symbol}`,text:`${asset.name} · ${asset.network}\n${address}`});else await copy()}catch(error){if(error.name!=='AbortError')say('Partage indisponible')}}
  return <section className="receive-panel" aria-labelledby="receive-title">
    <header className="receive-header"><button className="receive-close" aria-label="Retour" onClick={onClose}><FiX/></button><h1 id="receive-title">Receive {asset.symbol}</h1><span/></header>
    <div className="receive-body">
      <button className="receive-network" onClick={()=>setPicker(true)} aria-label="Choisir la crypto à recevoir"><span><TokenArtwork id={networkIcon}/></span>{asset.network}</button>
      <div className="receive-qr-card">
        <div className="receive-qr-art">{qr.src?<><img src={qr.src} alt={`QR de réception ${asset.symbol} : ${address}`} data-testid="receive-qr"/><span className="receive-qr-logo"><span style={{background:asset.color}}><AssetIcon asset={asset}/></span></span></>:<button className="receive-qr-empty" onClick={editAddress}><FiPlus/><span>{qr.loading?'Génération du QR…':address?`Adresse non valide pour ${asset.network}`:`Renseigner une adresse ${asset.network}`}</span></button>}</div>
        <button className="receive-address" aria-label="Modifier l’adresse affichée" onClick={editAddress}>{address||'Renseigner une adresse'}</button>
      </div>
      <div className="receive-notice"><FiAlertCircle/><p>Envoyez uniquement des actifs {asset.network} à cette adresse. Tout autre actif sera perdu définitivement.</p></div>
      <div className="receive-actions"><button onClick={copy} disabled={!qr.src}><span><FiCopy/></span>Copy</button><button onClick={share} disabled={!qr.src}><span><FiUpload/></span>Share</button></div>
      <button className="receive-coinbase" onClick={onDeposit}><span aria-hidden="true">C</span>Deposit from Coinbase</button>
    </div>
    {(picker||editing)&&<div className="receive-options-backdrop" onClick={()=>{setPicker(false);setEditing(false)}}><div className="receive-options" role="dialog" aria-modal="true" aria-label={picker?'Choisir la crypto':'Modifier l’adresse de réception'} onClick={e=>e.stopPropagation()}>
      <button className="receive-options-close" aria-label="Fermer" onClick={()=>{setPicker(false);setEditing(false)}}><FiX/></button>
      {picker?<><h2>Receive</h2>{assets.map(item=><button className="receive-asset-option" key={item.id} aria-label={`Choisir ${item.symbol}`} onClick={()=>{onAsset(item.id);setPicker(false)}}><span><AssetIcon asset={item}/></span><strong>{item.name}<small>{item.network}</small></strong>{item.id===asset.id?<FiCheck/>:<FiChevronRight/>}</button>)}</>:<><h2>Adresse affichée</h2><label className="field-label">Adresse<input autoFocus maxLength={120} value={draft} aria-invalid={Boolean(addressError)} aria-describedby={addressError?'receive-address-error':undefined} onChange={e=>{setDraft(e.target.value);setAddressError('')}}/></label>{addressError&&<p id="receive-address-error" className="negative receive-address-error" role="alert">{addressError}</p>}<button className="primary" disabled={!draft.trim()||saving} onClick={saveAddress}>{saving?'Vérification…':'Enregistrer'}</button></>}
    </div></div>}
  </section>
}
