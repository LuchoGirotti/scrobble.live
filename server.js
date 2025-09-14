const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { load } = require('cheerio');

const app = express();
const PORT = 8080;

// CORS configuration
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://scrobble.live'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Connection, Upgrade');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Global state to store user data
const userCache = new Map();
const activeConnections = new Map(); // username -> Set of WebSocket connections

// Serve static files
app.use(express.static('public'));

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        activeUsers: activeConnections.size,
        uptime: process.uptime()
    });
});

// Keep-alive endpoint
app.get('/ping', (req, res) => {
    res.json({ status: 'awake', timestamp: Date.now() });
});

// API endpoint to get user data (for fallback)
app.get('/api/user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const userData = await fetchUserData(username);
        res.json(userData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Function to fetch data from Last.fm
async function fetchUserData(username) {
    try {
        const response = await fetch(`https://last.fm/user/${username}`);
        const htmlContent = await response.text();
        const $ = load(htmlContent);
        
        if ($('title').text().includes('Page Not Found')) {
            return { error: `User ${username} not found` };
        }

        const correctedUsername = $('title').text().split("’")[0].trim();
        let nowScrobbling, trackName, artistName, albumName, albumCoverUrl, scrobblingNow;

        if ($('.chartlist-row--now-scrobbling').length) {
            nowScrobbling = $('.chartlist-row--now-scrobbling');
            scrobblingNow = true;
        } else if ($('.chartlist-row').length) {
            nowScrobbling = $('.chartlist-row').first();
            scrobblingNow = false;
        } else {
            return { error: `No scrobbles found for ${username}` };
        }

        trackName = nowScrobbling.find('.chartlist-name').text().trim();
        artistName = nowScrobbling.find('.chartlist-artist').text().trim();
        const albumImage = nowScrobbling.find('img');
        albumName = albumImage.attr('alt');
        albumCoverUrl = albumImage.attr('src').replace('/64s/', '/500x500/');

        return {
            username: correctedUsername,
            scrobblingNow: scrobblingNow,
            trackName: trackName,
            artistName: artistName,
            albumName: albumName,
            albumCoverUrl: albumCoverUrl,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error(`Error fetching data for ${username}:`, error);
        return { error: 'Failed to fetch user data' };
    }
}

// Function to check for updates and notify clients
async function checkForUpdates(username) {
    const normalizedUsername = username.toLowerCase();
    const newData = await fetchUserData(username);
    
    if (newData.error) {
        console.log(`Error for ${username}: ${newData.error}`);
        return;
    }
    
    const cachedData = userCache.get(normalizedUsername);
    const trackId = `${newData.artistName}-${newData.trackName}-${newData.albumName}`;
    
    // Check if there are changes
    let hasChanged = false;
    if (!cachedData) {
        hasChanged = true;
    } else {
        const oldTrackId = `${cachedData.artistName}-${cachedData.trackName}-${cachedData.albumName}`;
        hasChanged = trackId !== oldTrackId || cachedData.scrobblingNow !== newData.scrobblingNow;
    }
    
    if (hasChanged) {
        console.log(`🎵 Track changed for ${newData.username}: ${newData.artistName} - ${newData.trackName}`);
        
        // Update cache
        userCache.set(normalizedUsername, newData);
        
        // Notify all connected clients for this user
        const connections = activeConnections.get(normalizedUsername);
        if (connections) {
            const message = JSON.stringify({
                type: 'update',
                data: newData
            });
            
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
        }
    }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket connection');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'subscribe' && data.username) {
                const normalizedUsername = data.username.toLowerCase();
                console.log(`👤 Client subscribed to ${normalizedUsername}`);
                
                // Add connection to map
                if (!activeConnections.has(normalizedUsername)) {
                    activeConnections.set(normalizedUsername, new Set());
                }
                activeConnections.get(normalizedUsername).add(ws);
                
                // Save username in connection
                ws.username = normalizedUsername;
                
                // Send existing data or make initial fetch
                let userData = userCache.get(normalizedUsername);
                if (!userData) {
                    userData = await fetchUserData(data.username);
                    if (!userData.error) {
                        userCache.set(normalizedUsername, userData);
                    }
                }
                
                ws.send(JSON.stringify({
                    type: 'initial',
                    data: userData
                }));
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('📡 WebSocket connection closed');
        
        // Remove connection from map
        if (ws.username) {
            const connections = activeConnections.get(ws.username);
            if (connections) {
                connections.delete(ws);
                if (connections.size === 0) {
                    activeConnections.delete(ws.username);
                }
            }
        }
    });
});

// Periodic polling for active users
setInterval(() => {
    const activeUsernames = Array.from(activeConnections.keys());
    
    if (activeUsernames.length > 0) {
        console.log(`🔄 Checking updates for ${activeUsernames.length} active users`);
        activeUsernames.forEach(username => {
            checkForUpdates(username);
        });
    }
}, 5000); // Check every 5 seconds

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 Scrobble.Live WebSocket server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time updates`);
    console.log(`💚 Health check: /health`);
});
