const fs=require('node:fs');
const path=require('node:path');
const QRCode=require('qrcode');
// This payload never contains a deposit address. The matrix stays fixed for all assets.
const payload='Trust Concept DEMO. No real crypto deposits.';
const qr=QRCode.create(payload,{errorCorrectionLevel:'H'}),size=qr.modules.size,quiet=2;
const parts=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size+quiet*2} ${size+quiet*2}" data-demo-payload="${payload}"><rect width="100%" height="100%" fill="white"/>`];
const finders=[[0,0],[size-7,0],[0,size-7]];
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 if(finders.some(([fx,fy])=>x>=fx&&x<fx+7&&y>=fy&&y<fy+7))continue;
 if(Math.abs(x-(size-1)/2)<4&&Math.abs(y-(size-1)/2)<4)continue;
 if(qr.modules.get(y,x))parts.push(`<circle cx="${x+quiet+.5}" cy="${y+quiet+.5}" r=".48" fill="#090d10"/>`);
}
for(const [x,y] of finders){parts.push(`<rect x="${x+quiet}" y="${y+quiet}" width="7" height="7" rx="2.2" fill="#090d10"/><rect x="${x+quiet+1}" y="${y+quiet+1}" width="5" height="5" rx="1.4" fill="white"/><rect x="${x+quiet+2}" y="${y+quiet+2}" width="3" height="3" rx=".8" fill="#090d10"/>`)}
parts.push('</svg>');
fs.writeFileSync(path.join(__dirname,'../public/receive-qr.svg'),parts.join(''));
console.log(`Fixed demo QR generated (${size} modules); no payment address encoded.`);
