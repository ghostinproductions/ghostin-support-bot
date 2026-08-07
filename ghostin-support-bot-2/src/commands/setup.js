const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const storage = require('../storage');
const { postPanel } = require('../handlers/ticketFlow');
const { t } = require('../lang');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the Ghostin Productions support ticket system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('category')
        .setDescription('Category where ticket channels will be created')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addRoleOption((opt) =>
      opt
        .setName('support_role')
        .setDescription('Role that can see and manage tickets')
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName('log_channel')
        .setDescription('Channel where closed ticket transcripts are logged')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((opt) =>
      opt
        .setName('panel_channel')
        .setDescription('Channel to post the "Open a Ticket" panel in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const category = interaction.options.getChannel('category');
    const supportRole = interaction.options.getRole('support_role');
    const logChannel = interaction.options.getChannel('log_channel');
    const panelChannel = interaction.options.getChannel('panel_channel');

    storage.setGuildConfig(interaction.guild.id, {
      categoryId: category.id,
      supportRoleId: supportRole.id,
      logChannelId: logChannel ? logChannel.id : null,
    });

    let msg = t('en', 'setupSuccess');

    if (panelChannel) {
      await postPanel(panelChannel);
      msg += `\n${t('en', 'panelPosted', { channel: `<#${panelChannel.id}>` })}`;
    }

    await interaction.reply({ content: msg, ephemeral: true });
  },
};
