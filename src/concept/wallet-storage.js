import {useCallback,useEffect,useRef,useState} from 'react'
import MAIN_SEED from './main-wallet-seed.json'
import DEFAULT_WATCH from './default-watch-wallet.json'

export const WALLET_KEY='trust-concept-local-v1'
const DEFAULT_MAIN={id:'main',name:'Young client',type:'demo',color:'#f3ca0a',icon:'wallet',balances:{eth:MAIN_SEED.ethUnits},visible:['eth'],receiveAddress:MAIN_SEED.sourceAddress,valuation:MAIN_SEED}
export const INITIAL={wallets:[DEFAULT_MAIN],mainStaticSeeded:true,receiveAddressUpdated:true,defaultWatchAdded:true,defaultWatchRemoved:true,liveUsdPricing:true,active:'main',visible:['usdc','eth'],favorites:['btc','bnb','sol','eth'],history:[],theme:'light',currency:'USD',notifications:true,hide:false,profile:'Alex Morgan',receiveAddresses:{},searchRecents:['usdt'],marketPreferences:{tab:'crypto',kind:'Trending',issuer:'bStocks',network:'All networks'}}

export function migrateWalletData(saved) {
  if(!saved?.wallets?.length)return structuredClone(INITIAL)
  let wallets=saved.wallets.map(wallet=>{
    if(saved.mainStaticSeeded||wallet.id!=='main')return wallet
    const {watch,watchSnapshot,...previous}=wallet
    return {...previous,...structuredClone(DEFAULT_MAIN),name:wallet.name||DEFAULT_MAIN.name,color:wallet.color||DEFAULT_MAIN.color,icon:wallet.icon||DEFAULT_MAIN.icon,previousDemoBalances:wallet.previousDemoBalances||wallet.balances}
  })
  // Remove only the account previously inserted by this app, once. User imports remain.
  if(!saved.defaultWatchRemoved)wallets=wallets.filter(wallet=>wallet.id!==DEFAULT_WATCH.id)
  if(!wallets.length)wallets=structuredClone(INITIAL.wallets)
  const receiveAddresses=saved.receiveAddressUpdated?saved.receiveAddresses:Object.fromEntries(Object.entries(saved.receiveAddresses||{}).map(([key,value])=>[key,/^0xDEMO/i.test(value)?MAIN_SEED.sourceAddress:value]))
  return {...INITIAL,...saved,wallets,receiveAddresses:receiveAddresses||{},active:wallets.some(wallet=>wallet.id===saved.active)?saved.active:wallets[0].id,currency:saved.liveUsdPricing&&['USD','EUR','XOF'].includes(saved.currency)?saved.currency:'USD',mainStaticSeeded:true,receiveAddressUpdated:true,defaultWatchAdded:true,defaultWatchRemoved:true,liveUsdPricing:true}
}

function readData(){try{return migrateWalletData(JSON.parse(localStorage.getItem(WALLET_KEY)))}catch{return structuredClone(INITIAL)}}

export function useWalletData() {
  const [data,setState]=useState(readData),latest=useRef(data)
  const [storageError,setStorageError]=useState(false)
  const persist=useCallback(next=>{try{localStorage.setItem(WALLET_KEY,JSON.stringify(next));setStorageError(false)}catch{setStorageError(true)}},[])
  // Persist before returning from Save, including a rename immediately followed by exit.
  const setData=useCallback(update=>{const next=typeof update==='function'?update(latest.current):update;latest.current=next;persist(next);setState(next)},[persist])
  useEffect(()=>{persist(latest.current)},[persist])
  return [data,setData,storageError]
}
