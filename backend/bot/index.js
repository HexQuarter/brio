import { Telegraf } from 'telegraf';

export const getBotToken = () => process.env['BOT_TOKEN']

export const getBotId = () => {
  const token = getBotToken()
  return token.split(':')[0]
}

export const startBot = (token) => {
  const bot = new Telegraf(token);

  bot.start(onStart);
  bot.on('message', onMessage)

  bot.launch();

  console.log("Telegram bot started")
}

const onStart = (ctx) => {
  // userID =. ctx.chat.id
  ctx.reply("Welcome to Brio! You can enjoy Bitcoin securely to anyone in the telegram community. To get started click on `Launch Brio`");
}

const onMessage = (ctx) => {
    console.log("RAW MSG:", JSON.stringify(ctx, null, 2));
}