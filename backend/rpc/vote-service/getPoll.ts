import z from 'zod';

import { VoteServiceStorage } from './storage';

const PollSchema = z.object({
  id: z.string()
});

export const getPollHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = PollSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const pollRequest = parsingResult.data
    const poll = await req.db.getPoll(pollRequest.id)
    if (!poll) {
      return res.status(404).json({ error: "poll not exists" })
    }

    const org = await req.db.getOrg(poll.org_id);
    const aggregates = await req.db.getPollAggregates(pollRequest.id);

    res.json({
      poll,
      org,
      aggregates,
    });
  }
  catch (e) {
    const error = e as Error
    console.error('Get poll error:', error);
    res.status(500).json({ error: error.message })
  }
}