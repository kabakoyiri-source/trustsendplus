const BASE58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function receiveNetworkKind(asset) {
  const name=String(asset.networkId||asset.network||'').toLowerCase()
  if(['ethereum','bsc','bnb smart chain','polygon','hyperevm','gnosis','optimism'].includes(name))return 'evm'
  return ['bitcoin','solana','tron'].includes(name)?name:''
}

function base58(value) {
  let number=0n
  for(const character of value){const index=BASE58.indexOf(character);if(index<0)throw Error('Invalid base58');number=number*58n+BigInt(index)}
  let hex=number.toString(16);if(hex.length%2)hex='0'+hex
  const body=number===0n?[]:hex.match(/../g).map(byte=>parseInt(byte,16))
  return Uint8Array.from([...Array(value.match(/^1*/)[0].length).fill(0),...body])
}

async function base58check(value,length,prefixes) {
  const bytes=base58(value)
  if(bytes.length!==length+4||!prefixes.includes(bytes[0]))return false
  const first=await crypto.subtle.digest('SHA-256',bytes.slice(0,-4))
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',first))
  return bytes.slice(-4).every((byte,index)=>byte===hash[index])
}

function bech32(value) {
  if(value!==value.toLowerCase()&&value!==value.toUpperCase())return false
  const text=value.toLowerCase(),alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  if(text.length>90||!/^bc1[023456789acdefghjklmnpqrstuvwxyz]{8,87}$/.test(text))return false
  const data=[...text.slice(3)].map(character=>alphabet.indexOf(character))
  let mod=1
  for(const number of [3,3,0,2,3,...data]){
    const high=mod>>>25;mod=((mod&0x1ffffff)<<5)^number
    ;[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3].forEach((generator,index)=>{if((high>>>index)&1)mod^=generator})
  }
  const version=data[0]
  if(version>16||(mod>>>0)!==(version===0?1:0x2bc830a3))return false
  let acc=0,bits=0,bytes=0
  for(const number of data.slice(1,-6)){acc=(acc<<5)|number;bits+=5;while(bits>=8){bits-=8;bytes++}}
  return bits<5&&((acc<<(8-bits))&255)===0&&bytes>=2&&bytes<=40&&(version!==0||[20,32].includes(bytes))
}

export async function validReceiveAddress(asset,address) {
  if(typeof address!=='string'||!address||address.length>120||/\s/.test(address))return false
  try {
    switch(receiveNetworkKind(asset)){
      case 'evm':return /^0x[0-9a-fA-F]{40}$/.test(address)
      case 'solana':return base58(address).length===32
      case 'tron':return await base58check(address,21,[0x41])
      case 'bitcoin':return /^[13]/.test(address)?await base58check(address,21,[0,5]):bech32(address)
      default:return false
    }
  }catch{return false}
}
