const storage = require('../storage');
const { sendLanguagePromptDM } = require('./ticketFlow');
const { t } = require('../lang');

// Track users we've already greeted this process run, so we don't resend
// the language prompt on every single DM they send us.
const greeted = new Set();

async function handleDirectMessage(message) {
  const userId = message.author.id;

  // If they already have an open ticket somewhere, point them to it instead
  // of starting a new flow.
  const allTickets = storage.getAllTickets();
  const existing = Object.entries(allTickets).find(
    ([, tkt]) => tkt.userId === userId && tkt.status === 'open'
  );

  if (existing) {
    const [channelId] = existing;
    if (!greeted.has(userId)) {
      greeted.add(userId);
      await message.channel.send(
        `${t('en', 'alreadyHaveTicket', { channel: `<#${channelId}>` })}\n` +
          `${t('es', 'alreadyHaveTicket', { channel: `<#${channelId}>` })}`
      );
    }
    return;
  }

  if (greeted.has(userId)) return;
  greeted.add(userId);

  await message.channel.send(`${t('en', 'welcomeDM')}\n${t('es', 'welcomeDM')}`);
  await sendLanguagePromptDM(message.channel);
}

module.exports = { handleDirectMessage };
