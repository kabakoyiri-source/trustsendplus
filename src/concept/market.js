import {useCallback,useEffect,useMemo,useState} from 'react'

const memory=new Map(), pending=new Map()
const MAX_AGE=24*60*60*1000
export const PERIODS={ '15m':{days:1,ms:15*60*1000},'1H':{days:1,ms:60*60*1000},'4H':{days:1,ms:4*60*60*1000},'1D':{days:1,ms:24*60*60*1000},'1W':{days:7,ms:7*24*60*60*1000},'1M':{days:30,ms:30*24*60*60*1000},'1Y':{days:365,ms:365*24*60*60*1000} }
function queryKey(params){return new URLSearchParams(params).toString()}
function saved(key) {
  if(memory.has(key))return memory.get(key)
  try {const value=JSON.parse(localStorage.getItem(`trust-market-v1:${key}`));if(value?.body?.source==='CoinGecko'&&Date.now()-value.at<MAX_AGE){memory.set(key,value);return value}}catch{}
  return null
}
async function request(params,force=false) {
  const key=queryKey(params),old=saved(key),ttl=params.type==='detail'?1800000:60000
  if(!force&&old&&Date.now()-old.at<ttl)return old.body
  if(pending.has(key))return pending.get(key)
  const promise=(async()=>{
    try {
      const response=await fetch(`/api/market?${key}`,{cache:'no-store',signal:AbortSignal.timeout(15000)})
      if(!response.ok)throw Error('Market data unavailable')
      const body=await response.json()
      if(body.source!=='CoinGecko'||(params.type==='markets'&&!body.quotes)||(params.type==='chart'&&!Array.isArray(body.prices)))throw Error('Invalid market data')
      const value={body,at:Date.now()};memory.set(key,value)
      try{localStorage.setItem(`trust-market-v1:${key}`,JSON.stringify(value))}catch{}
      return body
    }finally{pending.delete(key)}
  })()
  pending.set(key,promise)
  return promise
}

export function useMarketResource(params,enabled=true) {
  const key=queryKey(params)
  const [state,setState]=useState(()=>({key,data:saved(key)?.body||null,loading:enabled,error:false}))
  const [revision,setRevision]=useState(0)
  useEffect(()=>{
    if(!enabled)return
    let canceled=false
    const cached=saved(key)?.body||null
    setState({key,data:cached,loading:!cached,error:false})
    const update=()=>request(params,revision>0).then(data=>{if(!canceled)setState({key,data,loading:false,error:false})}).catch(()=>{if(!canceled)setState(previous=>({key,data:previous.key===key?previous.data:cached,loading:false,error:true}))})
    update()
    const interval=setInterval(()=>{if(document.visibilityState!=='hidden')update()},params.type==='detail'?1800000:60000)
    const visible=()=>{if(document.visibilityState!=='hidden')update()}
    document.addEventListener('visibilitychange',visible);window.addEventListener('online',visible)
    return()=>{canceled=true;clearInterval(interval);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',visible)}
  },[key,enabled,revision])
  const retry=useCallback(()=>setRevision(value=>value+1),[])
  return {...(state.key===key?state:{key,data:saved(key)?.body||null,loading:enabled,error:false}),retry}
}

export function useMarketQuotes(base,currency,enabled) {
  const state=useMarketResource({type:'markets',currency:currency.toLowerCase(),catalog:'2'},enabled)
  const assets=useMemo(()=>base.map(asset=>{
    const quote=state.data?.quotes?.[asset.id]
    return {...asset,price:quote?.price??null,change:quote?.change24h??0,cap:quote?.marketCap?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(quote.marketCap):'—',market:quote||null}
  }),[base,state.data])
  return {assets,state}
}

export function useMarketChart(asset,currency,range) {
  const period=PERIODS[range]||PERIODS['1D']
  const state=useMarketResource({type:'chart',asset:asset.id,currency:currency.toLowerCase(),days:String(period.days)})
  const prices=useMemo(()=>{
    const raw=state.data?.prices||[]
    if(!raw.length)return []
    const end=raw.at(-1)[0],start=end-period.ms
    const first=Math.max(0,raw.findIndex(point=>point[0]>=start)-1)
    return raw.slice(first).filter(point=>Array.isArray(point)&&Number.isFinite(point[0])&&Number.isFinite(point[1])&&point[1]>0)
  },[state.data,period.ms])
  return {...state,prices}
}

export function compactNumber(value) {return Number.isFinite(value)?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(value):'--'}
export function marketMoney(value,currency='USD',compact=false) {
  if(!Number.isFinite(value))return '—'
  const sign=currency==='EUR'?'€':currency==='XOF'?'FCFA ':'$'
  return sign+(compact?compactNumber(value):new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:value>0&&value<.01?6:2}).format(value))
}
