// Demo holdings use saved prices; market browsing and watch wallets keep live quotes.
export function portfolioQuotes(assets,wallet,currency) {
  if(!wallet.valuation)return assets
  const rate=wallet.valuation.rates[currency]
  return assets.map(asset=>{
    const base=wallet.valuation.pricesEur[asset.id]
    const price=Number.isFinite(base)&&Number.isFinite(rate)?base*rate:null
    return {...asset,price,change:0,market:{...asset.market,price,change24h:0,priceChange24h:0}}
  })
}
