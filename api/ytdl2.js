const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { URLSearchParams } = require('url');

/**
 * Youtube Downloader V2 (NoTube)
 * @param {String} url
 * @param {String} format mp3 | mp4
 */
async function youtubeV2(url, format) {
  const yt = {
    title: null,
    format,
    download: null
  };

  const data = new URLSearchParams();
  data.append('url', url);
  data.append('format', format);
  data.append('lang', 'id');
  data.append('subscribed', 'false');

  const options = {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
      'Accept': 'text/html, */*; q=0.01',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/x-www-form-urlencoded',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'Origin': 'https://notube.net',
      'X-Requested-With': 'mark.via.gp',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Referer': 'https://notube.net/',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    },
    body: data
  };

  const response = await fetch(
    'https://s57.notube.net/recover_weight.php',
    options
  ).then(res => res.text());

  const json = JSON.parse(response);

  yt.title = decodeURIComponent(json.titre_mp4.replace(/\+/g, ' '));
  yt.download = json.url_mp4_youtube;

  return yt;
}

module.exports = [
  {
    name: "Ytdl Mp3 V2",
    desc: "Youtube mp3 downloader V2",
    category: "Downloader",
    path: "/download/ytdl-mp3-v2?apikey=&url=",
    async run(req, res) {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const result = await youtubeV2(url, "mp3");
        res.status(200).json({ status: true, result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  {
    name: "Ytdl Mp4 V2",
    desc: "Youtube mp4 downloader V2",
    category: "Downloader",
    path: "/download/ytdl-mp4-v2?apikey=&url=",
    async run(req, res) {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const result = await youtubeV2(url, "mp4");
        res.status(200).json({ status: true, result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  }
];
