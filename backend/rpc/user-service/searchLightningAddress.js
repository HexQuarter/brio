import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import * as z from "zod";
import { USER_TABLE, USER_CONTACT_TABLE } from "../../db.js";

const SearchSchema = z.object({
    contact: z.string()
});

export const handler = async (req, res) => {
    try {
        const parsingResult = SearchSchema.safeParse(req.body)
        if (!parsingResult.success) {
            return res.status(400).json({ error: parsingResult.error })
        }
    
        const {contact} = parsingResult.data
    
        const contactCommand = new GetItemCommand({
            TableName: USER_CONTACT_TABLE,
            Key: {
                contactDigest: { S: contact }
            }
        })
    
        const contactCommandRes = await req.dbClient.send(contactCommand);
        if (!contactCommandRes.Item) {
            return res.status(404).json({ error: "user not found" }) 
        }
    
        const { chatID } = contactCommandRes.Item
    
         const userCommand = new GetItemCommand({
            TableName: USER_TABLE,
            Key: {
                chatID: chatID
            }
        })
        const userCommandRes = await req.dbClient.send(userCommand);
        if (!userCommandRes.Item) {
            console.log(`'cannot retrieve user data for ${chatID}`)
            return res.status(500).json({ error: "user's chat info is missing" }) 
        }
    
        const { breezLnUrl: breezLnUrlData } = userCommandRes.Item
        if (!breezLnUrlData.S) {
            console.log(`'cannot retrieve LN URL for ${chatID}`)
            return res.status(500).json({ error: 'cannot retrieve LN URL' })
        }

        res.status(200).json({ address: breezLnUrlData.S })
    }
    catch(e) {
        console.log(e)
        res.status(500).json({ error: e.message })
    }
}