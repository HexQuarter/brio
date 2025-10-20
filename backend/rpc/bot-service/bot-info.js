export const handler = async (req, res) => {
    try {
      if (req.bot === null) {
        return res.status(503).json({ error: "bot not initialized" })
      }

      const botInfo = await req.bot.telegram.getMe();
      res.json(botInfo)
    }
    catch (e) {
      console.log(e)
      res.status(500).json({ error: e.message })
    }
}