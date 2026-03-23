const DiscordRPC = require('discord-rpc');
const WebSocket = require('ws');
require('dotenv').config();

// Register the Client ID
DiscordRPC.register(process.env.DISCORD_CLIENT_ID);

class ScrobbleLiveDiscordBot {
    constructor() {
        this.rpc = null;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.currentTrackId = null;
        this.keepAliveInterval = null;
        
        this.username = process.env.LASTFM_USERNAME;
        this.clientId = process.env.DISCORD_CLIENT_ID;
        
        if (!this.username || !this.clientId) {
            console.error('❌ Error: Missing required environment variables.');
            console.error('Please copy .env.example to .env and configure LASTFM_USERNAME and DISCORD_CLIENT_ID');
            process.exit(1);
        }
        
        console.log(`🎵 Starting Scrobble.Live Discord Bot for ${this.username}`);
    }
    
    async start() {
        try {
            await this.initDiscord();
            this.connectWebSocket();
        } catch (error) {
            console.error('❌ Error starting bot:', error);
            process.exit(1);
        }
    }
    
    async initDiscord() {
        return new Promise((resolve, reject) => {
            this.rpc = new DiscordRPC.Client({ transport: 'ipc' });
            
            this.rpc.on('ready', () => {
                console.log('🤖 Discord RPC connected as:', this.rpc.user.username);
                resolve();
            });
            
            this.rpc.on('error', (error) => {
                console.error('❌ Discord RPC error:', error);
                reject(error);
            });
            
            this.rpc.login({ clientId: this.clientId }).catch(reject);
        });
    }
    
    connectWebSocket() {
        const wsUrl = 'wss://scrobble-live.onrender.com';
        
        console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.on('open', () => {
            console.log('🔗 WebSocket connected');
            this.reconnectAttempts = 0;
            
            // Subscribe to user
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                username: this.username
            }));
            
            // Keep-alive ping every 10 minutes to prevent Render from sleeping
            this.keepAliveInterval = setInterval(() => {
                fetch('https://scrobble-live.onrender.com/ping')
                    .catch(err => console.log('Keep-alive ping failed:', err));
            }, 600000); // 10 minutes
            
            console.log(`📡 Subscribed to updates for ${this.username}`);
        });
        
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.type === 'initial' || message.type === 'update') {
                    this.handleMusicUpdate(message.data);
                }
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        });
        
        this.ws.on('close', () => {
            console.log('📡 WebSocket disconnected');
            
            // Clear keep-alive interval
            if (this.keepAliveInterval) {
                clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = null;
            }
            
            // Clear Discord activity
            this.clearDiscordActivity();
            
            // Attempt to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = 2000 * this.reconnectAttempts;
                console.log(`🔄 Attempting to reconnect in ${delay/1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => this.connectWebSocket(), delay);
            } else {
                console.error('❌ Maximum number of reconnection attempts reached');
            }
        });
        
        this.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });
    }
    
    handleMusicUpdate(data) {
        if (data.error) {
            console.error(`❌ Server error: ${data.error}`);
            this.clearDiscordActivity();
            return;
        }
        
        // Create a unique identifier for the current song
        const trackId = `${data.artistName}-${data.trackName}-${data.albumName}`;
        
        // Only update if the song has changed
        if (this.currentTrackId !== trackId) {
            this.currentTrackId = trackId;
            console.log(`🎵 New song: ${data.artistName} - ${data.trackName}`);
            
            this.updateDiscordActivity(data);
        }
    }
    
    async updateDiscordActivity(data) {
        if (!this.rpc) return;
        
        try {
            const activity = {
                details: data.trackName,
                state: data.artistName,
                largeImageKey: data.albumCoverUrl,
                largeImageText: data.albumName,
                smallImageKey: data.scrobblingNow ? 'playing' : 'paused',
                smallImageText: data.scrobblingNow ? 'Now playing • scrobblelive.vercel.app' : 'Last played • scrobblelive.vercel.app',
                instance: false,
            };
            
            // If currently listening, add timestamp
            if (data.scrobblingNow) {
                activity.startTimestamp = Date.now();
            }
            
            await this.rpc.setActivity(activity);
            
            const status = data.scrobblingNow ? 'Now playing' : 'Last played';
            console.log(`🎮 Discord updated: ${status} - ${data.artistName} - ${data.trackName}`);
            console.log(`🖼️ Album cover: ${data.albumCoverUrl}`);
            
        } catch (error) {
            console.error('❌ Error updating Discord activity:', error);
        }
    }
    
    async clearDiscordActivity() {
        if (!this.rpc) return;
        
        try {
            await this.rpc.clearActivity();
            console.log('🎮 Discord activity cleared');
        } catch (error) {
            console.error('❌ Error clearing Discord activity:', error);
        }
    }
    
    async stop() {
        console.log('🛑 Shutting down bot...');
        
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        await this.clearDiscordActivity();
        
        if (this.rpc) {
            this.rpc.destroy();
        }
        
        console.log('👋 Bot closed successfully');
    }
}

// Create and start the bot
const bot = new ScrobbleLiveDiscordBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await bot.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.stop();
    process.exit(0);
});

// Start the bot
bot.start().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});