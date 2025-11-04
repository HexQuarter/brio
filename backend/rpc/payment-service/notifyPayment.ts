import * as z from "zod";
import { getBotToken } from "../../bot/index.js";
import { PaymentServiceStorage } from "./storage.js";
import { UserServiceStorage } from "../user-service/storage.js";
import { Telegraf } from "telegraf";
import { UserFromGetMe } from "@telegraf/types";

const NotifySchema = z.object({
  paymentId: z.string(),
  contactDigest: z.string()
});

export const notifyPaymentHandler = async (req: { body: any, db: PaymentServiceStorage & UserServiceStorage, bot: Telegraf }, res: any) => {
  try {
    const parsingResult = NotifySchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const notifyPaymentRequest = parsingResult.data
    const payment = await req.db.getPayment(notifyPaymentRequest.paymentId)
    if (!payment) {
      return res.status(404).json({ error: "payment not found" })
    }

    const contactData = await req.db.getUserContact(notifyPaymentRequest.contactDigest)
    if (!contactData) {
      return res.status(404).json({ error: "contact not found" })
    }

    const { chatID } = contactData

    const prod = process.env['PROD'] || "true"
    if (prod === "true" && req.bot) {
      const botInfo = await req.bot.telegram.getMe();
      const postResponse = await notifyTelegram(chatID, getBotToken(), payment.id, botInfo)
      if (postResponse.status >= 400) {
        const errMsg = await postResponse.json()
        console.log('Error in posting payment notification: ', errMsg)
        return res.status(500).json({ error: errMsg })
      }
    }

    res.status(200).json({ status: "ok" })
  }
  catch (e) {
    const error = e as Error
    console.error('Notify payment error:', error);
    res.status(500).json({ error: error.message })
  }
}

async function notifyTelegram(chatId: string, botToken: string, payment: string, botInfo: UserFromGetMe) {
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
        ]
      }
    }),
  })
}
