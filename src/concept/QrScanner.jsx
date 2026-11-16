import React,{useEffect,useRef,useState} from 'react'
import {FiImage,FiX,FiZap} from 'react-icons/fi'
import {scannedAddress} from './scan-address.mjs'
import './scanner.css'

let decoder
async function readPixels(canvas){
  decoder||=import('jsqr').then(module=>module.default)
  const pixels=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height)
  return (await decoder)(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'})?.data
}
function draw(source,width,height,max=1000){
  const canvas=document.createElement('canvas'),scale=Math.min(1,max/Math.max(width,height))
  canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale)
  canvas.getContext('2d',{willReadFrequently:true}).drawImage(source,0,0,canvas.width,canvas.height)
  return canvas
}
const cameraMessage=error=>error?.name==='NotAllowedError'?'Accès à la caméra refusé. Autorisez la caméra dans les réglages du navigateur.':error?.name==='NotFoundError'?'Aucune caméra détectée. Vous pouvez importer une image QR.':error?.name==='NotReadableError'?'La caméra est utilisée par une autre application. Fermez-la puis réessayez.':'Caméra indisponible. Réessayez ou importez une image QR.'

export default function QrScanner({assets,preferredAsset,onResult,onClose}) {
  const video=useRef(),fileInput=useRef(),stream=useRef(),latest=useRef(),complete=useRef(false),mounted=useRef(false),imageVersion=useRef(0)
  latest.current={assets,preferredAsset,onResult,onClose}
  const [revision,setRevision]=useState(0),[visible,setVisible]=useState(()=>document.visibilityState!=='hidden'),[status,setStatus]=useState('starting'),[error,setError]=useState(''),[torch,setTorch]=useState(false),[canTorch,setCanTorch]=useState(false)
  function stop(){stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null}
  async function accept(payload){
    const result=await scannedAddress(payload,latest.current.assets,latest.current.preferredAsset)
    if(!mounted.current||complete.current)return
    complete.current=true;stop();latest.current.onResult(result)
  }
  useEffect(()=>{
    mounted.current=true
    const visibility=()=>setVisible(document.visibilityState!=='hidden'),hide=()=>{stop();setVisible(false)}
    const escape=event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();latest.current.onClose()}}
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pageshow',visibility);window.addEventListener('pagehide',hide);window.addEventListener('keydown',escape,true)
    return()=>{mounted.current=false;imageVersion.current++;stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pageshow',visibility);window.removeEventListener('pagehide',hide);window.removeEventListener('keydown',escape,true)}
  },[])
  useEffect(()=>{
    if(!visible||complete.current)return
    let canceled=false,timer,busy=false,lastPayload='',native
    setStatus('starting');setError('');setTorch(false);setCanTorch(false)
    try{if(window.BarcodeDetector)native=new window.BarcodeDetector({formats:['qr_code']})}catch{}
    async function tick(){
      if(canceled||complete.current)return
      const element=video.current
      if(!busy&&element?.readyState>=2&&element.videoWidth){
        busy=true
        try{
          let payload
          if(native){try{payload=(await native.detect(element))[0]?.rawValue}catch{native=null}}
          if(!native)payload=await readPixels(draw(element,element.videoWidth,element.videoHeight))
          if(!canceled&&payload&&payload!==lastPayload){lastPayload=payload;await accept(payload)}
        }catch(message){if(!canceled)setError(message.message)}finally{busy=false}
      }
      if(!canceled&&!complete.current)timer=setTimeout(tick,250)
    }
    async function start(){
      try{
        if(!navigator.mediaDevices?.getUserMedia){setStatus('error');setError('La caméra nécessite un navigateur compatible et une connexion HTTPS.');return}
        const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}})
        if(canceled||complete.current){media.getTracks().forEach(track=>track.stop());return}
        stream.current=media;video.current.srcObject=media
        await video.current.play()
        if(canceled)return
        setCanTorch(Boolean(media.getVideoTracks()[0]?.getCapabilities?.().torch));setStatus('ready');tick()
      }catch(message){if(!canceled){stop();setStatus('error');setError(cameraMessage(message))}}
    }
    start()
    return()=>{canceled=true;clearTimeout(timer);stop()}
  },[visible,revision])
  async function light(){try{const next=!torch;await stream.current?.getVideoTracks()[0]?.applyConstraints({advanced:[{torch:next}]});setTorch(next)}catch{setError('La lampe n’est pas disponible sur cet appareil.')}}
  async function importImage(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return
    const version=++imageVersion.current
    let image,url
    try{
      if(file.size>15*1024*1024)throw Error('Choisissez une image de moins de 15 Mo.')
      if(window.createImageBitmap)image=await createImageBitmap(file)
      else{url=URL.createObjectURL(file);image=new Image();image.src=url;await image.decode()}
      const payload=await readPixels(draw(image,image.width,image.height,1600))
      if(!mounted.current||version!==imageVersion.current)return
      if(!payload)throw Error('Aucun QR lisible dans cette image. Essayez une image plus nette.')
      await accept(payload)
    }catch(message){if(mounted.current&&version===imageVersion.current)setError(message.message||'Image illisible.')}finally{image?.close?.();if(url)URL.revokeObjectURL(url)}
  }
  return <section className="qr-scanner" aria-label="Scanner un code QR">
    <video ref={video} autoPlay muted playsInline aria-label="Aperçu de la caméra"/>
    <header className="qr-scanner-header"><button aria-label="Fermer le scanner" onClick={onClose}><FiX/></button><h1>Scannez le code QR</h1><button aria-label="Importer un QR depuis une image" onClick={()=>fileInput.current.click()}><FiImage/></button><button aria-label="Allumer la lampe" aria-pressed={torch} disabled={!canTorch} onClick={light}><FiZap/></button></header>
    <div className="qr-scanner-window" aria-hidden="true"><i/><i/><i/><i/></div>
    <div className="qr-scanner-message" role="status">{error?<><p>{error}</p>{status==='error'&&<button onClick={()=>setRevision(value=>value+1)}>Réessayer la caméra</button>}</>:!visible?<p>Caméra en pause</p>:status==='starting'?<p>Autorisez l’accès à la caméra…</p>:null}</div>
    <input ref={fileInput} type="file" accept="image/*" aria-label="Image du code QR" hidden onChange={importImage}/>
  </section>
}
