import React,{useLayoutEffect,useRef,useState} from 'react'
import {FiChevronDown,FiClipboard,FiRotateCcw} from 'react-icons/fi'
import AssetIcon from './AssetIcon'
import {TokenPicker} from './TradingControls'
import {WalletGlyph} from './WalletArtwork'
import {validReceiveAddress} from './receive-address.mjs'
import {configuredReceiveAddress,defaultReceiveAddress,receiveAddressKey} from './receive-config'

export default function ReceiveAddresses({wallet,assets,addresses,initialAssetId,onAddress,onReceive,say}) {
  const [selected,setSelected]=useState(initialAssetId),[picker,setPicker]=useState(false)
  const asset=assets.find(item=>item.id===selected)||assets[0]
  const key=asset?receiveAddressKey(wallet,asset):'',current=asset?configuredReceiveAddress(wallet,asset,addresses):''
  const [draft,setDraft]=useState(current),[error,setError]=useState(''),[saving,setSaving]=useState(false)
  const currentKey=useRef(key);currentKey.current=key
  useLayoutEffect(()=>{setDraft(current);setError('')},[key,current])
  if(!asset)return <div className="empty">Aucune crypto disponible.</div>
  const dirty=draft.trim()!==current
  async function paste(){const target=key;try{const value=(await navigator.clipboard.readText()).trim();if(currentKey.current===target){setDraft(value.slice(0,120));setError('')}}catch{if(currentKey.current===target)setError('Collage indisponible. Saisissez votre adresse.')}}
  async function save(event){
    event.preventDefault();if(saving)return
    setSaving(true);setError('')
    if(await validReceiveAddress(asset,draft.trim())){onAddress(key,draft.trim());say(`Adresse ${asset.symbol} enregistrée`)}else setError(`Adresse non valide pour ${asset.network}.`)
    setSaving(false)
  }
  function reset(){onAddress(key,null);setDraft(defaultReceiveAddress(wallet,asset));setError('');say('Adresse par défaut rétablie')}
  return <section className="receive-address-settings">
    <div className="address-settings-wallet"><WalletGlyph/><span>{wallet.name}</span></div>
    <p className="address-settings-intro">Choisissez une crypto et son adresse de réception. Elle sera utilisée dans Recevoir et dans le QR code.</p>
    <span className="address-settings-label">Crypto</span>
    <button className="address-settings-token" aria-label="Choisir la crypto à configurer" disabled={saving} onClick={()=>setPicker(true)}><AssetIcon asset={asset}/><span><strong>{asset.name} <small>{asset.symbol}</small></strong><small>{asset.network}</small></span><FiChevronDown/></button>
    <form onSubmit={save}>
      <label className="address-settings-label" htmlFor="settings-receive-address">Adresse de réception</label>
      <textarea id="settings-receive-address" placeholder={`Adresse ${asset.network}`} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={120} value={draft} disabled={saving} aria-invalid={Boolean(error)} aria-describedby={error?'address-settings-error':undefined} onChange={event=>{setDraft(event.target.value);setError('')}}/>
      <button className="soft address-settings-paste" type="button" disabled={saving} onClick={paste}><FiClipboard/>Coller</button>
      {error&&<p id="address-settings-error" className="negative address-settings-error" role="alert">{error}</p>}
      <button className="trading-primary" type="submit" disabled={!draft.trim()||!dirty||saving}>{saving?'Vérification…':'Enregistrer l’adresse'}</button>
    </form>
    <button className="soft full address-settings-preview" disabled={dirty||!current||saving} onClick={()=>onReceive(asset.id)}>Voir le QR code</button>
    {addresses?.[key]&&<button className="text-button address-settings-reset" disabled={saving} onClick={reset}><FiRotateCcw/>Utiliser l’adresse par défaut</button>}
    {picker&&<TokenPicker assets={assets} selected={asset.id} showBalances={false} onPick={id=>{setSelected(id);setPicker(false)}} onClose={()=>setPicker(false)}/>}
  </section>
}
