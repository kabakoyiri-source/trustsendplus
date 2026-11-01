import React,{useEffect,useId,useMemo,useState} from 'react'
import {FiRefreshCw} from 'react-icons/fi'
import {marketMoney,PERIODS,useMarketChart} from './market'

export default function LiveChart({asset,currency='EUR',range='1Y',onRange,onSummary}) {
  const state=useMarketChart(asset,currency,range),[cursor,setCursor]=useState(null),[candles,setCandles]=useState(false)
  const id=useId().replaceAll(':','')
  useEffect(()=>setCursor(null),[asset.id,range,currency])
  const summary=useMemo(()=>{
    if(state.prices.length<2)return null
    const first=state.prices[0][1],last=state.prices.at(-1)[1]
    return {change:last-first,percent:(last/first-1)*100,first,last,at:state.prices.at(-1)[0]}
  },[state.prices])
  useEffect(()=>{onSummary?.(summary)},[summary,onSummary])
  const up=summary?summary.change>=0:true,color=up?'#128a50':'#ca3037'
  const geometry=useMemo(()=>{
    const rows=state.prices
    if(rows.length<2)return null
    const values=rows.map(p=>p[1]),min=Math.min(...values),max=Math.max(...values),span=max-min||max*.005||1
    const start=rows[0][0],duration=rows.at(-1)[0]-start||1
    const xy=rows.map(([time,value])=>[(time-start)/duration*352+4,18+(max-value)/span*214])
    return {xy,line:xy.map(([x,y],index)=>`${index?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}
  },[state.prices])
  const active=cursor!==null?state.prices[cursor]:null
  function inspect(event) {
    if(!geometry)return
    const rect=event.currentTarget.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))
    setCursor(Math.round(fraction*(state.prices.length-1)))
  }
  return <div className="live-chart-block">
    <div className="live-chart-area">
      {geometry?<>
        {active&&<div className="live-chart-tooltip">{marketMoney(active[1],currency)}<small>{new Date(active[0]).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></div>}
        <svg className="live-price-chart" viewBox="0 0 360 270" preserveAspectRatio="none" role="img" aria-label={`Cours réel ${asset.name}, ${range}`} onPointerMove={inspect} onPointerLeave={()=>setCursor(null)} onPointerDown={inspect}>
          <defs><linearGradient id={`chart-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
          {!candles?<><path d={`${geometry.line} L356,270 L4,270 Z`} fill={`url(#chart-${id})`}/><path d={geometry.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/><circle cx={geometry.xy.at(-1)[0]} cy={geometry.xy.at(-1)[1]} r="3.5" fill={color}/></>:geometry.xy.filter((_,i)=>i%Math.max(1,Math.floor(geometry.xy.length/60))===0).map(([x,y],i,points)=>{const next=points[i+1]||[x,y],green=next[1]<=y;return <g key={x} stroke={green?'#128a50':'#ca3037'}><path d={`M${x},${Math.min(y,next[1])-2}V${Math.max(y,next[1])+2}`}/><path d={`M${x},${y}V${next[1]===y?y+1:next[1]}`} strokeWidth="3"/></g>})}
          {cursor!==null&&<g><path d={`M${geometry.xy[cursor][0]},0V270`} stroke="var(--muted)" strokeDasharray="3 4" opacity=".5"/><circle cx={geometry.xy[cursor][0]} cy={geometry.xy[cursor][1]} r="4" fill={color}/></g>}
        </svg>
      </>:<div className="chart-unavailable" role="status">{state.loading?'Loading chart…':<>Chart unavailable<button onClick={state.retry}><FiRefreshCw/>Retry</button></>}</div>}
    </div>
    <div className="live-periods" aria-label="Chart period"><button className={`chart-style ${candles?'selected':''}`} aria-label={candles?'Afficher la courbe':'Afficher les variations en barres'} onClick={()=>setCandles(v=>!v)}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 2v16M14 1v18M2 6h6v7H2ZM11 4h6v10h-6Z" stroke="currentColor" strokeWidth="1.5"/></svg></button>{Object.keys(PERIODS).map(period=><button key={period} className={range===period?'selected':''} aria-pressed={range===period} onClick={()=>onRange(period)}>{period}</button>)}</div>
    {(state.error||state.data?.stale)&&geometry&&<p className="market-delayed" role="status">Dernières données enregistrées · actualisation indisponible <button onClick={state.retry}>Réessayer</button></p>}
  </div>
}
