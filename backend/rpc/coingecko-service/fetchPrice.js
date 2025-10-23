
import * as z from "zod";
import Coingecko from '@coingecko/coingecko-typescript';

const client = new Coingecko({
    // proAPIKey: process.env['COINGECKO_PRO_API_KEY'],
    demoAPIKey: process.env['COINGECKO_DEMO_API_KEY'], 
    environment: 'demo'
});

const PriceSchema = z.object({
    currency: z.string().nonempty(),
});

export const handler = async (req, res) => {
    try {
        const parsingResult = PriceSchema.safeParse(req.body)
        if (!parsingResult.success) {
            return res.status(400).json({ error: parsingResult.error })
        }

        const {currency} = parsingResult.data
        const price = await client.simple.price.get({ vs_currencies: currency, ids: 'bitcoin' })
        const btcPrice = price.bitcoin
        if (btcPrice[currency]) {
            return res.json({ price: btcPrice[currency] })
        }
        return res.status(400).json({ error: "currency not available" })
    }
    catch(e) {
        console.log(e)
        res.status(500).json({ error: e.message })
    }
}