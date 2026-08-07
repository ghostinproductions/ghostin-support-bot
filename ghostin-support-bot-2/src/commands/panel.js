const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const storage = require('../storage');
const { postPanel } = require('../handlers/ticketFlow');
const { t } = require('../lang');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Post the Ghostin Productions ticket panel in a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel to post the panel in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const config = storage.getGuildConfig(interaction.guild.id);
    if (!config) {
      return interaction.reply({ content: t('en', 'configMissing'), ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    await postPanel(channel);
    await interaction.reply({
      content: t('en', 'panelPosted', { channel: `<#${channel.id}>` }),
      ephemeral: true,
    });
  },
};
