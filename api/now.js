
import { load } from 'cheerio';

export default async (req, res) => {
    const { username } = req.query;
    const response = await fetch(`https://last.fm/user/${username}`);
    const htmlContent = await response.text();
    const $ = load(htmlContent);
    const nowScrobbling = $('.chartlist-row--now-scrobbling');
    if (nowScrobbling.length) {
        const trackName = nowScrobbling.find('.chartlist-name').text().trim();
        const artistName = nowScrobbling.find('.chartlist-artist').text().trim();
        const albumImage = nowScrobbling.find('img');
        const albumName = albumImage.attr('alt');
        const albumCoverUrl = albumImage.attr('src').replace('/64s/', '/500x500/');
        res.status(200).json({
            trackName: trackName,
            artistName: artistName,
            albumName: albumName,
            albumCoverUrl: albumCoverUrl
        });
    } else {
        res.status(404).json({ error: "No scrobbling data found" });
    }
};