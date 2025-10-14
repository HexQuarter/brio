import { Telegraf } from 'telegraf';

export const getBotToken = () => process.env['BOT_TOKEN']

export const getBotId = () => {
  const token = getBotToken()
  return token.split(':')[0]
}

export const startBot = (token) => {
  const bot = new Telegraf(token);

  bot.start((ctx) => onStart(ctx));
  bot.on('message', onMessage)

  bot.launch();

  console.log("Telegram bot started")
}

const onStart = (ctx) => {
  ctx.reply("Welcome to Brio! You can enjoy Bitcoin securely to anyone in the telegram community. To get started click on `Launch Brio`");
}

const onMessage = async (ctx) => {
    if (ctx.update.message.contact) {
      await ctx.deleteMessage()
    }
    console.log("RAW MSG:", ctx);
}
