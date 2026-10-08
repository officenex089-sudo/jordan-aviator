const TelegramBot = require('node-telegram-bot-api');

const TOKEN = "8726969586:AAFeCRMt20YtCW6vCAdKo11Mwv6vGySQ2JI";
const CHANNEL_LINK = "https://t.me/+Q0TN7aLjeIw1OWM1";
const VIP_LINK = "https://t.me/+tu4ddDJD36w2MTI1";

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const text = `Welcome to JORDAN AVIATOR 

This platform is created for educational purposes only.

Get daily market insights, learning-based chart analysis & easy-to-understand trading concepts.
Improve your knowledge step by step with us.

🚀 Learn • Understand • Grow
📚 Educational Content Only – No Financial Advice

Tap the buttons below 👇`
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📢 Join Official Channel", url: CHANNEL_LINK }],
      ]
    }
  };

  bot.sendMessage(chatId, text, options);

  setTimeout(() => {
    bot.sendMessage(chatId,
      "⚠️ Disclaimer:\nWe do NOT provide investment advice.\nAll market analysis is ONLY for educational purposes."
    );
  }, 1000);
});

bot.on('callback_query', (query) => {
  if (query.data === 'joined') {
    bot.sendMessage(query.message.chat.id,
     "✅ Thank you for joining!\n\nYou will now receive daily market insights and educational trading setups for learning purposes only.\n\n📚 This is not financial advice. Always do your own research before trading.\n\nStay tuned and keep learning! 📈"
    );
    bot.answerCallbackQuery(query.id);
  }
});

console.log("Bot is running...");
