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
  const userId = ctx.chat.id;
  ctx.reply("Welcome to Brio! You can enjoy Bitcoin securely to anyone in the telegram community. To get started click on `Launch Brio`");

  db.put(`conv:${userId}`, true)

	//ctx.replyWithHTML('<a href="https://t.me/brio_dev_bot?startapp=invoiceRequest">Brio</a>')
	// TO SHARE A LINK
	//ctx.replyWithHTML('<a href="https://t.me/brio_dev_bot/brio?startapp">Brio</a>')
}




const onMessage = (ctx) => {
    console.log("RAW MSG:", JSON.stringify(ctx, null, 2));
}
