import z from 'zod';

import { getBotId } from '../../bot/index';
import { VoteServiceStorage } from './storage';
import { verifyTelegramAuth } from "../utils";

const ListOrgSchema = z.object({
  tgInitData: z.string()
});

export const listChatIdOrgsHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = ListOrgSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const orgData = parsingResult.data;
    const prod = process.env["PROD"] || "true"
    if (prod === "true") {
      if (!verifyTelegramAuth(orgData.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    const params = new URLSearchParams(orgData.tgInitData);
    if (!params.has('start_param')) {
      return res.status(400).json({ error: 'no start_param in tgInitData' }) 
    }
    const startParams = new URLSearchParams(params.get('start_param') as string)
    if (!startParams.has('chat_id')) {
      return res.status(400).json({ error: 'no chat_id in start_param' }) 
    }
    const chatID = new URLSearchParams(startParams).get('chat_id') as string
    const orgs = await req.db.listOrgByChatId(chatID)
    res.status(200).json(orgs);
  }
  catch (e) {
    const error = e as Error
    console.error('List orgs per chat ID error:', error);
    res.status(500).json({ error: error.message })
  }
}