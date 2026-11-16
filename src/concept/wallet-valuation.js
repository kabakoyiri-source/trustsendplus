// Quantities may be simulated; every valuation uses the current market quote.
export function holdingValue(asset,units) {
  return units===0?0:Number.isFinite(asset.price)&&asset.price>0?units*asset.price:null
}

export function holdingGain(asset,units) {
  return units===0?0:Number.isFinite(asset.price)&&asset.price>0&&Number.isFinite(asset.market?.priceChange24h)?units*asset.market.priceChange24h:null
}

export function portfolioChange(assets,balances) {
  const holdings=assets.filter(asset=>(balances[asset.id]||0)>0)
  if(!holdings.length)return {gain:0,percent:0}
  if(holdings.some(asset=>holdingGain(asset,balances[asset.id])===null))return {gain:null,percent:null}
  const total=holdings.reduce((sum,asset)=>sum+holdingValue(asset,balances[asset.id]),0)
  const gain=holdings.reduce((sum,asset)=>sum+holdingGain(asset,balances[asset.id]),0)
  return {gain,percent:total-gain>0?gain/(total-gain)*100:null}
}
