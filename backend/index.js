import 'dotenv/config'

import express from 'express'
import cors from 'cors'

import { rpcHandler } from './rpc/index.js'
import { startBot, getBotToken } from './bot/index.js'

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});

const app = express()
    .use(express.json())
    .use(cors({}))
    .use((req, res, next) => {
        req.dbClient = client
        next()
    })

app.post('/rpc', rpcHandler)

app.get('/', (req, res) => res.send('ok'))

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`HTTP server running on port ${port}`);
    const prod = process.env['PROD'] || true
    if (prod === true) {
        startBot(getBotToken());
    }
})