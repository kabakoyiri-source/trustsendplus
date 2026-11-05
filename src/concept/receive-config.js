import DEFAULT_WATCH from './default-watch-wallet.json'
import {receiveNetworkKind} from './receive-address.mjs'

export const receiveAddressKey=(wallet,asset)=>`${wallet.id}:${asset.id}`

export function defaultReceiveAddress(wallet,asset) {
  const kind=receiveNetworkKind(asset)
  if(wallet.type==='watch'&&kind===receiveNetworkKind({networkId:wallet.watch.network}))return wallet.watch.address
  return kind==='evm'?(wallet.receiveAddress||DEFAULT_WATCH.watch.address):''
}

export function configuredReceiveAddress(wallet,asset,addresses) {
  const saved=addresses?.[receiveAddressKey(wallet,asset)]
  return saved&&!/^(?:0xDEMO|bc1qDEMO|DEMO-|T-DEMO)/i.test(saved)?saved:defaultReceiveAddress(wallet,asset)
}
