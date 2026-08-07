const {
  handlePanelButton,
  handleLanguageButton,
  handleModalSubmit,
  handleClaim,
  closeTicket,
} = require('./ticketFlow');

async function handleInteraction(interaction, client) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      return command.execute(interaction, client);
    }

    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'open_ticket':
          return handlePanelButton(interaction);
        case 'lang_en':
        case 'lang_es':
          return handleLanguageButton(interaction);
        case 'ticket_claim':
          return handleClaim(interaction);
        case 'ticket_close':
          return closeTicket(interaction);
        default:
          return;
      }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
      return handleModalSubmit(interaction, client);
    }
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ content: 'Something went wrong. Please try again.', ephemeral: true })
        .catch(() => {});
    }
  }
}

module.exports = { handleInteraction };
