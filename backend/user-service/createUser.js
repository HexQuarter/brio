import * as z from "zod";
import { createHash, createHmac } from "crypto"
import { getBotToken } from "../bot/index.js";

const CreateSchema = z.object({
    publicKey: z.string(),
    // number: z.string(),
    initData: z.any()
});


export const handler = async (req, res) => {
    const parsingResult = CreateSchema.safeParse(req.body)
    if (!parsingResult.success) {
        return res.status(403).json({ error: parsingResult.error })
    }

    const createUserRequest = parsingResult.data
    // await req.db.put(`p:${createUserRequest.publicKey}`, {
    //     handle: user.handle, 
    //     number: user.number
    // })

    if(!verifyTelegramAuth(createUserRequest.initData)) {
        return res.status(403).json({ message: "invalid Telegram InitData"})
    }

    console.log(createUserRequest.initData)

    // await req.db.put(`h:${createUserRequest.handle}`, publicKey)
    // await req.db.put(`h:${createUserRequest.number}`, publicKey)

    res.status(201).json({ status: "ok" })
}

function verifyTelegramAuth(initData) {
  const secret = createHash("sha256").update(getBotToken()).digest();
  const parsed = new URLSearchParams(initData);
  const hash = parsed.get("hash");
  parsed.delete("hash");

  const checkString = [...parsed.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const hmac = createHmac("sha256", secret).update(checkString).digest("hex");

  if (hmac !== hash) return false
  return true
//   return Object.fromEntries(parsed); // contains user info
}