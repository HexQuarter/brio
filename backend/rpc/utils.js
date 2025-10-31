import nacl from "tweetnacl"

export function verifyTelegramAuth(initData, botId) {
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

function base64UrlDecode(input) {
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
}
