import { VoteServiceStorage } from './storage';

export const listPastPollsHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const polls = await req.db.listPastPolls()
    res.status(200).json(polls);
  }
  catch (e) {
    const error = e as Error
    console.error('List last polls error:', error);
    res.status(500).json({ error: error.message })
  }
}