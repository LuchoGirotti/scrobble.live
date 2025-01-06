document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("user");

    const container = document.getElementById("now_scrobbling_container");
    const loadingText = document.createElement("div");
    loadingText.className = "loading-text";
    container.appendChild(loadingText);

    if (username) {
        loadingText.textContent = `Fetching ${username}'s current scrobble...`;
        fetch(`/api/now.js?username=${username}`)
            .then(response => response.json())
            .then(data => {
                if (!data.scrobblingNow) {
                    const p = document.createElement("p");
                    p.textContent = `${username} last scrobbled… `;
                    container.appendChild(p);
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
                artistAlbum.appendChild(artistLink);
                artistAlbum.appendChild(document.createTextNode(' · '));
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
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Username";
        input.className = "username-input";
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