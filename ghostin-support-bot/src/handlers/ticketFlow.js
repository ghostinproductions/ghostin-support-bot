const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  AttachmentBuilder,
} = require('discord.js');
const storage = require('../storage');
const { t } = require('../lang');

const BRAND_COLOR = 0x8b5cf6;

function buildLanguageRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lang_en').setLabel('English').setEmoji('🇬🇧').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('lang_es').setLabel('Español').setEmoji('🇪🇸').setStyle(ButtonStyle.Success)
  );
}

function buildLanguageEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(t('en', 'chooseLanguageTitle'))
    .setDescription(`${t('en', 'chooseLanguageDesc')}\n${t('es', 'chooseLanguageDesc')}`);
}

async function postPanel(channel) {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(t('en', 'panelTitle'))
    .setDescription(`${t('en', 'panelDescription')}\n\n${t('es', 'panelDescription')}`)
    .setFooter({ text: 'Ghostin Productions • 24/7 Support' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('Open a Ticket / Abrir un Ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// Entry point: panel button clicked in-guild
async function handlePanelButton(interaction) {
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
  return interaction.reply({
    embeds: [buildLanguageEmbed()],
    components: [buildLanguageRow()],
    ephemeral: true,
  });
}

// Entry point: /ticket open command
async function sendLanguagePromptInteraction(interaction) {
  return interaction.reply({
    embeds: [buildLanguageEmbed()],
    components: [buildLanguageRow()],
    ephemeral: true,
  });
}

// Entry point: DM message
async function sendLanguagePromptDM(channel) {
  return channel.send({ embeds: [buildLanguageEmbed()], components: [buildLanguageRow()] });
}

function buildModal(lang) {
  const modal = new ModalBuilder().setCustomId(`ticket_modal_${lang}`).setTitle(t(lang, 'modalTitle'));

  const subject = new TextInputBuilder()
    .setCustomId('subject')
    .setLabel(t(lang, 'q1Label'))
    .setPlaceholder(t(lang, 'q1Placeholder'))
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel(t(lang, 'q2Label'))
    .setPlaceholder(t(lang, 'q2Placeholder'))
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  const reference = new TextInputBuilder()
    .setCustomId('reference')
    .setLabel(t(lang, 'q3Label'))
    .setPlaceholder(t(lang, 'q3Placeholder'))
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(50);

  const priority = new TextInputBuilder()
    .setCustomId('priority')
    .setLabel(t(lang, 'q4Label'))
    .setPlaceholder(t(lang, 'q4Placeholder'))
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(10);

  modal.addComponents(
    new ActionRowBuilder().addComponents(subject),
    new ActionRowBuilder().addComponents(reason),
    new ActionRowBuilder().addComponents(reference),
    new ActionRowBuilder().addComponents(priority)
  );

  return modal;
}

async function handleLanguageButton(interaction) {
  const lang = interaction.customId === 'lang_es' ? 'es' : 'en';
  await interaction.showModal(buildModal(lang));
}

// For DM-opened tickets we need to figure out which server to create the
// ticket channel in. We try every guild the bot is in and see which one
// the user is also a member of.
async function resolveHomeGuild(client, userId) {
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.members.fetch(userId);
      const config = storage.getGuildConfig(guild.id);
      if (config) return guild;
    } catch (e) {
      continue;
    }
  }
  return null;
}

function sanitizeName(name) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
  return cleaned || 'user';
}

async function createTicketChannel(guild, user, lang, answers) {
  const config = storage.getGuildConfig(guild.id);
  if (!config) return null;

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
      ],
    },
  ];

  if (config.supportRoleId) {
    overwrites.push({
      id: config.supportRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.ManageMessages,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${sanitizeName(user.username)}`,
    type: ChannelType.GuildText,
    parent: config.categoryId || null,
    permissionOverwrites: overwrites,
  });

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(t(lang, 'ticketSummaryTitle'))
    .addFields(
      { name: t(lang, 'fieldUser'), value: `<@${user.id}>`, inline: true },
      { name: t(lang, 'fieldLanguage'), value: lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English', inline: true },
      { name: t(lang, 'fieldPriority'), value: answers.priority || '—', inline: true },
      { name: t(lang, 'fieldSubject'), value: answers.subject },
      { name: t(lang, 'fieldReason'), value: answers.reason },
      { name: t(lang, 'fieldReference'), value: answers.reference || '—' }
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel(t(lang, 'claimButton')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_close').setLabel(t(lang, 'closeButton')).setStyle(ButtonStyle.Danger)
  );

  const pingContent = config.supportRoleId ? `<@&${config.supportRoleId}>` : '';
  const intro = t(lang, 'ticketChannelIntro', { support: pingContent, user: `<@${user.id}>` }).trim();

  await channel.send({ content: intro, embeds: [embed], components: [row] });

  storage.setTicket(channel.id, {
    userId: user.id,
    guildId: guild.id,
    language: lang,
    answers,
    status: 'open',
    claimedBy: null,
    createdAt: Date.now(),
  });

  return channel;
}

async function handleModalSubmit(interaction, client) {
  const lang = interaction.customId.endsWith('_es') ? 'es' : 'en';
  const answers = {
    subject: interaction.fields.getTextInputValue('subject'),
    reason: interaction.fields.getTextInputValue('reason'),
    reference: interaction.fields.getTextInputValue('reference') || null,
    priority: interaction.fields.getTextInputValue('priority') || null,
  };

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild || (await resolveHomeGuild(client, interaction.user.id));

  if (!guild) {
    return interaction.editReply({ content: t(lang, 'ticketCreatedNoGuild') });
  }

  const config = storage.getGuildConfig(guild.id);
  if (!config) {
    return interaction.editReply({ content: t(lang, 'configMissing') });
  }

  const existing = storage.findOpenTicketByUser(interaction.user.id, guild.id);
  if (existing) {
    return interaction.editReply({
      content: t(lang, 'alreadyHaveTicket', { channel: `<#${existing.channelId}>` }),
    });
  }

  const channel = await createTicketChannel(guild, interaction.user, lang, answers);
  if (!channel) {
    return interaction.editReply({ content: t(lang, 'configMissing') });
  }

  await interaction.editReply({ content: t(lang, 'ticketCreatedUser', { channel: `<#${channel.id}>` }) });
}

