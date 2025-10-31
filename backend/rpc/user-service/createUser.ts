import * as z from "zod";
import { createHash } from "crypto"
import { getBotToken, getBotId } from "../../bot/index.js";
import { verifyTelegramAuth } from "../utils.js";
import { UserServiceStorage } from "./storage.js";

const CreateSchema = z.object({
  tapRootAddress: z.string(),
  publicKey: z.string(),
  breezBtcAddress: z.string(),
  breezLnUrl: z.string(),
  tgInitData: z.any(),
  hashedPhoneNumber: z.string().optional()
});

export const createUserHandler = async (req: { body: any, db: UserServiceStorage }, res: any) => {
  try {
    const parsingResult = CreateSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const createUserRequest = parsingResult.data

    const prod = process.env["PROD"]
    if (prod === "true") {
      if (!verifyTelegramAuth(createUserRequest.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    const params = new URLSearchParams(createUserRequest.tgInitData);
    const { username, id } = JSON.parse(params.get('user') as string)
    let hashHandle = undefined
    if (username) {
      hashHandle = createHash('sha256').update(username).digest('hex')
    }

    if (!username && !createUserRequest.hashedPhoneNumber) {
      return res.status(400).json({ error: "missing username or phone number" })
    }

    await req.db.createUser(
      {
        chatID: id.toString(),
        publicKey: createUserRequest.publicKey,
        breezBtcAddress: createUserRequest.breezBtcAddress,
        breezLnUrl: createUserRequest.breezLnUrl,
        tapRootAddress: createUserRequest.tapRootAddress,
        handle: hashHandle || "",
        phoneNumber: createUserRequest.hashedPhoneNumber || ""
      }
    )

    if (username) {
      req.db.addUserContact(hashHandle as string, id.toString())
    }

    if (createUserRequest.hashedPhoneNumber) {
      req.db.addUserContact(createUserRequest.hashedPhoneNumber, id.toString())
    }

    const startParam = params.get('start_param')
    if (startParam) {
      const referralChatID = new URLSearchParams(startParam).get('referral')
      if (referralChatID) {
        await req.db.getUserByChatID(referralChatID.toString()).then(async (user) => {
          if (user) {
            await notifyTelegramReferral(referralChatID.toString(), getBotToken(), username)
          } else {
            console.log('Referral not working', referralChatID)
          }
        })
      }
    }

    res.status(201).json({ status: "ok" })
  }
  catch (e) {
    const error = e as Error
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message })
  }
}

async function notifyTelegramReferral(chatId: string, botToken: string, username: string | undefined) {
  let msg
  if (username) {
    msg = `Your contact @${username} just created a wallet on Brio from your invitation. You can transfer some sats to have fun !.`
  } else {
    msg = `Your contact just created a wallet on Brio from your invitation. You can transfer some sats to have fun !.`
  }
  return await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: msg
    })
  })
}