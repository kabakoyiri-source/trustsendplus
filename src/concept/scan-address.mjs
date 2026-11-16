import {receiveNetworkKind,validReceiveAddress} from './receive-address.mjs'

const CHAINS={'1':'Ethereum','56':'BNB Smart Chain','137':'Polygon','10':'Optimism','100':'Gnosis','999':'HyperEVM'}
export async function scannedAddress(payload,assets,preferred) {
  if(typeof payload!=='string'||payload.length>2048)throw Error('Ce QR ne contient pas une adresse publique prise en charge.')
  let address=payload.trim(),kind='',network=''
  const uri=address.match(/^(ethereum|bitcoin|solana|tron):(?:\/\/)?(.+)$/i)
  if(uri){
    kind=uri[1].toLowerCase()==='ethereum'?'evm':uri[1].toLowerCase()
    const target=uri[2].split('?')[0].replace(/^pay-/,'')
    if(target.includes('/'))throw Error('Ce QR demande une action de contrat non prise en charge.')
    const [publicAddress,chain]=target.split('@')
    if(chain&&!CHAINS[chain])throw Error('Le réseau de ce QR n’est pas pris en charge.')
    network=chain?CHAINS[chain]:kind==='evm'?'Ethereum':''
    address=publicAddress
  }
  const candidates=[preferred,...assets].filter((asset,index,list)=>asset&&list.findIndex(item=>item?.id===asset.id)===index)
  for(const asset of candidates){
    if(kind&&receiveNetworkKind(asset)!==kind||network&&asset.network!==network)continue
    if(await validReceiveAddress(asset,address))return {address,assetId:asset.id}
  }
  throw Error('Adresse non valide ou réseau non disponible pour ce portefeuille.')
}
