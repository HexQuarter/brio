import { Context, Telegraf } from 'telegraf';
import axios from 'axios'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({})
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID

export const getBotToken = () => {
  const token = process.env['BOT_TOKEN']
  if (!token) {
    throw new Error("Bot token is not defined")
  }
  return token
}

export const getBotId = () => {
  const token = getBotToken()
  return token.split(':')[0]
}

// Track users waiting for support replies
const waitingForSupport = new Map()

export const startBot = async (token: string) => {
  const bot = new Telegraf(token);

  bot.start((ctx: Context) => onStart(ctx));

  bot.telegram.setMyCommands([
    {
      command: 'open',
      description: 'Open Brio app'
    },
    {
    command: 'support',
      description: 'Report a problem from Brio'
    }
  ])

  bot.command('open', onStart)

  bot.command('support', async (ctx: any) => {
    await ctx.reply(`Please describe the issue you’re facing. Include any steps to reproduce or screenshot if possible. Our team will review it and get back to you shortly.`)
    waitingForSupport.set(ctx.from.id, true)
  })

  bot.on('message', onMessage)

  bot.launch();

  console.log("Telegram bot started")

  return bot
}

const onStart = async(ctx: any) => {
  const chatId = ctx.chat.id;
  const username = ctx.botInfo.username;
  const startParam = new URLSearchParams()
  startParam.append('chat_id', chatId)
  const encodedStartParam = encodeURIComponent(startParam.toString())
  const link = `https://t.me/${username}?startapp=${encodedStartParam}`;

  await ctx.reply(
    '🚀 Welcome to Brio! You can enjoy Bitcoin securely to anyone in the telegram community. To get started click on `Launch Brio',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Launch Brio', url: link }
          ]
        ]
      }
    }
  )
}

const onMessage = async (ctx: any) => {
  if (ctx.update.message.contact) {
    await ctx.deleteMessage()
  }

  else if (waitingForSupport.has(ctx.from.id)) {
    const message = ctx.message
    const user = ctx.from.username || ctx.from.first_name

    if (message.photo) {
      const photos = message.photo
      const latestPhoto = photos[photos.length - 1]
      const file = await ctx.telegram.getFile(latestPhoto.file_id)
      const fileUrl = `https://api.telegram.org/file/bot${getBotToken()}/${file.file_path}`
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })
      const command = new PutObjectCommand({
        Bucket: 'brio-support-attachments',
        Key: latestPhoto.file_id,
        Body: response.data,
        ContentType: 'image/jpeg'
      });
      await client.send(command);
    }

    // handle the message (save, send to admin, etc.)
    console.log(`Support issue from ${user}: ${JSON.stringify(message)}`)
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, `🆘 BRIO: New support request from @${ctx.from.username || ctx.from.first_name}:\n\n${JSON.stringify(message)}`)

    await ctx.reply('✅ Thanks, your issue has been reported.')
    waitingForSupport.delete(ctx.from.id)
  }
  else {
    console.log("RAW MSG:", ctx);
  }
}

