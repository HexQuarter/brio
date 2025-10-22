import * as z from "zod";
import { getBotToken } from "../../bot/index.js";
import { USER_CONTACT_TABLE, PAYMENT_TABLE } from "../../db.js";
import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const RegisterSchema = z.object({
    contactDigest: z.string().optional(),
    method: z.string(),
    amount: z.number(),
    paymentId: z.string()
});

export const handler = async (req, res) => {
    try {
        const parsingResult = RegisterSchema.safeParse(req.body)
        if (!parsingResult.success) {
            return res.status(400).json({ error: parsingResult.error })
        }

        const registerPaymentRequest = parsingResult.data

        const putCommand = new PutItemCommand({
            TableName: PAYMENT_TABLE,
            Item: {
                paymentId: { S: registerPaymentRequest.paymentId },
                amount: { N: registerPaymentRequest.amount.toString() },
                method: { S: registerPaymentRequest.method }
            }
        })
        const putCommandRes = await req.dbClient.send(putCommand);
        if (!putCommandRes['$metadata'] || putCommandRes['$metadata'].httpStatusCode != 200) {
            return res.status(500).json({ error: putCommandRes })
        }

        if (!registerPaymentRequest.contactDigest) {
            return res.status(201).json({ status: "ok" })
        }

        const contactCommand = new GetItemCommand({
            TableName: USER_CONTACT_TABLE,
            Key: {
                contactDigest: { S: registerPaymentRequest.contactDigest }
            }
        })
    
        const contactCommandRes = await req.dbClient.send(contactCommand);
        if (!contactCommandRes.Item) {
            return res.status(404).json({ error: "contact not found" }) 
        }

        const { chatID: chatID_Data } = contactCommandRes.Item
        if (!chatID_Data.S) {
            console.log(`cannot retrieve chatID for ${registerPaymentRequest.contactDigest}`)
            return res.status(500).json({ error: 'cannot retrieve user contact' })
        }
    
        const prod = process.env['PROD'] || true
        if (prod === true && req.bot) {
            const botInfo = await req.bot.telegram.getMe();
            const postResponse = await notifyTelegram(chatID_Data.S, getBotToken(), registerPaymentRequest.paymentId, botInfo)
            if (postResponse.status >= 400) {
                const errMsg = await postResponse.json()
                console.log('Error in posting payment notification: ', errMsg)
                return res.status(500).json({ error: errMsg })
            }
        }

        res.status(201).json({ status: "ok" })
    }
    catch(e) {
        console.log(e)
        res.status(500).json({ error: e.message })
    }
}

async function notifyTelegram(chatId, botToken, payment, botInfo) {
    const startParam = new URLSearchParams()
    startParam.append('payment', payment)
    const encodedStartParam = encodeURIComponent(startParam.toString())
    const miniappLink = `https://t.me/${botInfo.username}?startapp=${encodedStartParam}`;
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
