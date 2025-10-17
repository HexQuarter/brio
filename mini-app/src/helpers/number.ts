export const formatBtcAmount = (amount: number) => {
  return new Intl.NumberFormat("en", {maximumFractionDigits: 8, useGrouping: false}).format(amount)
}

export const formatFiatAmount = (amount: number, digit = 3) => new Intl.NumberFormat("en", {
  maximumFractionDigits: digit,
  useGrouping: false
}).format(amount)


export const convertSatsToBtc = (amount: number) => amount * 0.00000001

export const convertBtcToSats = (amount: number) => Math.floor(amount / 0.00000001)