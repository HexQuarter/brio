import * as z from "zod";
import { PaymentServiceStorage } from "./storage.js";
import { UserServiceStorage } from "../user-service/storage";
import { Telegraf } from "telegraf";
import { UserFromGetMe } from "@telegraf/types";

const RegisterSchema = z.object({
  method: z.string(),
  amount: z.number(),
  paymentId: z.string()
});

export const registerPaymentHandler = async (req: { body: any, db: PaymentServiceStorage & UserServiceStorage, bot: Telegraf }, res: any) => {
  try {
    const parsingResult = RegisterSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const registerPaymentRequest = parsingResult.data

    await req.db.createPayment({
      id: registerPaymentRequest.paymentId,
      amount: registerPaymentRequest.amount,
      method: registerPaymentRequest.method
    })

    res.status(200).json({ status: "ok" })
  }
  catch (e) {
    const error = e as Error
    console.error('Register payment error:', error);
    res.status(500).json({ error: error.message })
  }
}