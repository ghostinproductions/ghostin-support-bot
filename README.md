# Ghostin Productions — Support Bot

A Discord support ticket bot with automated intake questions, bilingual
support (English/Spanish), and multiple ways for members to reach your team.

## Features

- **Automated ticket intake** — a short questionnaire (Subject, "why are you
  opening this ticket", optional order/reference #, priority) via a Discord
  modal form.
- **Bilingual (EN/ES)** — every message, button, and the intake form itself
  adapts to whichever language the user picks. All-day, always-on ("24/7")
  since it's just a bot process — see hosting notes below.
- **Two ways in:**
  - **DM the bot directly** — it greets the user and starts the ticket flow
    right there.
  - **"Open a Ticket" panel button** — post a panel in any channel with
    `/panel` or during `/setup`.
- **Private ticket channels** — each ticket gets its own channel visible
  only to the ticket owner + your support role, under a category you choose.
- **Staff tools** — `Claim` and `Close` buttons on every ticket, the support
  role gets pinged automatically, and closing a ticket saves a text
  transcript to a log channel and DMs the user a closing notice.
- **Duplicate prevention** — a user can't open a second ticket while one is
  already open.

## 1. Create the Discord application

1. Go to https://discord.com/developers/applications → **New Application**.
2. Name it (e.g. "Ghostin Productions Support").
3. Under **Bot**, click **Reset Token** to get your bot token — save it,
   you'll need it below. No privileged intents need to be enabled for this
   bot (it doesn't use Message Content, Presence, or Server Members intents).
4. Under **General Information**, copy the **Application ID** — this is your
   `CLIENT_ID`.

## 2. Invite the bot to your server

Build an invite URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=1535087461519069227&permissions=277083691584&scope=bot%20applications.commands
```

That permission set includes: View Channels, Send Messages, Embed Links,
Attach Files, Read Message History, Manage Channels, Manage Roles. (You can
also build a custom invite link from the **OAuth2 → URL Generator** page in
the Developer Portal — check `bot` and `applications.commands` scopes.)

## 3. Configure the project

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-test-server-id   # optional, recommended while developing
```

`GUILD_ID` makes slash commands register instantly in that one server.
Leave it blank once you're ready to deploy commands globally (takes up to
~1 hour to show up everywhere).

## 4. Deploy slash commands and start the bot

```bash
npm run deploy   # registers /setup, /panel, /ticket
npm start        # logs the bot in
```

## 5. Configure it inside Discord

Run, as a server admin:

```
/setup category:<Tickets category> support_role:<@Support> log_channel:<#ticket-logs> panel_channel:<#support>
```

- `category` — where new ticket channels get created.
- `support_role` — role that can see/claim/close tickets and gets pinged.
- `log_channel` *(optional)* — where closed-ticket transcripts get posted.
- `panel_channel` *(optional)* — if set, immediately posts the "Open a
  Ticket" panel there. You can also post/repost the panel later with
  `/panel channel:<#support>`.

That's it — members can now:
- Click the panel button, **or**
- Run `/ticket open`, **or**
- Just **DM the bot directly**

...pick English or Español, fill out the short form, and a private ticket
channel is created and their answers get posted for staff.

## Customizing

- **Wording / translations** — edit `src/lang/en.js` and `src/lang/es.js`.
  Every user-facing string lives in those two files.
- **Intake questions** — edit `buildModal()` in
  `src/handlers/ticketFlow.js` (Discord modals support up to 5 fields).
- **Brand color** — `BRAND_COLOR` at the top of `src/handlers/ticketFlow.js`.
- **Ticket channel naming / permissions** — `createTicketChannel()` in the
  same file.

## Keeping it online 24/7

This is a normal Node.js process — it's only "24/7" if something keeps it
running. Common options:
- A small VPS (or a spare machine) with [pm2](https://pm2.keymetrics.io/):
  `pm2 start src/index.js --name ghostin-support`
- A host like Railway, Render, or Fly.io (any "always-on worker/background
  process" plan — this bot doesn't need a web server, just a persistent
  process).
- Docker, if you already have a container host.

## Notes / limitations of this v1

- Ticket + config data is stored in local JSON files under `data/` — fine
  for small/medium volume. If you outgrow it, swap `src/storage.js` for a
  real database.
- DM-opened tickets require the user to share a server with the bot (the
  bot checks each server it's in to find one where both you and it are
  members and that server has been `/setup`).
- Good next additions if you want them: a dropdown to pick a ticket
  *category* (billing, bugs, general, etc.) before the form, auto-FAQ
  replies for common questions, ticket cooldowns, or a post-close
  satisfaction rating.
