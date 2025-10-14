import { Telegraf } from 'telegraf';

export const getBotToken = () => process.env['BOT_TOKEN']

export const getBotId = () => {
  const token = getBotToken()
  return token.split(':')[0]
}

export const startBot = (token, db) => {
  const bot = new Telegraf(token);

  bot.start((ctx) => onStart(ctx, db));
  bot.on('message', onMessage)

  bot.launch();

  console.log("Telegram bot started")
}

const onStart = (ctx, db) => {
  ctx.reply("Welcome to Brio! You can enjoy Bitcoin securely to anyone in the telegram community. To get started click on `Launch Brio`");
}

const onMessage = async (ctx) => {
    const chatId = ctx.update.message.chat.id
    const msgId = ctx.update.message.message_id
    console.log(`ChatID; ${chatId} MsgID; ${msgId}`)
    await ctx.deleteMessage(chatId, msgId)
    console.log("RAW MSG:", ctx);
}
