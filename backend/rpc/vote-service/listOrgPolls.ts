import z from 'zod';

import { VoteServiceStorage } from './storage';

const ListPollSchema = z.object({
  org_id: z.string()
});

export const listOrgPollsHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = ListPollSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const polls = await req.db.listOrgPolls(parsingResult.data.org_id)
    res.json(polls)
  }
  catch (e) {
    const error = e as Error
    console.error('List last polls error:', error);
    res.status(500).json({ error: error.message })
  }
}