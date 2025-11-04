import * as z from "zod";
import { UserServiceStorage } from "./storage.js";

const SearchSchema = z.object({
  contact: z.string()
});

export const searchLightningAddressHandler = async (req: { body: any, db: UserServiceStorage }, res: any) => {
  try {
    const parsingResult = SearchSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const { contact } = parsingResult.data

    const contactData = await req.db.getUserContact(contact);
    if (!contactData) {
      return res.status(404).json({ error: "user not found" })
    }

    const { chatID, breezLnUrl } = contactData
    if (!breezLnUrl) {
      console.log(`'cannot retrieve LN URL for ${chatID}`)
      return res.status(500).json({ error: 'cannot retrieve LN URL' })
    }

    res.status(200).json({ address: breezLnUrl })
  }
  catch (e) {
    const error = e as Error
    console.error('Search lightning address error:', error);
    res.status(500).json({ error: error.message })
  }
}