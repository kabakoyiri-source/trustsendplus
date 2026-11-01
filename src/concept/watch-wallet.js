import {useCallback,useEffect,useRef,useState} from 'react'
import NETWORKS from './watch-networks.json'

const keyFor=watch=>watch?`${watch.network}:${watch.address}`:''
function saved(wallet){let value;try{value=JSON.parse(localStorage.getItem('trust-watch-v1:'+keyFor(wallet.watch)))||wallet.watchSnapshot}catch{value=wallet.watchSnapshot}return value?{...value,stale:value.stale||Date.now()-value.fetchedAt>(wallet.watch?.network==='bsc'?300000:120000)}:null}
function store(watch,snapshot){try{localStorage.setItem('trust-watch-v1:'+keyFor(watch),JSON.stringify(snapshot))}catch{}}
export async function fetchWatch(network,address,{cursor,type='snapshot'}={}){
  const response=await fetch('/api/watch?'+new URLSearchParams({network,address,type,...(cursor?{cursor}:{})}),{cache:'no-store',signal:AbortSignal.timeout(type==='history'?90000:60000)})
  const body=await response.json();if(!response.ok)throw Error(body.error||'Consultation blockchain indisponible.')
  if(!body.address||body.network!==network||type==='snapshot'&&!Array.isArray(body.holdings)||type==='history'&&!Array.isArray(body.history?.items))throw Error('Réponse blockchain invalide.')
  return body
}
export function useWatchWallet(wallet,enabled){
  const key=wallet.type==='watch'?keyFor(wallet.watch):'',current=useRef(key);current.current=key
  const [state,setState]=useState(()=>({key,data:key?saved(wallet):null,loading:false,error:'',historyLoading:false})),[revision,setRevision]=useState(0)
  useEffect(()=>{if(!key||!enabled)return;let canceled=false;const old=saved(wallet);setState({key,data:old,loading:!old,error:'',historyLoading:false});const update=()=>fetchWatch(wallet.watch.network,wallet.watch.address).then(data=>{if(canceled)return;store(wallet.watch,data);setState({key,data,loading:false,error:'',historyLoading:false})}).catch(error=>{if(!canceled)setState(previous=>({...previous,loading:false,error:error.message,data:previous.data?{...previous.data,stale:true}:null}))});update();const interval=setInterval(()=>{if(document.visibilityState!=='hidden')update()},wallet.watch.network==='bsc'?300000:90000);return()=>{canceled=true;clearInterval(interval)}},[key,enabled,revision])
  const active=state.key===key?state:{key,data:key?saved(wallet):null,loading:Boolean(key&&enabled),error:'',historyLoading:false}
  const loadHistory=useCallback(async()=>{if(!key||active.historyLoading)return;const cursor=active.data?.history?.nextCursor;setState(previous=>({...previous,historyLoading:true,historyError:''}));try{const result=await fetchWatch(wallet.watch.network,wallet.watch.address,{type:'history',cursor});if(current.current!==key)return;setState(previous=>{if(previous.key!==key)return previous;const history={...result.history,needsLoad:false,items:[...new Map([...(cursor?previous.data?.history?.items||[]:[]),...result.history.items].map(item=>[item.id,item])).values()].sort((a,b)=>Date.parse(b.at||0)-Date.parse(a.at||0))},data={...previous.data,history};store(wallet.watch,data);return {...previous,data,historyLoading:false,historyError:history.unavailable?'Historique momentanément indisponible.':''}})}catch(error){if(current.current===key)setState(previous=>({...previous,historyLoading:false,historyError:error.message}))}},[key,active.data?.history?.nextCursor,active.historyLoading])
  return {...active,refresh:()=>setRevision(value=>value+1),loadHistory}
}

export function watchedAssets(snapshot,base,usdBase,currency,watch){
  const network=NETWORKS.find(item=>item.id===watch?.network)
  if(!network)return []
  const ratio=currency==='USD'?1:(base.find(item=>item.id==='usdc')?.price||0)/(usdBase.find(item=>item.id==='usdc')?.price||0)
  const holdings=snapshot?.holdings||[{id:`watch:${network.id}:native`,catalogId:['eth','btc','sol','bnb'].includes(network.native)?network.native:null,native:true,name:network.name,symbol:network.symbol,network:network.name,networkId:network.id,balance:null,color:network.color,remote:true}]
  return holdings.map(holding=>{const catalog=base.find(item=>item.id===holding.catalogId),price=catalog?.price??(Number.isFinite(holding.priceUsd)&&Number.isFinite(ratio)&&ratio>0?holding.priceUsd*ratio:null),change=catalog?.market?.change24h??holding.change24h,changeAmount=Number.isFinite(price)&&Number.isFinite(change)&&change>-100?price-price/(1+change/100):null;return {...holding,balanceUnknown:!Number.isFinite(holding.balance),price,change:change??0,cap:catalog?.cap||'—',dataSource:snapshot?.source,market:{...catalog?.market,price,change24h:change??null,priceChange24h:changeAmount,updatedAt:snapshot?.fetchedAt?new Date(snapshot.fetchedAt).toISOString():null}}}).sort((a,b)=>Number(b.native)-Number(a.native)||(b.balance*b.price||0)-(a.balance*a.price||0))
}
