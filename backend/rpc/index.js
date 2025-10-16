import * as z from "zod";
import { createUserHandler, searchLightningAddressHandler } from "./user-service/index.js"
import {registerPaymentHandler } from "./payment-service/index.js"
import { fetchPriceHandler } from "./coingecko-service/index.js";

const OperationSchema = z.object({
    operation: z.string(),
    payload: z.any(),
});

const handlers = {
    "create-user": createUserHandler,
    "search-lightning-address": searchLightningAddressHandler,
    "register-payment": registerPaymentHandler,
    "fetch-price": fetchPriceHandler
}

export const rpcHandler = async (req, res) => {
    const parsingResult = OperationSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(400).json({ error: parsingResult.error })
    }

    const {operation, payload} = parsingResult.data
    const handler = handlers[operation]

    if (!handler) {
        return res.status(400).json({ error: `invalid operation: ${operation}` })
    }

    try {
        req.body = payload
        await handler(req, res)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'internal server error' })
    }
}
