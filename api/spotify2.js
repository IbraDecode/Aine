const axios = require("axios");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function getToken() {
  const res = await axios.get("https://spotdl.io/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });

  const html = res.data;

  const match = html.match(
    /<meta[^>]+(csrf[-_]?token|csrf|csrf_token)[^>]+content=["']([^"']+)["']/
  );

  if (!match) throw new Error("Token CSRF tidak ditemukan");

  const token = match[2];
  const cookie = (res.headers["set-cookie"] || [])
    .map(c => c.split(";")[0])
    .join("; ");

  return { token, cookie };
}

module.exports = {
  name: "Spotify2",
  desc: "Download Mp3 Spotify V2",
  category: "Downloader",
  path: "/download/spotify2?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "URL Spotify wajib diisi" });
    }

    try {
      const { token, cookie } = await getToken();

      // STEP 1 — getTrackData
      const trackRes = await fetch(
        "https://spotdl.io/getTrackData",
        {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/json",
            "x-csrf-token": token,
            "Origin": "https://spotdl.io",
            "Referer": "https://spotdl.io/v2",
            "Cookie": cookie
          },
          body: JSON.stringify({
            spotify_url: url
          })
        }
      )
      
      const Obj = {}

      const trackData = await trackRes.json();
      if (!trackData.spotify_id) {
        throw new Error("Gagal mengambil spotify_id");
      }
      
      Obj.title = trackData.data.name

      // STEP 2 — convert
      const convertRes = await fetch(
        "https://spotdl.io/convert",
        {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/json",
            "x-csrf-token": token,
            "Origin": "https://spotdl.io",
            "Referer": "https://spotdl.io/v2",
            "Cookie": cookie
          },
          body: JSON.stringify({
            urls: "https://open.spotify.com/track/" + trackData.spotify_id
          })
        }
      );

      const UrlMp3 = await convertRes.json();
      Obj.url = UrlMp3.url

      res.json({
        status: true,
        result: Obj
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};