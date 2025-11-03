import z from 'zod';

const PollSchema = z.object({
  org_id: z.string(),
  question: z.string(),
  scope_level: z.enum(['countries', 'region', 'continent', 'world', 'city', 'community']),
  geographic_scope: z.string(),
  start_at: z.number(),
  end_at: z.number(),
  tgInitData: z.string()
});

import { verifyTelegramAuth } from "../utils";
import { getBotId } from '../../bot/index';
import { VoteServiceStorage } from './storage';

export const createPollHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = PollSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const pollData = parsingResult.data;

    const prod = process.env["PROD"] || "true"
    if (prod === "true") {
      if (!verifyTelegramAuth(pollData.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    const params = new URLSearchParams(pollData.tgInitData);
    const { id } = JSON.parse(params.get('user') as string)

    const org = await req.db.getOrg(pollData.org_id)
    if (!org) {
      return res.status(400).json({ message: "invalid org id" })
    }

    if (org.chat_id != id) {
      return res.status(401).json({ message: "only the owner of the organization can create poll" })
    }

    if (pollData.start_at <= 0) {
      return res.status(400).json({ message: "start date must be a valid date" })
    }

    if (pollData.end_at <= 0) {
      return res.status(400).json({ message: "end date must be a valid date" })
    }

    if (pollData.end_at < pollData.start_at) {
      return res.status(400).json({ message: "end date must be after the start date" })
    }

    const pollId = await req.db.createPoll(pollData)

    res.status(201).json({ id: pollId });
  }
  catch (e) {
    const error = e as Error
    console.error('Create poll error:', error);
    res.status(500).json({ error: error.message })
  }
}