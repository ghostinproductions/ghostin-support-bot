const { SlashCommandBuilder } = require('discord.js');
const storage = require('../storage');
const { sendLanguagePromptInteraction, closeTicket } = require('../handlers/ticketFlow');
const { t } = require('../lang');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage Ghostin Productions support tickets.')
    .addSubcommand((sub) => sub.setName('open').setDescription('Open a new support ticket'))
    .addSubcommand((sub) =>
      sub.setName('close').setDescription('Close the current ticket (staff only)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'open') {
      const config = storage.getGuildConfig(interaction.guild.id);
      if (!config) {
        return interaction.reply({ content: t('en', 'configMissing'), ephemeral: true });
      }
      const existing = storage.findOpenTicketByUser(interaction.user.id, interaction.guild.id);
      if (existing) {
        return interaction.reply({
          content: t('en', 'alreadyHaveTicket', { channel: `<#${existing.channelId}>` }),
          ephemeral: true,
        });
      }
      return sendLanguagePromptInteraction(interaction);
    }

    if (sub === 'close') {
      return closeTicket(interaction);
    }
  },
};
