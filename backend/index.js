import 'dotenv/config'

import express from 'express'
import https from 'https';
import fs from 'fs';
import cors from 'cors'

import { rpcHandler } from './rpc/index.js'
import { startBot, getBotToken } from './bot/index.js'

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});

const app = express()
    .use(express.json())
    .use(cors({
        //origin: 'https://master.d1rq177b3hizoj.amplifyapp.com'
    }))
    .use((req, res, next) => {
        req.dbClient = client
        next()
    })

app.post('/rpc', rpcHandler)

app.get('/', (req, res) => res.send('ok'))

const prod = process.env['PROD'] || true
if (prod === true) {
    // Load SSL certs
    const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PEM),
        cert: fs.readFileSync(process.env.SSL_CERT_PEM)
    };

    const port = process.env.PORT || 443

    // Create HTTPS server
    https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
        console.log(`HTTPS server running on port ${port}`);
        startBot(getBotToken());
    });
}
else {
    const port = process.env.PORT || 3000
    app.listen(port, () => {
        console.log(`HTTP server running on port ${port}`);
    })
}
