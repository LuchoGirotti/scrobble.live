import { load } from 'cheerio';

export default async (req, res) => {
    if (req.query.username) {
        let { username } = req.query;
        const response = await fetch(`https://last.fm/user/${username}`);
        const htmlContent = await response.text();
        const $ = load(htmlContent);
        let nowScrobbling, trackName, artistName, albumName, albumCoverUrl, scrobblingNow;
        console.log($('title').text());
        if ($('title').text().includes('Page Not Found')) {
            res.status(400).json({ error: `User ${username} not found` });
            return;
        }

        username = $('title').text().split('’')[0].trim();

        if ($('.chartlist-row--now-scrobbling').length) {
            nowScrobbling = $('.chartlist-row--now-scrobbling');
            scrobblingNow = true;
        } else if ($('.chartlist-row').length) {
            nowScrobbling = $('.chartlist-row').first();
            scrobblingNow = false
        } else{
            res.status(400).json({ error: `No scrobbles found for ${username}` });
            return;
        }

        trackName = nowScrobbling.find('.chartlist-name').text().trim();
        artistName = nowScrobbling.find('.chartlist-artist').text().trim();
        const albumImage = nowScrobbling.find('img');
        albumName = albumImage.attr('alt');
        albumCoverUrl = albumImage.attr('src').replace('/64s/', '/500x500/');

        res.status(200).json({
            username: username,
            scrobblingNow: scrobblingNow,
            trackName: trackName,
            artistName: artistName,
            albumName: albumName,
            albumCoverUrl: albumCoverUrl
        });
    } else {
        res.status(400).json({ error: 'Missing username' });
    }
};