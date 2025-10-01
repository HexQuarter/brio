export const formatBtcAmount = (amount: number, price?: number) => {
  if (price && price > 0) {
    return new Intl.NumberFormat("en", {maximumFractionDigits: 8, useGrouping: false}).format(amount / price)
  }
  return null
}

export const formatFiatAmount = (amount: number) => new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
  useGrouping: false
}).format(amount)


export const convertSatsToBtc = (amount: number) => amount * 0.00000001

export const convertBtcToSats = (amount: number) => Math.floor(amount / 0.00000001)