import React,{useState} from 'react'
import {FiCopy,FiRefreshCw} from 'react-icons/fi'
import {TradingDialog} from './TradingControls'

export default function WatchWalletBadge({wallet,observation,partial,say}) {
  const [details,setDetails]=useState(false)
  async function copy(){try{await navigator.clipboard.writeText(wallet.watch.address);say('Adresse publique copiée')}catch{say('Copie indisponible')}}
  return <section className="watch-wallet-status">
    <button className="watch-type-pill" aria-label="Informations du portefeuille en lecture seule" onClick={()=>setDetails(true)}>View-only wallet{(observation.error||observation.data?.stale)&&<i aria-label="Données à actualiser"/>}</button>
    <button className="watch-copy-address" aria-label="Copier l’adresse surveillée" onClick={copy}><FiCopy/></button>
    {details&&<TradingDialog title="Portefeuille en lecture seule" className="watch-information" onClose={()=>setDetails(false)}>
      <p className="watch-public-address">{wallet.watch.address}</p>
      <button className="manager-option" onClick={copy}><FiCopy/>Copier l’adresse surveillée</button>
      <button className="manager-option" aria-label="Actualiser le portefeuille surveillé" onClick={observation.refresh}><FiRefreshCw/>{observation.loading?'Actualisation…':'Actualiser'}</button>
      {observation.error&&<p role="alert" className="negative">{observation.error}</p>}
      {observation.data?.stale&&<p>Dernières données enregistrées.</p>}
      {partial&&<p>La valorisation et la variation utilisent les actifs dont les cours sont disponibles.</p>}
      {observation.data?.source&&<p>{observation.data.sourceUrl?<a href={observation.data.sourceUrl} target="_blank" rel="noreferrer noopener">{observation.data.source}</a>:observation.data.source}{observation.data.fetchedAt?' · '+new Date(observation.data.fetchedAt).toLocaleString('fr-FR'):''}</p>}
      {[...new Set(observation.data?.warnings||[])].map(message=><p key={message}>{message}</p>)}
      <p>Les simulations ne changent pas les soldes de cette adresse.</p>
    </TradingDialog>}
  </section>
}
