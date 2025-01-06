import { load } from 'cheerio';

export default async (req, res) => {
    const { username } = req.query;
    const response = await fetch(`https://last.fm/user/${username}`);
    const htmlContent = await response.text();
    const $ = load(htmlContent);
    const nowScrobbling = $('.chartlist-row--now-scrobbling');
    let scrobblingNow = false;
    let trackName, artistName, albumName, albumCoverUrl;

    if (nowScrobbling.length) {
        scrobblingNow = true;
        trackName = nowScrobbling.find('.chartlist-name').text().trim();
        artistName = nowScrobbling.find('.chartlist-artist').text().trim();
        const albumImage = nowScrobbling.find('img');
        albumName = albumImage.attr('alt');
        albumCoverUrl = albumImage.attr('src').replace('/64s/', '/500x500/');
    } else {
        const lastScrobble = $('.chartlist-row').first();
        trackName = lastScrobble.find('.chartlist-name').text().trim();
        artistName = lastScrobble.find('.chartlist-artist').text().trim();
        const albumImage = lastScrobble.find('img');
        albumName = albumImage.attr('alt');
        albumCoverUrl = albumImage.attr('src').replace('/64s/', '/500x500/');
    }

    res.status(200).json({
        scrobblingNow: scrobblingNow,
        trackName: trackName,
        artistName: artistName,
        albumName: albumName,
        albumCoverUrl: albumCoverUrl
    });
};