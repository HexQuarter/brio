import * as z from "zod";

const SearchSchema = z.object({
    publicKey: z.string().optional(),
    handle: z.string().optional(),
    number: z.string().optional(),
});
export const handler = async (req, res) => {
    const parsingResult = SearchSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(403).json({ error: parsingResult.error })
    }

    const searchResult = await search(req.db, parsingResult.data)
    if (!searchResult) {
        return res.status(404).json({ error: "user not found" })
    }
    
    res.status(200).json({ user: searchResult })
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