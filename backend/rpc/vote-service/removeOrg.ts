import z from 'zod';

const RemoveOrgSchema = z.object({
  org_id: z.string(),
  tgInitData: z.string()
});

import { verifyTelegramAuth } from "../utils";
import { getBotId } from '../../bot/index';
import { VoteServiceStorage } from './storage';
import { Telegraf } from 'telegraf';

export const removeOrgHandler = async (req: { body: any, db: VoteServiceStorage, bot: Telegraf }, res: any) => {
  try {
    const parsingResult = RemoveOrgSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const removeData = parsingResult.data;

    const org = await req.db.getOrg(removeData.org_id)
    if (!org) {
      return res.status(400).json({ message: "invalid org id" })
    }

    const prod = process.env["PROD"] || "true"
    if (prod === "true") {
      if (!verifyTelegramAuth(removeData.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    let chatID
    const params = new URLSearchParams(removeData.tgInitData);
    const user = JSON.parse(params.get('user') as string)
    chatID = user.id

    if (params.has('start_param')) {
      const startParams = new URLSearchParams(params.get('start_param') as string)
      if (startParams.has('chat_id')) {
        chatID = new URLSearchParams(startParams).get('chat_id') as string
      }
    }

    if (req.bot) {
      const chat = await req.bot.telegram.getChat(chatID)
      if (chat.type == 'private') {
        if (org.chat_id != chatID) {
          return res.status(401).json({ error: "only the owner of the organization can create poll" })
        }
      }
      else {
        const { id: userID } = JSON.parse(params.get('user') as string)
        const admins = await req.bot.telegram.getChatAdministrators(chatID)
        if (!admins.some(a => a.user.id == userID)) {
          return res.status(401).json({ error: "only the owner of the organization can create poll" })
        }
      }
    }

    await req.db.removeOrg(removeData.org_id)
    res.json({ success: true })
  }
  catch (e) {
    const error = e as Error
    console.error('Create org error:', error);
    res.status(500).json({ error: error.message })
  }
}