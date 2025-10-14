import * as z from "zod";
import { getBotToken } from "../../bot/index.js";
import { USER_CONTACT_TABLE } from "../../db.js";

const RegisterSchema = z.object({
    contact: z.string(),
    payment: z.string()
});

export const handler = async (req, res) => {
    try {
        const parsingResult = RegisterSchema.safeParse(req.body)
        if (!parsingResult.success) {
            return res.status(400).json({ error: parsingResult.error })
        }

        const registerPaymentRequest = parsingResult.data

        const contactCommand = new GetItemCommand({
            TableName: USER_CONTACT_TABLE,
            Key: {
                contactDigest: { S: contact }
            }
        })
    
        const contactCommandRes = await req.dbClient.send(contactCommand);
        if (!contactCommandRes.Item) {
            return res.status(404).json({ error: "contact not found" }) 
        }
    
        const { chatID: { S: chatID } } = contactCommandRes.Item
        const postResponse = await notifyTelegram(chatID, getBotToken(), registerPaymentRequest.payment)
        if (postResponse.status >= 400) {
            const errMsg = await postResponse.json()
            console.log('Error in posting payment notification: ', errMsg)
            return res.status(500).json({ error: errMsg })
        }
        return res.status(201).json({ status: "ok" })
    }
    catch(e) {
        console.log(e)
        res.status(500).json({ error: e.message })
    }
}

async function notifyTelegram(chatId, botToken, payment) {
    const startParam = new URLSearchParams()
    startParam.append('payment', payment)
    const encodedStartParam = encodeURIComponent(startParam.toString())
    const miniappLink = `https://t.me/brio_dev_bot?startapp=${encodedStartParam}`;
    return await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        chat_id: chatId,
        text: `⚡ You just received a payment`,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Check it out", url: miniappLink }
                ]
            ]}
        }),
    })
}
