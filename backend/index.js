import 'dotenv/config'

import express from 'express'
import { Level } from 'level'
import { rpcHandler } from './rpc.js'
import { startBot, getBotToken } from './bot/index.js'


const db = new Level('db', { valueEncoding: 'json' })

const app = express()
    .use(express.json())
    .use((req, res, next) => {
        req.db = db
        next()
    })

const port = process.env['PORT'] || 3000

app.post('/rpc', rpcHandler)

app.listen(port, () => {
    console.log(`Listenning on port ${port}`)
    startBot(getBotToken())
})