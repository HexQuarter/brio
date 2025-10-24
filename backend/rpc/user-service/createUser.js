import * as z from "zod";
import { createHash } from "crypto"
import nacl from "tweetnacl";
import { getBotToken, getBotId } from "../../bot/index.js";
import { BatchWriteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

import { USER_TABLE, USER_CONTACT_TABLE } from "../../db.js";

const CreateSchema = z.object({
    tapRootAddress: z.string(),
    publicKey: z.string(),
    breezBtcAddress: z.string(),
    breezLnUrl: z.string(),
    tgInitData: z.any(),
    hashedPhoneNumber: z.string().optional()
});

export const handler = async (req, res) => {
    try {
      const parsingResult = CreateSchema.safeParse(req.body)
      if (!parsingResult.success) {
          return res.status(400).json({ error: parsingResult.error })
      }

      const createUserRequest = parsingResult.data

      const prod = process.env["PROD"]
      if (prod === true) {
        if(!verifyTelegramAuth(createUserRequest.tgInitData, getBotId())) {
            return res.status(401).json({ message: "invalid Telegram InitData"})
        }
      }

      const params = new URLSearchParams(createUserRequest.tgInitData);
      const { username, id } = JSON.parse(params.get('user'))
      let hashHandle = undefined
      if (username) {
        hashHandle = createHash('sha256').update(username).digest('hex')
      }

      if (!username && !createUserRequest.hashedPhoneNumber) {
        return res.status(400).json({ error: "missing username or phone number" })
      }

      let userContactsCommands = []
      if (username) {
        userContactsCommands.push({
          PutRequest: {
            Item: {
              contactDigest: { S: hashHandle },
              chatID: { S: id.toString() }
            },
          }
        })
      }

      if (createUserRequest.hashedPhoneNumber) {
        userContactsCommands.push({
          PutRequest: {
            Item: {
              contactDigest: { S: createUserRequest.hashedPhoneNumber },
              chatID: { S: id.toString() }
            },
          }
        })
      }

      const batchCommand = []
      batchCommand[USER_TABLE] = [
        {
          PutRequest: {
            Item: {
              chatID: { S: id.toString() },
              publicKey: { S: createUserRequest.publicKey },
              breezBtcAddress: { S: createUserRequest.breezBtcAddress },
              breezLnUrl: { S: createUserRequest.breezLnUrl },
              tapRootAddress: { S: createUserRequest.tapRootAddress },
              handle: { S: hashHandle || "" },
              phoneNumber: { S: createUserRequest.hashedPhoneNumber }
            },
          }
        }
      ]
      batchCommand[USER_CONTACT_TABLE] = userContactsCommands

      const command = new BatchWriteItemCommand({
        RequestItems: batchCommand
      })

      const response = await req.dbClient.send(command);
      if (!response['$metadata'] || response['$metadata'].httpStatusCode != 200) {
        return res.status(500).json({ error: response })
      }

      const startParam = params.get('start_param')
      if (startParam) {
        const referralChatID = new URLSearchParams(startParam).get('referral')
        if (referralChatID) {

          const command = new GetItemCommand({
            TableName: USER_TABLE,
            Key: {
              chatID: { S: referralChatID.toString() }
            }
          })
          const response = await req.dbClient.send(command);
          if (response.Item) {
            await notifyTelegramReferral(referralChatID, getBotToken(), username)
          }
          else {
            console.log('Referral not working', referralChatID)
          }
        }
      }

      res.status(201).json({ status: "ok" })
    }
    catch(e) {
      console.log(e)
      res.status(500).json({ error: e.message })
    }
}

function base64UrlDecode(input) {
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
}

function verifyTelegramAuth(initData, botId) {
  const params = new URLSearchParams(initData);
  const signature = params.get("signature");
  if (!signature) {
    return false;
  }

  // Remove non-signed fields
  params.delete("hash");
  params.delete("signature");

  // Sort alphabetically by key
  const fields = [...params.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const checkString =
    `${botId}:WebAppData\n` +
    fields.map(([k, v]) => `${k}=${v}`).join("\n");

  // Telegram’s production public key
  const pubKeyHex =
    "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";

  const publicKey = Buffer.from(pubKeyHex, "hex");
  const sig = base64UrlDecode(signature);

  return nacl.sign.detached.verify(
    Buffer.from(checkString),
    new Uint8Array(sig),
    new Uint8Array(publicKey)
  );
}

async function notifyTelegramReferral(chatId, botToken, username) {
    let msg
    if (username) {
      msg = `Your contact @${username} just created a wallet on Brio from your invitation. You can transfer some sats to have fun !.`
    } else {
      msg = `Your contact just created a wallet on Brio from your invitation. You can transfer some sats to have fun !.`
    }
    return await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        chat_id: chatId,
          text: msg
        })
    })
}