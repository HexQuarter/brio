import 'dotenv/config'

import express, { RequestHandler } from 'express'
import cors from 'cors'

import { rpcHandler } from './rpc/index.js'
import { startBot, getBotToken } from './bot/index.js'
import { SQLStorage } from './db.js'
import { Telegraf } from 'telegraf'
import { startCronClosingPolls } from './cron/closePolls.js'

// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const main = async () => {
  const db = new SQLStorage();

  let bot = null
  const prod = process.env['PROD'] || true
  if (prod === true) {
    bot = await startBot(getBotToken());
  }

  const app = express()
    .use(express.json())
    .use(cors({}))
    .use((req: { db: SQLStorage | null; bot: Telegraf | null }, res: any, next: any) => {
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
