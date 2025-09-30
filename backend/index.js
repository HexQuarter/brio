import 'dotenv/config'

import express from 'express'
import { Level } from 'level'
import https from 'https';
import fs from 'fs';
import cors from 'cors'

import { rpcHandler } from './rpc.js'
import { startBot, getBotToken } from './bot/index.js'


const db = new Level('db', { valueEncoding: 'json' })

const app = express()
    .use(express.json())
    .use(cors({
        //origin: 'https://master.d1rq177b3hizoj.amplifyapp.com'
    }))
    .use((req, res, next) => {
        req.db = db
        next()
    })

const port = process.env.PORT || 443;

// Load SSL certs
const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PEM),
  cert: fs.readFileSync(process.env.SSL_CERT_PEM)
};

app.post('/rpc', rpcHandler)


app.get('/', (req, res) => res.send('ok'))
// Create HTTPS server
https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
  console.log(`HTTPS server running on port ${port}`);
  startBot(getBotToken());
});
