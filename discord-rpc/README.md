# Scrobble.Live Discord Rich Presence

Discord Rich Presence that displays your current Last.fm music by connecting to the Scrobble.Live WebSocket.

## 🎵 Result

Shows in your Discord profile:
```
🟢 Your Username
Playing [Your App Name]
  [Song]
  [Artist]
```

## 📋 Requirements

- Node.js (version 14 or higher)
- Discord Desktop App (Rich Presence doesn't work in browser)
- Last.fm account with active scrobbling
- Configured Discord application

## ⚙️ Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name like "♪♪"
4. Copy the "Application ID"

### 2. Install and configure

```bash
cd discord-rpc
npm install
cp .env.example .env
```

Edit `.env`:
```env
LASTFM_USERNAME=your_lastfm_username
DISCORD_CLIENT_ID=your_application_id
```

## 🚀 Usage

```bash
npm start
```

The Rich Presence will connect to your Scrobble.Live WebSocket and update your Discord activity every time you change songs.

## 🛑 Stop

Press `Ctrl + C` to close the Rich Presence properly.
