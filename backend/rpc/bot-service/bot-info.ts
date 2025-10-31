import { Telegraf } from "telegraf";

export const botInfoHandler = async (req: { bot: Telegraf }, res: any) => {
  try {
    if (req.bot === null) {
      return res.status(503).json({ error: "bot not initialized" })
    }

    const botInfo = await req.bot.telegram.getMe();
    res.json(botInfo)
  }
  catch (e) {
    const error = e as Error
    console.error('Fetch bot info error:', error);
    res.status(500).json({ error: error.message })
  }
}