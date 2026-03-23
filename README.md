# Scrobble.Live

## A Free and Open-Source Alternative to Last.fm's "/now" Page

Scrobble.Live is an independent, free, and open-source project that replicates the "Now Playing" or "Currently Scrobbling" page functionality for Last.fm users with **real-time WebSocket updates**.

The official "/now" page is part of Last.fm's "Pro" features. For comparison, visit:

- Official Last.fm page: https://www.last.fm/user/LAST.HQ/now
- Scrobble.Live equivalent: https://scrobblelive.vercel.app/LAST.HQ

## 🎵 Features

- **Real-time updates** via WebSockets - see track changes instantly
- **Discord Rich Presence** - Show your current music in your Discord profile
- **Clean interface** with album artwork and track information
- **Free to use** - no registration or API keys required
- **Clean URLs** - use `scrobblelive.vercel.app/username` format
- **Always available** - hosted and maintained for everyone

## 🚀 How to Use

**It's simple! No installation needed.**

Just visit: **`https://scrobblelive.vercel.app/USERNAME`**

Replace `USERNAME` with any Last.fm username to see their current or last scrobbled track.

**Examples**:
- https://scrobblelive.vercel.app/LAST.HQ
- https://scrobblelive.vercel.app/LuchoGirotti
- https://scrobblelive.vercel.app/your-username

The page will automatically update in real-time when the track changes!

## 🎮 Discord Rich Presence

Show your current Last.fm music directly in your Discord profile with our Discord Rich Presence bot!

### Features:
- **Real-time sync** with your Last.fm scrobbles
- **Album artwork** displayed in your Discord profile
- **Track and artist info** with Scrobble.Live branding
- **Automatic updates** when you change songs

Your Discord profile will now show:
```
🟢 Your Username
Playing [Your App Name]
  [Song Name]
  [Artist]
```

For detailed setup instructions, see the [Discord RPC README](discord-rpc/README.md).

## 🖥️ Perfect for

- **TV displays** - Show your current music on a smart TV or second monitor
- **Discord profiles** - Real-time Rich Presence showing your current track
- **Sharing** - Share your live music with friends via a simple URL
- **Real-time visualization** - See track changes instantly without refreshing
- **No hassle** - No accounts, API keys, or complex setup required

## 📝 Technical Details

- **Backend**: Node.js with Express and WebSockets hosted on Render
- **Frontend**: Vanilla JavaScript with real-time WebSocket connection hosted on Vercel
- **Polling**: Smart polling only when users are connected (every 5 seconds)
- **Data source**: Last.fm public user pages (no API key required)
- **Architecture**: Microservices with separate frontend/backend hosting

## 🔧 For Developers

Want to run your own instance or contribute? Check out the source code:

### Local Development

If you want to modify or run locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lucho-girotti/scrobble.live.git
   cd scrobble.live
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Access locally**:
   - Local: `http://localhost:8080/username`

### Project Structure

```
scrobble.live/
├── server.js              # Main WebSocket server
├── package.json           # Dependencies and scripts
├── render.yaml            # Render deployment config
├── vercel.json            # Vercel deployment config
├── discord-rpc/           # Discord Rich Presence bot
│   ├── index.js          # Discord RPC client
│   ├── package.json      # Bot dependencies
│   ├── README.md         # Bot setup instructions
│   └── .env.example      # Environment variables template
└── public/
    ├── index.html         # Frontend HTML
    ├── main.js            # Frontend JavaScript with WebSocket
    ├── styles.css         # Styling
    └── favicon.ico        # Icon
```

## ⚠️ Disclaimer

**LAST.FM IS A TRADEMARK OF LAST.FM LTD. SCROBBLE.LIVE IS NOT AFFILIATED WITH, ENDORSED BY, OR ASSOCIATED WITH LAST.FM IN ANY WAY. THE NAME "LAST.FM" IS USED SOLELY UNDER NOMINATIVE FAIR USE TO DESCRIBE THE SERVICE THIS PROJECT INTERACTS WITH.**

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💖 Support

If you enjoy this project, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔄 Sharing with friends