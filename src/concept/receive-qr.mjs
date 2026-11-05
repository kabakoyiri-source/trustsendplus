import QRCode from 'qrcode'

// Encode the displayed public address directly; retain a four-module quiet zone.
export function receiveQrSvg(address) {
  if(typeof address!=='string'||!address||address.length>120)throw Error('Invalid QR address')
  const qr=QRCode.create(address,{errorCorrectionLevel:'H'}),size=qr.modules.size,quiet=4
  const parts=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size+quiet*2} ${size+quiet*2}"><rect width="100%" height="100%" fill="white"/>`]
  const finders=[[0,0],[size-7,0],[0,size-7]]
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    if(finders.some(([fx,fy])=>x>=fx&&x<fx+7&&y>=fy&&y<fy+7))continue
    if(qr.modules.get(y,x))parts.push(`<rect x="${x+quiet}" y="${y+quiet}" width="1" height="1" rx=".2" fill="#090d10"/>`)
  }
  for(const [x,y] of finders)parts.push(`<rect x="${x+quiet}" y="${y+quiet}" width="7" height="7" rx="2.2" fill="#090d10"/><rect x="${x+quiet+1}" y="${y+quiet+1}" width="5" height="5" rx="1.4" fill="white"/><rect x="${x+quiet+2}" y="${y+quiet+2}" width="3" height="3" rx=".8" fill="#090d10"/>`)
  return parts.join('')+'</svg>'
}

export const receiveQrUrl=address=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(receiveQrSvg(address))
