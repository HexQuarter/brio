import z from 'zod';
import { createHash } from "crypto"

const VoteSchema = z.object({
  poll_id: z.string(),
  vote: z.enum(['yes', 'no']),
  tgInitData: z.string(),
  age_bracket: z.enum(['<18', '18-24', '25-34', '35-44', '45-54', '55+']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  residence: z.enum(['in-country', 'outside']).optional(),
  verification_method: z.enum(['self_attest', 'sa_id']).optional(),
});

import { VoteServiceStorage } from './storage';
import { verifyTelegramAuth } from '../utils';
import { getBotId } from '../../bot/index';

export const registerVoteHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = VoteSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }
    const voteData = parsingResult.data

    const prod = process.env["PROD"]
    if (prod === "true") {
      if (!verifyTelegramAuth(voteData.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    const params = new URLSearchParams(voteData.tgInitData);
    const user = JSON.parse(params.get('user') as string)

    const poll = await req.db.getPoll(voteData.poll_id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const now = new Date();

    if (now.getTime() < poll.start_at * 1000) {
      return res.status(400).json({ error: 'Poll has not started yet' });
    }

    if (now.getTime() > poll.end_at * 1000) {
      return res.status(400).json({ error: 'Poll has ended' });
    }

    const voterHash = createVoterHash(user.id, voteData.poll_id, poll.hash_salt);
    const hasVoted = await req.db.hasVoted(voteData.poll_id, voterHash);

    if (hasVoted) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    await req.db.recordVote(voteData.poll_id, voterHash);

    req.db.updateAggregates(voteData.poll_id, voteData.vote, {
      age_bracket: voteData.age_bracket,
      gender: voteData.gender,
      residence: voteData.residence,
      verification_method: voteData.verification_method,
    });

    req.db.appendAuditLog(voteData.poll_id, voteData.vote, voterHash, {
      age_bracket: voteData.age_bracket,
      gender: voteData.gender,
      residence: voteData.residence,
      verification_method: voteData.verification_method,
    });

    const updatedAggregates = await req.db.getPollAggregates(voteData.poll_id);

    res.json({
      success: true,
      message: 'Vote recorded',
      aggregates: updatedAggregates,
    });
  } catch (e) {
    const error = e as Error
    console.error('Register vote error:', error);
    res.status(400).json({ error: error.message });
  }
}

export function createVoterHash(userId: number, pollId: string, salt: string): string {
  return createHash('sha256')
    .update(`${userId}-${pollId}-${salt}`)
    .digest('hex');
}