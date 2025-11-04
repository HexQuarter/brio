import z from 'zod';

const OrgSchema = z.object({
  name: z.string(),
  purpose: z.string().optional(),
  scope_level: z.enum(['countries', 'region', 'continent', 'world', 'city', 'community']),
  geographic_scope: z.string(),
  logo_url: z.string().optional(),
  id_verification_required: z.boolean().default(false),
  telegram_handle: z.string().optional(),
  tgInitData: z.string()
});

import { verifyTelegramAuth } from "../utils";
import { getBotId } from '../../bot/index';
import { VoteServiceStorage } from './storage';

export const createOrgHandler = async (req: { body: any, db: VoteServiceStorage }, res: any) => {
  try {
    const parsingResult = OrgSchema.safeParse(req.body)
    if (!parsingResult.success) {
      return res.status(400).json({ error: parsingResult.error })
    }

    const orgData = parsingResult.data;

    const prod = process.env["PROD"] || "true"
    if (prod === "true") {
      if (!verifyTelegramAuth(orgData.tgInitData, getBotId())) {
        return res.status(401).json({ message: "invalid Telegram InitData" })
      }
    }

    const params = new URLSearchParams(orgData.tgInitData);
    const { id } = JSON.parse(params.get('user') as string)

    const orgId = await req.db.createOrg({
      name: orgData.name,
      purpose: orgData.purpose,
      scope_level: orgData.scope_level,
      geographic_scope: orgData.geographic_scope,
      logo_url: orgData.logo_url,
      chat_id: id,
      telegram_handle: orgData.telegram_handle,
      id_verification_required: orgData.id_verification_required
    })

    const org = await req.db.getOrg(orgId)
    res.status(201).json(org);
  }
  catch (e) {
    const error = e as Error
    console.error('Create org error:', error);
    res.status(500).json({ error: error.message })
  }
}