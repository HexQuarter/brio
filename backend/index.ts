import 'dotenv/config'

import express from 'express'
import cors from 'cors'

import { rpcHandler } from './rpc'
import { startBot, getBotToken } from './bot'
import { SQLStorage } from './db/sql'
import { Telegraf } from 'telegraf'
import { startCronClosingPolls } from './cron/closePolls'
import { DynamodbStorage } from './db/dynamodb'
import { VoteServiceStorage } from './rpc/vote-service/storage'
import { UserServiceStorage } from './rpc/user-service/storage'
import { PaymentServiceStorage } from './rpc/payment-service/storage'

type Storage = UserServiceStorage & PaymentServiceStorage & VoteServiceStorage

const main = async () => {
  const db = new DynamodbStorage();

  let bot = null
  const prod = process.env['PROD'] || true
  if (prod === true) {
    bot = await startBot(getBotToken());
  }

  const app = express()
    .use(express.json())
    .use(cors({}))
    .use((req: { db: Storage | null; bot: Telegraf | null }, res: any, next: any) => {
      req.db = db
      req.bot = bot
      next()
    })

  app.post('/rpc', rpcHandler as any)

  app.get('/', (req, res) => res.send('ok'))

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`HTTP server running on port ${port}`);
    startCronClosingPolls(db)
  })
};

main().catch(console.error);
