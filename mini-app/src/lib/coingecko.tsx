import axios from 'axios'

export const fetchBtcPrice = async (currency = "usd") => {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=bitcoin`, {
        headers: {
            'x-cg-demo-api-key': import.meta.env.VITE_COINGECKO_API_KEY
        }
    })
    const bitcoinData = response.data.find((coinInfo : any) => coinInfo.id == 'bitcoin')
    if (bitcoinData) {
        return bitcoinData.current_price
    }
}