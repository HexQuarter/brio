import * as z from "zod";
import { createUserHandler, searchUserHandler } from "./user-service/index.js"

const OperationSchema = z.object({
    operation: z.string(),
    payload: z.any(),
});

const handlers = {
    "create-user": createUserHandler,
    "search-user": searchUserHandler,
}

export const rpcHandler = async (req, res) => {
    const parsingResult = OperationSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(403).json({ error: parsingResult.error })
    }

    const handler = handlers[operation]

    if (!handler) {
        return res.status(400).json({ error: `invalid operation: ${operation}` })
    }

    try {
        await handler({ db: req.db, payload })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'internal server error' })
    }
}