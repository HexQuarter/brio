import * as z from "zod";
import { getBotToken } from "../../bot/index.js";

const RegisterSchema = z.object({
    handle: z.string(),
    payment: z.string()
});

export const handler = async (req, res) => {
    try {
        const parsingResult = RegisterSchema.safeParse(req.body)
        if (!parsingResult.success) {
            return res.status(400).json({ error: parsingResult.error })
        }

        const registerPaymentRequest = parsingResult.data
        const chatID = await req.db.get(`h:${registerPaymentRequest.handle}`)
        if (chatID) {
            const postResponse = await notifyTelegram(chatID, getBotToken(), registerPaymentRequest.payment)
            if (postResponse.status >= 400) {
              return res.status(500).json({ error: await postResponse.json() })
            }
            return res.status(201).json({ status: "ok" })
        }

        return res.status(400).json({ error: "handle not found" })
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
