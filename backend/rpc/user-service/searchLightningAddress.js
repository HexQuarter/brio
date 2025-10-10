import * as z from "zod";

const SearchSchema = z.object({
    handle: z.string()
});
export const handler = async (req, res) => {
    const parsingResult = SearchSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(400).json({ error: parsingResult.error })
    }

    const {handle} = parsingResult.data
    const lnURL = await req.db.get(`h:${hashHandle}`)
    if (!lnURL) {
        return res.status(404).json({ error: "user not found" })
    }

    res.status(200).json({ address: lnURL })
}