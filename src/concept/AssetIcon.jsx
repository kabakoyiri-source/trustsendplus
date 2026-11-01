import React,{useState} from 'react'
import {TokenArtwork} from './WalletArtwork'

export default function AssetIcon({asset}) {
  const [failedFor,setFailedFor]=useState(null)
  const common=['eth','btc','usdc','usdt','sol','bnb','pol','hype','whype']
  return <span className="asset-icon-art" style={{background:asset.color||'#eee'}} aria-hidden="true">{common.includes(asset.id)?<TokenArtwork id={asset.id==='whype'?'hype':asset.id}/>:failedFor!==asset.id?<img src={`/tokens/${asset.id}.png`} alt="" onError={()=>setFailedFor(asset.id)}/>:<span className="asset-icon-initial">{asset.symbol.slice(0,2)}</span>}</span>
}

export function AssetNetworkBadge({asset,className='browse-network-mark',hideNative=false}) {
  const id={'BNB Smart Chain':'bnb',Ethereum:'eth',HyperEVM:'hype',Solana:'sol',Tron:'trx',Polygon:'pol',Bitcoin:'btc'}[asset.network]
  if(!id||(hideNative&&id===asset.id))return null
  return <span className={className} aria-hidden="true">{id==='trx'?<svg viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="#ef183c"/><path d="m4 4 12 2-6 11Zm0 0 7 5 5-3m-5 3-1 8" fill="none" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/></svg>:<TokenArtwork id={id}/>}</span>
}

export function AssetTokenLogo({asset}) {
  return <span className="asset-token-logo"><AssetIcon asset={asset}/><AssetNetworkBadge asset={asset} hideNative/></span>
}
