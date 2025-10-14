import * as z from "zod";

const SearchSchema = z.object({
    contact: z.string()
});
export const handler = async (req, res) => {
    const parsingResult = SearchSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(400).json({ error: parsingResult.error })
    }

    const {contact} = parsingResult.data
    const chatID = await req.db.get(`h:${contact}`)
    if (!chatID) {
        return res.status(404).json({ error: "user not found" })
    }

    const chatInfo = await req.db.get(`c:${chatID}`)
    if (!chatInfo) {
        return res.status(500).json({ error: 'chat info is missing'})
    }

    res.status(200).json({ address: chatInfo.breezLnUrl })
}