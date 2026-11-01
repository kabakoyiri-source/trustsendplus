import React from 'react'

export function WalletGlyph() {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M23 8H10a4 4 0 0 0-4 4v11a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4v-8a4 4 0 0 0-4-4H11" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 18h5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg>
}

export function SlidersGlyph() {
  return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 7h22M3 14h22M3 21h22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><g fill="var(--surface)" stroke="currentColor" strokeWidth="2.4"><circle cx="18" cy="7" r="3"/><circle cx="9" cy="14" r="3"/><circle cx="18" cy="21" r="3"/></g></svg>
}

export function HistoryGlyph() {
  return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 13a10 10 0 1 1 1.3 6.2M2 13h5V8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 7v7l4 2.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export function ScanGlyph() {
  return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M4 9V6a2 2 0 0 1 2-2h4m8 0h4a2 2 0 0 1 2 2v3M4 19v3a2 2 0 0 0 2 2h4m8 0h4a2 2 0 0 0 2-2v-3M3 14h22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export function HomeGlyph() {
  return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="m3 11 7.7-6.3a5.2 5.2 0 0 1 6.6 0L25 11v10a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" fill="currentColor"/><path d="M11 21h6" stroke="var(--bg)" strokeWidth="2.7" strokeLinecap="round"/></svg>
}

export function InfinityGlyph() {
  return <svg viewBox="0 0 30 28" fill="none" aria-hidden="true"><path d="M15 14c-3-4.6-4.6-5.5-7-5.5a5.5 5.5 0 0 0 0 11c2.4 0 4-1.1 7-5.5Zm0 0c3-4.6 4.6-5.5 7-5.5a5.5 5.5 0 0 1 0 11c-2.4 0-4-1.1-7-5.5Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export function SparkleGlyph() {
  return <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true"><path d="M12 3c1.3 8.2 2.8 9.7 11 11-8.2 1.3-9.7 2.8-11 11C10.7 16.8 9.2 15.3 1 14 9.2 12.7 10.7 11.2 12 3Zm10-3c.6 3.8 1.2 4.4 5 5-3.8.6-4.4 1.2-5 5-.6-3.8-1.2-4.4-5-5 3.8-.6 4.4-1.2 5-5Z"/></svg>
}

export function TokenArtwork({id}) {
  // Keep the supplied logo artwork, cropping only its empty outer margin.
  if(id==='btc'||id==='bnb') return <svg viewBox={id==='btc'?'15 11 115 115':'10 11 113 113'} style={{borderRadius:'50%'}} aria-hidden="true"><image href={`/tokens/${id}.png`} width={id==='btc'?145:130} height={id==='btc'?153:131}/></svg>
  if(id==='eth') return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#627eec"/><path d="m20 4-9 16 9 5 9-5Z" fill="#c7d7ff"/><path d="m20 4 9 16-9 5Z" fill="#91acf9"/><path d="m11 22 9 14 9-14-9 5Z" fill="#fff"/><path d="m20 27 9-5-9 14Z" fill="#b4c8ff"/><path d="m11 20 9-4.2 9 4.2-9 5Z" fill="#fff" opacity=".45"/></svg>
  if(id==='usdc') return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#2775ca"/><path d="M13 7a14 14 0 0 0 0 26M27 7a14 14 0 0 1 0 26" fill="none" stroke="#fff" strokeWidth="2.5"/><path d="M25 14c-1-4-11-4-11 1 0 5 12 3 12 9 0 6-12 6-13 0m7-15v23" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round"/></svg>
  if(id==='sol') return <svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="solana-bars" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#55ffc5"/><stop offset=".55" stopColor="#38b8be"/><stop offset="1" stopColor="#9945ff"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="#080414"/><path d="m10 9-4 5h24l4-5ZM6 18l4 5h24l-4-5Zm4 9-4 5h24l4-5Z" fill="url(#solana-bars)"/></svg>
  if(id==='hype') return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#072723"/><path d="M7 20c0-11 9-12 13-4 4-8 13-7 13 4s-9 12-13 4c-4 8-13 7-13-4" fill="#83f5d0"/></svg>
  if(id==='usdt') return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#26a17b"/><path d="M11 10h18v5h-7v16h-4V15h-7Z" fill="#fff"/><ellipse cx="20" cy="19" rx="13" ry="3" fill="none" stroke="#fff" strokeWidth="1.4"/></svg>
  return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#854ce6"/><path d="m18 14-5-3-6 4v7l6 4 14-9 6 4v7l-6 4-5-3M18 14v7m4-2v7" transform="translate(0 -3)" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round"/></svg>
}

export function PerpetualBadge() {
  return <span className="perpetual-badge"><TokenArtwork id="hype"/></span>
}

export function PredictionFlag() {
  return <svg className="prediction-flag" viewBox="0 0 40 40" aria-hidden="true"><defs><clipPath id="flag-corners"><rect width="40" height="40" rx="8"/></clipPath></defs><g clipPath="url(#flag-corners)"><path d="M0 0h40v14H0Z" fill="#e50000"/><path d="M0 14h40v13H0Z" fill="#fff"/><path d="M0 27h40v13H0Z" fill="#209d48"/><path d="M16 18c-5 5 2 9 4 3 2 6 9 2 4-3m-4-2v10m-3-9 3-2 3 2" fill="none" stroke="#db151c" strokeWidth=".8"/><path d="M0 13h40M0 27h40" stroke="#fff" strokeWidth="1.4" strokeDasharray="1 .8"/></g></svg>
}

export function GlobeArtwork() {
  return <svg className="prediction-globe" viewBox="0 0 44 44" aria-hidden="true"><defs><radialGradient id="globe-fill" cx=".3" cy=".2" r=".9"><stop stopColor="#f0f6ff"/><stop offset=".55" stopColor="#a4cdff"/><stop offset="1" stopColor="#4056ef"/></radialGradient></defs><path d="M11 33h23l3 8H8Z" fill="#161749"/><ellipse cx="22" cy="41" rx="15" ry="2" fill="#2525bf"/><circle cx="22" cy="18" r="17" fill="url(#globe-fill)"/><g fill="none" stroke="#769ef2" strokeWidth=".6" opacity=".7"><ellipse cx="22" cy="18" rx="8" ry="17"/><path d="M5 18h34M8 9h28M8 27h28M22 1v34"/></g></svg>
}

export function StockArtwork() {
  return <svg className="stock-artwork" viewBox="0 0 44 44" aria-hidden="true"><g strokeWidth="1"><g transform="rotate(-24 13 13)"><ellipse cx="13" cy="14" rx="11" ry="7" fill="#a68039"/><ellipse cx="13" cy="12" rx="11" ry="7" fill="#f9f0c1" stroke="#c5aa4a"/><text x="13" y="14" fontFamily="Arial,sans-serif" fontSize="5" textAnchor="middle" fill="#282833">Stocks</text></g><g transform="rotate(-18 30 20)"><ellipse cx="30" cy="21" rx="12" ry="6" fill="#a68039"/><ellipse cx="30" cy="19" rx="12" ry="6" fill="#81d9ff" stroke="#e9cf88"/><text x="30" y="21" fontFamily="Arial,sans-serif" fontSize="5" textAnchor="middle" fill="#fff">bStocks</text></g><g transform="rotate(-29 13 30)"><ellipse cx="13" cy="31" rx="11" ry="6" fill="#706333"/><ellipse cx="13" cy="29" rx="11" ry="6" fill="#a1ddff" stroke="#edda8e"/><text x="13" y="31" fontFamily="Arial,sans-serif" fontSize="6" textAnchor="middle" fill="#fff">NVDA</text></g><g transform="rotate(-42 32 33)"><ellipse cx="32" cy="34" rx="9" ry="5" fill="#777"/><ellipse cx="32" cy="32" rx="9" ry="5" fill="#f69f96" stroke="#efcd88"/><text x="32" y="34" fontFamily="Arial,sans-serif" fontSize="5" textAnchor="middle" fill="#fff">TSLA</text></g><ellipse cx="22" cy="5" rx="8" ry="3" transform="rotate(-34 22 5)" fill="#c9ed84" stroke="#c0a65c"/></g></svg>
}
