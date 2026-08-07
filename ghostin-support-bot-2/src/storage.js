// Simple JSON-file storage. Good enough for a single-server (or small
// multi-server) support bot. Swap this out for a real database later if
// ticket volume grows.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILD_CONFIG_FILE = path.join(DATA_DIR, 'guildConfig.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const COUNTERS_FILE = path.join(DATA_DIR, 'counters.json');

function ensureFile(file, defaultData) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
}

function readJson(file, defaultData) {
  ensureFile(file, defaultData);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return defaultData;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---- Guild config: { [guildId]: { categoryId, supportRoleId, logChannelId } } ----

function getGuildConfig(guildId) {
  const all = readJson(GUILD_CONFIG_FILE, {});
  return all[guildId] || null;
}

function setGuildConfig(guildId, config) {
  const all = readJson(GUILD_CONFIG_FILE, {});
  all[guildId] = { ...(all[guildId] || {}), ...config };
  writeJson(GUILD_CONFIG_FILE, all);
  return all[guildId];
}

// ---- Tickets: { [channelId]: { userId, guildId, language, answers, status, claimedBy, createdAt } } ----

function getTicket(channelId) {
  const all = readJson(TICKETS_FILE, {});
  return all[channelId] || null;
}

function getAllTickets() {
  return readJson(TICKETS_FILE, {});
}

function setTicket(channelId, ticket) {
  const all = readJson(TICKETS_FILE, {});
  all[channelId] = { ...(all[channelId] || {}), ...ticket };
  writeJson(TICKETS_FILE, all);
  return all[channelId];
}

function deleteTicket(channelId) {
  const all = readJson(TICKETS_FILE, {});
  delete all[channelId];
  writeJson(TICKETS_FILE, all);
}

function findOpenTicketByUser(userId, guildId) {
  const all = readJson(TICKETS_FILE, {});
  const entry = Object.entries(all).find(
    ([, t]) => t.userId === userId && t.guildId === guildId && t.status === 'open'
  );
  return entry ? { channelId: entry[0], ticket: entry[1] } : null;
}

// ---- Auto-incrementing ticket numbers, per server: { [guildId]: lastNumber } ----

function getNextTicketNumber(guildId) {
  const all = readJson(COUNTERS_FILE, {});
  const next = (all[guildId] || 0) + 1;
  all[guildId] = next;
  writeJson(COUNTERS_FILE, all);
  return next;
}

module.exports = {
  getGuildConfig,
  setGuildConfig,
  getTicket,
  getAllTickets,
  setTicket,
  deleteTicket,
  findOpenTicketByUser,
  getNextTicketNumber,
};
