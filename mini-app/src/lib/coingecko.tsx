import axios from 'axios'

const REFRESH_CACHED_PRICE = 5000 // 5 sec

export const fetchBtcPrice = async (currency = "usd") => {
    const lastFetchPrice = sessionStorage.getItem('LAST_BITCOIN_PRICE') ? parseInt(sessionStorage.getItem('LAST_BITCOIN_PRICE') as string) : 0
    const lastFetchDate = parseInt(sessionStorage.getItem('LAST_BITCOIN_PRICE_DATE') || '0')
    if (lastFetchDate == 0 || Date.now() - lastFetchDate > REFRESH_CACHED_PRICE) {
        try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=bitcoin`, {
                headers: {
                    'x-cg-demo-api-key': import.meta.env.VITE_COINGECKO_API_KEY
                }
            })
            const bitcoinData = response.data.find((coinInfo : any) => coinInfo.id == 'bitcoin')
            if (bitcoinData) {
                sessionStorage.setItem('LAST_BITCOIN_PRICE_DATE', Date.now().toString())
                sessionStorage.setItem('LAST_BITCOIN_PRICE',  bitcoinData.current_price)
                return bitcoinData.current_price as number
            }
        }
        catch(e) {
            return lastFetchPrice
        }
    }

    return lastFetchPrice
}