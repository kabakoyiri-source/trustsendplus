const fs=require('node:fs'),path=require('node:path');
const {watch}=require('../src/concept/default-watch-wallet.json');
(async()=>{
 const {receiveQrSvg}=await import('../src/concept/receive-qr.mjs');
 const {validReceiveAddress}=await import('../src/concept/receive-address.mjs');
 const address=process.argv[2]||watch.address;
 if(!await validReceiveAddress({network:'Ethereum'},address))throw Error('Provide a valid Ethereum public address.');
 fs.writeFileSync(path.join(__dirname,'../public/receive-qr.svg'),receiveQrSvg(address));
 console.log(`Default Ethereum QR generated for ${address}. The app generates other addresses locally.`);
})().catch(error=>{console.error(error.message);process.exitCode=1});
