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

async function search(db, searchRequest) {
    if (searchRequest.publicKey) {
        return await searchByPublicKey(db, search.publicKey)
    }
    
    const ref = await searchByHash(
        db,
        searchRequest.handle || 
        searchRequest.number)

    if (!ref) {
        return null
    }

    return await searchByPublicKey(db, ref) 
}

async function searchByPublicKey(db, key) {
    try {
        return await db.get(`p:${key}`)
    }
    catch(e) {
        return null
    }
}

async function searchByHash(db, hash) {
    try {
        const key = await db.get(`h:${hash}`)
        return await searchByPublicKey(db, key)
    }
    catch(e) {
        return null
    }
}