async function handleClaim(interaction) {
  const ticket = storage.getTicket(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: t('en', 'notATicketChannel'), ephemeral: true });
  }

  const lang = ticket.language || 'en';
  if (ticket.claimedBy) {
    return interaction.reply({
      content: t(lang, 'alreadyClaimed', { staff: `<@${ticket.claimedBy}>` }),
      ephemeral: true,
    });
  }

  storage.setTicket(interaction.channel.id, { claimedBy: interaction.user.id });
  await interaction.reply({ content: t(lang, 'claimedMessage', { staff: `<@${interaction.user.id}>` }) });
}

async function closeTicket(interaction) {
  const channel = interaction.channel;
  const ticket = storage.getTicket(channel.id);
  if (!ticket) {
    return interaction.reply({ content: t('en', 'notATicketChannel'), ephemeral: true });
  }

  const lang = ticket.language || 'en';
  await interaction.reply({ content: t(lang, 'closingMessage', { staff: `<@${interaction.user.id}>` }) });

  // Build a plain-text transcript of the ticket
  let transcript = `Ticket transcript — #${channel.name}\n`;
  transcript += `Opened by: ${ticket.userId}\n`;
  transcript += `Language: ${lang}\n`;
  transcript += `Subject: ${ticket.answers?.subject}\n`;
  transcript += `Reason: ${ticket.answers?.reason}\n`;
  transcript += `Closed by: ${interaction.user.id}\n\n---\n\n`;

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].reverse();
    for (const m of sorted) {
      transcript += `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}\n`;
    }
  } catch (e) {
    transcript += '(Could not fetch full message history)\n';
  }

  const guildConfig = storage.getGuildConfig(ticket.guildId);
  if (guildConfig?.logChannelId) {
    try {
      const logChannel = await interaction.guild.channels.fetch(guildConfig.logChannelId);
      const file = new AttachmentBuilder(Buffer.from(transcript, 'utf8'), {
        name: `${channel.name}-transcript.txt`,
      });
      await logChannel.send({ content: `📄 Transcript for ${channel.name}`, files: [file] });
    } catch (e) {
      console.error('Failed to send transcript to log channel:', e);
    }
  }

  try {
    const user = await interaction.client.users.fetch(ticket.userId);
    await user.send(t(lang, 'ticketClosedDM'));
  } catch (e) {
    // user has DMs closed — ignore
  }

  storage.deleteTicket(channel.id);

  setTimeout(() => {
    channel.delete().catch(() => {});
  }, 5000);
}

module.exports = {
  postPanel,
  handlePanelButton,
  sendLanguagePromptInteraction,
  sendLanguagePromptDM,
  handleLanguageButton,
  handleModalSubmit,
  handleClaim,
  closeTicket,
};
