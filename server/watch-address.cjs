const {createHash}=require('node:crypto');
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58decode(value){let n=0n;for(const character of value){const index=alphabet.indexOf(character);if(index<0)throw Error('Invalid base58');n=n*58n+BigInt(index)}let hex=n.toString(16);if(hex.length%2)hex='0'+hex;return Buffer.concat([Buffer.alloc((value.match(/^1*/)||[''])[0].length),n===0n?Buffer.alloc(0):Buffer.from(hex,'hex')])}
function base58encode(bytes){let n=BigInt('0x'+Buffer.from(bytes).toString('hex')),result='';while(n){result=alphabet[Number(n%58n)]+result;n/=58n}for(const byte of bytes){if(byte!==0)break;result='1'+result}return result}
const checksum=bytes=>createHash('sha256').update(createHash('sha256').update(bytes).digest()).digest().subarray(0,4);
function base58check(value){const bytes=base58decode(value);if(bytes.length<5||!checksum(bytes.subarray(0,-4)).equals(bytes.subarray(-4)))throw Error('Invalid checksum');return bytes.subarray(0,-4)}
function tronAddress(value){if(/^41[0-9a-f]{40}$/i.test(value)){const bytes=Buffer.from(value,'hex');return base58encode(Buffer.concat([bytes,checksum(bytes)]))}return value}
function bitcoinValid(value){
 if(/^[13]/.test(value)){try{const bytes=base58check(value);return bytes.length===21&&[0,5].includes(bytes[0])}catch{return false}}
 if(value!==value.toLowerCase()&&value!==value.toUpperCase())return false;
 const text=value.toLowerCase();if(!/^bc1[023456789acdefghjklmnpqrstuvwxyz]{8,87}$/.test(text))return false;
 const charset='qpzry9x8gf2tvdw0s3jn54khce6mua7l',data=[...text.slice(3)].map(char=>charset.indexOf(char));if(data.some(n=>n<0))return false;
 let mod=1;for(const n of [3,3,0,2,3,...data]){const high=mod>>>25;mod=((mod&0x1ffffff)<<5)^n;[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3].forEach((generator,index)=>{if((high>>>index)&1)mod^=generator})}
 const version=data[0];if(version>16||((mod>>>0)!==(version===0?1:0x2bc830a3)))return false;
 let acc=0,bits=0,program=[];for(const n of data.slice(1,-6)){acc=(acc<<5)|n;bits+=5;while(bits>=8){bits-=8;program.push((acc>>>bits)&255)}}
 return bits<5&&((acc<<(8-bits))&255)===0&&program.length>=2&&program.length<=40&&(version!==0||[20,32].includes(program.length));
}
function validAddress(network,address){if(typeof address!=='string'||address.length>120)return false;try{if(['evm','binplorer'].includes(network.kind))return /^0x[0-9a-fA-F]{40}$/.test(address);if(network.kind==='solana')return base58decode(address).length===32;if(network.kind==='tron'){const bytes=base58check(address);return bytes.length===21&&bytes[0]===0x41}if(network.kind==='bitcoin')return bitcoinValid(address)}catch{}return false}
function decimalUnits(raw,decimals=18){if(!/^\d+$/.test(String(raw))||!Number.isInteger(Number(decimals))||decimals<0||decimals>36)return null;const text=String(raw).padStart(Number(decimals)+1,'0');return decimals?`${text.slice(0,-decimals)}.${text.slice(-decimals)}`.replace(/0+$/,'').replace(/\.$/,''):text}
module.exports={validAddress,decimalUnits,base58decode,base58encode,tronAddress};
