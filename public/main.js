document.addEventListener("DOMContentLoaded", () => {
    console.log(`Scrobble.Live - A free and open-source alternative to Last.fm's "/now" page.
Copyright (C) 2025  Luciano Girotti

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.


Source Code: https://github.com/lucho-girotti/scrobble.live
If you have any questions, suggestions, or feedback, kindly open an issue on GitHub.

Enjoy!

LAST.FM IS A TRADEMARK OF LAST.FM LTD. SCROBBLE.LIVE IS NOT AFFILIATED WITH, ENDORSED BY, OR ASSOCIATED WITH LAST.FM IN ANY WAY. THE NAME "LAST.FM" IS USED SOLELY UNDER NOMINATIVE FAIR USE TO DESCRIBE THE SERVICE THIS PROJECT INTERACTS WITH.
`);
    
    // Get username from URL path or query parameter
    let username = null;
    const pathParts = window.location.pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
        username = pathParts[0]; // Get username from URL path (e.g., /username)
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        username = urlParams.get("user"); // Fallback to ?user=username
    }

    const container = document.getElementById("now_scrobbling_container");
    const loadingText = document.createElement("div");
    loadingText.className = "loading-text";
    container.appendChild(loadingText);

    if (username) {
        let ws;
        let currentTrackId = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        let keepAliveInterval;
        
        const connectWebSocket = () => {
            // Always connect to the hosted backend
            const wsUrl = 'wss://scrobble-live.onrender.com';
            
            console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('🔗 WebSocket connected');
                reconnectAttempts = 0;
                loadingText.textContent = `Connecting to ${username}'s live feed...`;
                
                // Suscribirse al usuario
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    username: username
                }));
                
                // Keep-alive ping every 10 minutes to prevent Render sleep
                keepAliveInterval = setInterval(() => {
                    fetch('https://scrobble-live.onrender.com/ping')
                        .catch(err => console.log('Keep-alive ping failed:', err));
                }, 600000); // 10 minutes
            };
            
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'initial' || message.type === 'update') {
                        handleDataUpdate(message.data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            ws.onclose = () => {
                console.log('📡 WebSocket disconnected');
                
                // Clear keep-alive interval
                if (keepAliveInterval) {
                    clearInterval(keepAliveInterval);
                    keepAliveInterval = null;
                }
                
                // Intentar reconectar
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})`);
                    setTimeout(connectWebSocket, 2000 * reconnectAttempts);
                } else {
                    console.error('❌ Max reconnection attempts reached');
                    loadingText.textContent = 'Connection lost. Please refresh the page.';
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        };
        
        const handleDataUpdate = (data) => {
            if (data.error) {
                document.title = data.error;
                container.removeChild(loadingText);
                container.appendChild(Object.assign(document.createElement("h1"), { className: "title", textContent: data.error }));
                setTimeout(() => window.location.pathname = "/", 3000);
                return;
            }
            
            username = data.username; // Correct case
            document.title = `${data.username}'s now playing | Scrobble.Live`;
            
            // Create a unique identifier for the current track
            const trackId = `${data.artistName}-${data.trackName}-${data.albumName}`;
            
            // Only update UI if the track has changed
            if (currentTrackId !== trackId) {
                currentTrackId = trackId;
                console.log(`🎵 Track updated: ${data.artistName} - ${data.trackName}`);
                
                // Clear existing content
                const existingAlbumCover = container.querySelector('img');
                const existingTrackName = container.querySelector('.track-name');
                const existingArtistAlbum = container.querySelector('.artist-album');
                if (existingAlbumCover) container.removeChild(existingAlbumCover);
                if (existingTrackName) container.removeChild(existingTrackName);
                if (existingArtistAlbum) container.removeChild(existingArtistAlbum);
                
                // Update or create message element
                let messageElement = document.querySelector('.message');
                if (!messageElement) {
                    messageElement = document.createElement("p");
                    messageElement.className = "message";
                    container.parentNode.insertBefore(messageElement, container);
                }
                
                if (data.scrobblingNow) {
                    messageElement.textContent = `${username} is scrobbling… `;
                } else {
                    messageElement.textContent = `${username} last scrobbled… `;
                }
                
                const trackName = document.createElement("div");
                trackName.className = "track-name";
                const trackLink = document.createElement("a");
                trackLink.href = `https://www.last.fm/music/${data.artistName.replace(/ /g, '+')}/_/${data.trackName.replace(/ /g, '+')}`;
                trackLink.textContent = data.trackName;
                trackLink.target = "_blank";
                trackName.appendChild(trackLink);

                const artistAlbum = document.createElement("div");
                artistAlbum.className = "artist-album";
                const artistLink = document.createElement("a");
                artistLink.href = `https://www.last.fm/music/${data.artistName.replace(/ /g, '+')}`;
                artistLink.textContent = data.artistName;
                artistLink.target = "_blank";
                const albumLink = document.createElement("a");
                albumLink.href = `https://www.last.fm/music/${data.artistName.replace(/ /g, '+')}/${data.albumName.replace(/ /g, '+')}`;
                albumLink.textContent = data.albumName;
                albumLink.target = "_blank";
                artistLink.className = "artist";
                albumLink.className = "album";
                artistAlbum.appendChild(artistLink);
                artistAlbum.appendChild(Object.assign(document.createElement("span"), { className: "separator", textContent: '·' }));
                artistAlbum.appendChild(albumLink);

                const albumCover = document.createElement("img");
                albumCover.src = data.albumCoverUrl;
                
                // Remove loading text immediately
                if (loadingText.parentNode) {
                    container.removeChild(loadingText);
                }
                
                albumCover.onload = () => {
                    container.appendChild(albumCover);
                    container.appendChild(trackName);
                    container.appendChild(artistAlbum);
                    document.body.style.backgroundImage = `url(${data.albumCoverUrl})`;
                }
                
                // Handle image load error
                albumCover.onerror = () => {
                    container.appendChild(trackName);
                    container.appendChild(artistAlbum);
                }
                
                // Add close button only once
                if (!document.querySelector('.close')) {
                    const close = document.createElement("a");
                    close.href = `https://www.last.fm/user/${username}`;
                    close.className = "close";
                    const closeImage = document.createElement("img");
                    closeImage.src = "https://www.last.fm/static/images/icons/delete_light_24.png";
                    close.appendChild(closeImage);
                    document.body.appendChild(close);
                }
            }
        };
        
        // Conectar WebSocket
        connectWebSocket();
        
        // Cleanup cuando se cierra la página
        window.addEventListener('beforeunload', () => {
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
            }
            if (ws) {
                ws.close();
            }
        });
        
    } else {
        container.appendChild(Object.assign(document.createElement("h1"), { className: "title", textContent: "Scrobble.Live" }));
        container.appendChild(Object.assign(document.createElement("p"), { className: "description", textContent: "A free and open-source alternative to Last.fm's /now page" }));
        const infoContainer = document.createElement("div");
        infoContainer.className = "info-container";
        infoContainer.appendChild(Object.assign(document.createElement("a"), { className: "source", href: "https://github.com/lucho-girotti/scrobble.live", textContent: "Source Code" }));
        infoContainer.appendChild(Object.assign(document.createElement("p"), { className: "notice", textContent: "LAST.FM IS A TRADEMARK OF LAST.FM LTD. SCROBBLE.LIVE IS NOT AFFILIATED WITH, ENDORSED BY, OR ASSOCIATED WITH LAST.FM IN ANY WAY. THE NAME \"LAST.FM\" IS USED SOLELY UNDER NOMINATIVE FAIR USE TO DESCRIBE THE SERVICE THIS PROJECT INTERACTS WITH."}));
        container.appendChild(infoContainer);
        const input = Object.assign(document.createElement("input"), { type: "text", placeholder: "Username", className: "username-input" });
        container.appendChild(input);

        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const enteredUsername = input.value.trim();
                if (enteredUsername) {
                    window.location.pathname = `/${enteredUsername}`;
                }
            }
        });
    }
});
