const assert=require('node:assert/strict'),{PNG}=require('pngjs'),jsQR=require('jsqr');
function scanQrPng(buffer){
 const image=PNG.sync.read(buffer),result=jsQR(new Uint8ClampedArray(image.data),image.width,image.height,{inversionAttempts:'dontInvert'});
 assert(result,'The rendered QR, including its logo, must be readable.');
 return result.data;
}
async function scanReceiveQr(page){
 const toast=page.locator('.toast');if(await toast.count())await toast.waitFor({state:'hidden'});
 const image=page.getByTestId('receive-qr');await image.waitFor();
 await image.evaluate(async element=>{if(element.decode)await element.decode()});
 const screenshot=await page.locator('.receive-qr-art').screenshot();
 try{return scanQrPng(screenshot)}catch(error){require('node:fs').mkdirSync(require('node:path').resolve(__dirname,'../qa/receive-qr'),{recursive:true});require('node:fs').writeFileSync(require('node:path').resolve(__dirname,'../qa/receive-qr/unreadable.png'),screenshot);throw error}
}
module.exports={scanQrPng,scanReceiveQr};
