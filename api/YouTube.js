const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function youtubeDownloader(url) {
  const data = JSON.stringify({ url });

  const options = {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'origin': 'https://www.clipto.com',
      'x-requested-with': 'mark.via.gp',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://www.clipto.com/id/media-downloader/youtube-downloader',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i',
      'Cookie': 'NEXT_LOCALE=id; traffic-source=stripe-web-ytd-seo-ytd; traffic-history=seo; merge-video-api=1; vd-down-app=a'
    },
    body: data
  };

  const res = await fetch('https://www.clipto.com/api/youtube', options);
  const result = await res.json();

  if (!result?.medias || !Array.isArray(result.medias)) {
    throw new Error("Media tidak ditemukan");
  }

  const medias = result.medias;

  // MP4 terbaik
  const video = medias
    .filter(m => m.type === "video" && m.ext === "mp4" && m.url)
    .sort((a, b) => {
      const hA = a.height || 0;
      const hB = b.height || 0;
      if (hB !== hA) return hB - hA;
      return (b.bitrate || 0) - (a.bitrate || 0);
    })[0] || null;

  // MP3 (opus → fallback m4a)
  const audio =
    medias
      .filter(m => m.type === "audio" && m.ext === "opus" && m.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
    ||
    medias
      .filter(m => m.type === "audio" && m.ext === "m4a" && m.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
    || null;

  return {
    title: result.title || "",
    video: video
      ? {
          quality: video.quality,
          ext: video.ext,
          url: video.url
        }
      : null,
    audio: audio
      ? {
          quality: audio.label,
          ext: audio.ext,
          url: audio.url
        }
      : null
  };
}

module.exports = [
  {
    name: "Youtube Downloader",
    desc: "Youtube mp4 & mp3 downloader",
    category: "Downloader",
    path: "/download/ytdl?apikey=&url=",
    async run(req, res) {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const result = await youtubeDownloader(url);
        res.status(200).json({ status: true, result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  }
];