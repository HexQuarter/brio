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
    const { id } = JSON.parse(params.get('user') as string)

    const orgs = await req.db.listOrgByChatId(id)
    res.status(200).json(orgs);
  }
  catch (e) {
    const error = e as Error
    console.error('List orgs per chat ID error:', error);
    res.status(500).json({ error: error.message })
  }
}