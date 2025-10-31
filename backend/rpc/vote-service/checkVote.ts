import z from 'zod';

import { VoteServiceStorage } from './storage';
import { verifyTelegramAuth } from "../utils";
import { getBotId } from '../../bot/index';
import { createVoterHash } from './registerVote'

const CheckVoteSchema = z.object({
  poll_id: z.number(),
  tgInitData: z.string()
});

export const checkVoteHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = CheckVoteSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const checkVoteData = parsingResult.data

    const prod = process.env["PROD"] || "true"
    if (prod === "true") {
      if (!verifyTelegramAuth(checkVoteData.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    const params = new URLSearchParams(checkVoteData.tgInitData);
    const user = JSON.parse(params.get('user') as string)

    const poll = await req.db.getPoll(checkVoteData.poll_id)
    if (!poll) {
      return res.status(404).json({ error: "poll not exists" })
    }

    const voterHash = createVoterHash(user.id, poll.id, poll.hash_salt)
    const alreadyVoted = await req.db.hasVoted(poll.id, voterHash)
    res.json({ canVote: !alreadyVoted })
  }
  catch (e) {
    const error = e as Error
    console.error('Check vote error:', error);
    res.status(500).json({ error: error.message })
  }
}