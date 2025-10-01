import * as z from "zod";

const SearchSchema = z.object({
    handle: z.string()
});
export const handler = async (req, res) => {
    const parsingResult = SearchSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(403).json({ error: parsingResult.error })
    }

    const {handle} = parsingResult.data
    const info = await searchByHash(req.db, handle)
    if (!info) {
        return res.status(404).json({ error: "user not found" })
    }

    res.status(200).json({ user: info })
}

async function searchByAddress(db, address) {
    try {
        return await db.get(`p:${address}`)
    }
    catch(e) {
        return null
    }
}

async function searchByHash(db, hash) {
    try {
        const address = await db.get(`h:${hash}`)
        return await searchByAddress(db, address)
    }
    catch(e) {
        return null
    }
}
