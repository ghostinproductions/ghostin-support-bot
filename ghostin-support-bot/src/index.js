const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, ChannelType, Events } = require('discord.js');
const config = require('./config');
const { handleInteraction } = require('./handlers/interactionHandler');
const { handleDirectMessage } = require('./handlers/dmHandler');

if (!config.token || !config.clientId) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in your .env file. See .env.example.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  console.log(`Ghostin Productions support bot is online in ${c.guilds.cache.size} server(s).`);
});

client.on(Events.InteractionCreate, (interaction) => handleInteraction(interaction, client));

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (message.channel.type === ChannelType.DM) {
    handleDirectMessage(message, client).catch(console.error);
  }
});

process.on('unhandledRejection', (err) => console.error('Unhandled promise rejection:', err));

client.login(config.token);
