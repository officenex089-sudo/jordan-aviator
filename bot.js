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

'use strict';

function registerUpdates(bot, channelLink, config = {}) {
  const fs = require('node:fs');
  const path = require('node:path');
  const admins = new Set(String(config.adminIds ?? process.env.ADMIN_USER_IDS ?? '').split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id)));
  const directory = config.dataDir || process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR;
  const wait = config.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  let subscribers = new Set();
  let storageReady = false;
  let busy = false;
  const now = config.now || Date.now;
  const jobsFile = directory && path.join(directory, 'welcome-updates.json');
  let jobs = {};
  let ticking = false;
  const file = directory && path.join(directory, 'subscribers.json');
  if (file) {
    try {
      fs.mkdirSync(directory, { recursive: true });
      if (fs.existsSync(file)) {
        const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!Array.isArray(saved) || saved.some(id => !/^\d+$/.test(id))) throw new Error('Invalid subscribers file');
        subscribers = new Set(saved.map(String));
      }
      fs.accessSync(directory, fs.constants.W_OK);
      if (fs.existsSync(jobsFile)) {
        jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
        if (!jobs || Array.isArray(jobs) || typeof jobs !== 'object' ||
          Object.entries(jobs).some(([id, job]) => !/^\d+$/.test(id) || !job || !Number.isFinite(job.dueAt) ||
            !['pending', 'sending', 'sent', 'failed'].includes(job.status))) throw new Error('Invalid scheduled updates');
      }
      storageReady = true;
    } catch {
      console.error('Updates storage unavailable. Existing subscriber data was not overwritten.');
    }
  } else {
    console.warn('Updates need a persistent Railway volume. Attach a volume at /data.');
  }
  function save(next) {
    fs.writeFileSync(file + '.tmp', JSON.stringify([...next]), { mode: 0o600 });
    fs.renameSync(file + '.tmp', file);
    subscribers = next;
  }
  function saveJobs(next) {
    fs.writeFileSync(jobsFile + '.tmp', JSON.stringify(next), { mode: 0o600 });
    fs.renameSync(jobsFile + '.tmp', jobsFile);
    jobs = next;
  }
  async function tick() {
    if (!storageReady || ticking || busy) return;
    ticking = true;
    try {
      for (const [id, job] of Object.entries(jobs)) {
        if (job.status !== 'pending' || job.dueAt > now() || !subscribers.has(id)) continue;
        // Persist before sending. A restart during an uncertain delivery must not duplicate it.
        saveJobs({ ...jobs, [id]: { ...job, status: 'sending' } });
        try {
          await bot.sendMessage(id, '🔔 JORDAN AVIATOR ke latest updates ke liye hamara official channel join karein! 👇', {
            disable_notification: false,
            reply_markup: { inline_keyboard: [[{ text: '📢 Join Official Channel', url: channelLink }]] }
          });
          saveJobs({ ...jobs, [id]: { ...job, status: 'sent' } });
          console.log('Automatic 10-minute update sent.');
        } catch (error) {
          const body = error.response && error.response.body;
          if (body && body.error_code === 429) {
            saveJobs({ ...jobs, [id]: { status: 'pending', dueAt: now() + (Number(body.parameters && body.parameters.retry_after) || 2) * 1000 + 1000 } });
            break;
          }
          saveJobs({ ...jobs, [id]: { ...job, status: 'failed' } });
          if (body && body.error_code === 403) {
            const next = new Set(subscribers); next.delete(id); save(next);
          }
          console.warn('Automatic update delivery failed or could not be confirmed.');
        }
        await wait(1100);
      }
    } finally { ticking = false; }
  }
  const reply = (id, text) => bot.sendMessage(id, text).catch(() => {});
  function on(pattern, handler) {
    bot.onText(pattern, (msg, match) => {
      if (msg.chat.type !== 'private') return;
      Promise.resolve().then(() => handler(msg, match)).catch(error => {
        console.error('Updates command failed:', error.code || 'UNKNOWN');
        return reply(msg.chat.id, 'Request complete nahi hui. Please dobara try karein.');
      });
    });
  }
  function subscribe(msg) {
    if (!storageReady) return reply(msg.chat.id, 'Updates setup pending hai. Please baad mein /subscribe bhejein.');
    const next = new Set(subscribers);
    next.add(String(msg.chat.id));
    save(next);
    const id = String(msg.chat.id);
    if (!jobs[id]) saveJobs({ ...jobs, [id]: { dueAt: now() + 10 * 60 * 1000, status: 'pending' } });
    if (/^\/subscribe(?:@\w+)?(?:\s|$)/.test(msg.text || '')) {
      return reply(msg.chat.id, '🔔 Updates ON. Notifications band karne ke liye /stop bhejein.');
    }
  }
  on(/^\/(?:start|subscribe)(?:@\w+)?(?:\s.*)?$/s, subscribe);
  on(/^\/myid(?:@\w+)?\s*$/, msg => reply(msg.chat.id, 'Aapki Telegram user ID: ' + msg.from.id));
  on(/^\/stop(?:@\w+)?\s*$/, msg => {
    if (!storageReady) return reply(msg.chat.id, 'Updates abhi active nahi hain.');
    const next = new Set(subscribers);
    next.delete(String(msg.chat.id));
    save(next);
    // Keep the completed/cancelled marker so repeated /start commands cannot create duplicates.
    const id = String(msg.chat.id);
    if (jobs[id] && jobs[id].status === 'pending') saveJobs({ ...jobs, [id]: { ...jobs[id], status: 'failed' } });
    return reply(msg.chat.id, 'Updates OFF. Dobara shuru karne ke liye /subscribe bhejein.');
  });
  function isAdmin(msg) { return admins.has(String(msg.from.id)); }
  on(/^\/subscribers(?:@\w+)?\s*$/, msg => {
    if (!isAdmin(msg)) return reply(msg.chat.id, 'Ye command sirf configured admin ke liye hai. Apni ID ke liye /myid bhejein.');
    return reply(msg.chat.id, storageReady ? 'Updates subscribers: ' + subscribers.size : 'Persistent storage setup pending. Attach a Railway volume at /data.');
  });
  on(/^\/broadcast(?:@\w+)?(?:\s+([\s\S]+))?\s*$/, async (msg, match) => {
    if (!isAdmin(msg)) return reply(msg.chat.id, 'Ye command sirf configured admin ke liye hai. Apni ID ke liye /myid bhejein.');
    if (!storageReady) return reply(msg.chat.id, 'Broadcast unavailable: persistent storage setup pending.');
    const text = (match[1] || '').trim();
    if (!text || text.length > 4096) return reply(msg.chat.id, 'Use: /broadcast aapka message\nMessage 1–4096 characters ka hona chahiye.');
    if (busy || ticking) return reply(msg.chat.id, 'Updates bheje ja rahe hain. Please kuch der baad try karein.');
    if (!subscribers.size) return reply(msg.chat.id, 'Abhi 0 subscribers hain. Users ko /start ya /subscribe bhejna hoga.');
    busy = true;
    let sent = 0, failed = 0, skipped = 0;
    try {
      await reply(msg.chat.id, 'Broadcast shuru: ' + subscribers.size + ' subscribers.');
      for (const id of [...subscribers]) {
        for (let attempt = 0; attempt < 4; attempt++) {
          if (!subscribers.has(id)) { skipped++; break; }
          try {
            await bot.sendMessage(id, text, {
              disable_notification: false,
              reply_markup: { inline_keyboard: [[{ text: '📢 Join Official Channel', url: channelLink }]] }
            });
            sent++;
            break;
          } catch (error) {
            const body = error.response && error.response.body;
            if (body && body.error_code === 429 && attempt < 3) {
              await wait((Number(body.parameters && body.parameters.retry_after) || 2) * 1000 + 250);
              continue;
            }
            if (body && body.error_code === 403) {
              const next = new Set(subscribers);
              next.delete(id);
              save(next);
            }
            // Do not retry ambiguous network failures: Telegram may already have delivered the message.
            failed++;
            break;
          }
        }
        await wait(1100); // Conservative pacing also avoids per-chat limits.
      }
      await reply(msg.chat.id, 'Broadcast complete.\nSent: ' + sent + '\nFailed/unknown: ' + failed + '\nSkipped: ' + skipped);
    } finally {
      busy = false;
    }
  });
  console.log('Updates module ready. Admin configured: ' + Boolean(admins.size) + '. Storage ready: ' + storageReady);
  let timer;
  if (config.autoTick !== false) {
    timer = setInterval(() => tick().catch(error => console.error('Scheduled update error:', error.code || 'UNKNOWN')), 1000);
    timer.unref();
  }
  return { tick, close: () => clearInterval(timer) };
}

registerUpdates(bot, CHANNEL_LINK);
