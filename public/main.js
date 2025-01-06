document.addEventListener("DOMContentLoaded", () => {
console.log(`Scrobble.Live - A free and open-source alternative to Last.fm's /now page.
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
`);
    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get("user");

    const container = document.getElementById("now_scrobbling_container");
    const loadingText = document.createElement("div");
    loadingText.className = "loading-text";
    container.appendChild(loadingText);

    if (username) {
        loadingText.textContent = `Fetching ${username}'s current scrobble...`;
        fetch(`/api/now.js?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    document.title = data.error;
                    container.removeChild(loadingText);
                    container.appendChild(Object.assign(document.createElement("h1"), { className: "title", textContent: data.error }));
                    setTimeout(() => window.location.search = "", 3000);
                    return;
                }
                username = data.username; // Correct case
                document.title = `${data.username}'s now playing | Scrobble.Live`;
                const p = document.createElement("p");
                p.className = "message";
                if (data.scrobblingNow) {
                    p.textContent = `${username} is scrobbling… `;
                } else {
                    p.textContent = `${username} last scrobbled… `;
                }
                container.parentNode.insertBefore(p, container);
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
                albumCover.onload = () => {
                    container.removeChild(loadingText);
                    container.appendChild(albumCover);
                    container.appendChild(trackName);
                    container.appendChild(artistAlbum);
                    document.body.style.backgroundImage = `url(${data.albumCoverUrl})`;
                }
            });
    } else {
        container.appendChild(Object.assign(document.createElement("h1"), { className: "title", textContent: "Scrobble.Live" }));
        container.appendChild(Object.assign(document.createElement("p"), { className: "description", textContent: "A free and open-source alternative to Last.fm's /now page" }));
        container.appendChild(Object.assign(document.createElement("a"), { className: "source", href: "https://github.com/lucho-girotti/scrobble.live", textContent: "Source Code" }));
        const input = Object.assign(document.createElement("input"), { type: "text", placeholder: "Username", className: "username-input" });
        container.appendChild(input);

        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const enteredUsername = input.value.trim();
                if (enteredUsername) {
                    window.location.search = `?user=${enteredUsername}`;
                }
            }
        });
    }
});