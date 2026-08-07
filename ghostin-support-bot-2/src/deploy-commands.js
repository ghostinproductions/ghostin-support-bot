const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

if (!config.token || !config.clientId) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in your .env file. See .env.example.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s)...`);
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      console.log('✅ Deployed guild commands (available instantly in that server).');
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('✅ Deployed global commands (can take up to ~1 hour to appear everywhere).');
    }
  } catch (err) {
    console.error('Failed to deploy commands:', err);
  }
})();
