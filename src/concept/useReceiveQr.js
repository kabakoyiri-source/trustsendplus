import {useEffect,useState} from 'react'
import {receiveNetworkKind,validReceiveAddress} from './receive-address.mjs'
import {receiveQrUrl} from './receive-qr.mjs'

export default function useReceiveQr(asset,address) {
  const kind=receiveNetworkKind(asset),key=`${kind}:${address}`
  const [state,setState]=useState({key:'',src:''})
  useEffect(()=>{
    let canceled=false
    validReceiveAddress(asset,address).then(valid=>{
      if(!canceled)setState({key,src:valid?receiveQrUrl(address):''})
    }).catch(()=>{if(!canceled)setState({key,src:''})})
    return()=>{canceled=true}
  },[key])
  return state.key===key?{...state,loading:false}:{key,src:'',loading:Boolean(address)}
}
