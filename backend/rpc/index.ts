import * as z from "zod";

import { createUserHandler } from "./user-service/createUser"
import { searchLightningAddressHandler } from "./user-service/searchLightningAddress"
import { registerPaymentHandler } from "./payment-service/registerPayment"
import { notifyPaymentHandler } from "./payment-service/notifyPayment";
import { fetchPriceHandler } from "./coingecko-service/fetchPrice";
import { botInfoHandler } from "./bot-service/bot-info";
import { createOrgHandler } from "./vote-service/createOrg";
import { createPollHandler } from "./vote-service/createPoll";
import { listActivePollsHandler } from "./vote-service/listActivePolls";
import { listPastPollsHandler } from "./vote-service/listPastPolls";
import { getPollHandler } from "./vote-service/getPoll";
import { registerVoteHandler } from "./vote-service/registerVote";
import { checkVoteHandler } from "./vote-service/checkVote";
import { listChatIdOrgsHandler } from "./vote-service/listChatIdOrg";
import { listOrgPollsHandler } from "./vote-service/listOrgPolls";

const OperationSchema = z.object({
  operation: z.string(),
  payload: z.any().optional(),
});

const handlers: { [key: string]: any } = {
  "bot-info": botInfoHandler,
  "create-user": createUserHandler,
  "search-lightning-address": searchLightningAddressHandler,
  "register-payment": registerPaymentHandler,
  "notify-payment": notifyPaymentHandler,
  "fetch-price": fetchPriceHandler,
  "create-org": createOrgHandler,
  "list-my-orgs": listChatIdOrgsHandler,
  "create-poll": createPollHandler,
  "list-active-polls": listActivePollsHandler,
  "list-past-polls": listPastPollsHandler,
  "get-poll": getPollHandler,
  "register-vote": registerVoteHandler,
  "check-vote": checkVoteHandler,
  'list-org-polls': listOrgPollsHandler
}

export const rpcHandler = async (req: any, res: any) => {
  const parsingResult = OperationSchema.safeParse(req.body)
  if (!parsingResult.success) {
    return res.status(400).json({ error: parsingResult.error })
  }

  const { operation, payload } = parsingResult.data
  const handler = handlers[operation]

  if (!handler) {
    return res.status(400).json({ error: `invalid operation: ${operation}` })
  }

  try {
    if (payload) {
      req.body = payload
    }
    await handler(req, res)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal server error' })
  }
}
