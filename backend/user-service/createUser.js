import * as z from "zod";
import { getBotId } from "../bot/index.js";
import { createHash } from "crypto"
import nacl from "tweetnacl";

const CreateSchema = z.object({
    tapRootAddress: z.string(),
    publicKey: z.string(),
    breezBtcAddress: z.string(),
    breezLnUrl: z.string(),
    tgInitData: z.any()
});

export const handler = async (req, res) => {
    const parsingResult = CreateSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(403).json({ error: parsingResult.error })
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
    const hashHandle = createHash('sha256').update(username).digest('hex')	
    await req.db.put(`p:${createUserRequest.tapRootAddress}`, {
        publicKey: createUserRequest.publicKey,
        breezBtcAddress: createUserRequest.breezBtcAddress,
        breezLnUrl: createUserRequest.breezLnUrl,
        handle: hashHandle
    })

    await req.db.put(`h:${hashHandle}`, createUserRequest.tapRootAddress)
    res.status(201).json({ status: "ok" })
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

