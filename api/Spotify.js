const axios = require("axios");

/* ===============================
   SPOTIFY OFFICIAL CONFIG
================================ */

// ⛔ SANGAT DISARANKAN pakai process.env
const CLIENT_ID = "bfcffccc6ed4441b965cd81b10ddb561";
const CLIENT_SECRET = "311427216ab64de1b3c0150ea43fd2c4";

let accessToken = null;
let tokenExpire = 0;

/**
 * Ambil / refresh token Spotify otomatis
 */
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpire) {
    return accessToken;
  }

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
    }
  );

  accessToken = res.data.access_token;
  tokenExpire = Date.now() + res.data.expires_in * 1000;

  return accessToken;
}

/**
 * ===============================
 * Spotify Search (OFFICIAL API)
 * ===============================
 */
async function spotifySearchV1(query, limit = 10) {
  try {
    const token = await getAccessToken();

    const res = await axios.get(
      "https://api.spotify.com/v1/search",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: query,
          type: "track",
          limit,
        },
      }
    );

    return res.data.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      album: track.album.name,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      spotify_url: track.external_urls.spotify,
      image: track.album.images[0]?.url
    }));
  } catch (e) {
    return { error: e.response?.data || e.message };
  }
}

/* ===============================
   SPOTIFY DOWNLOAD (UNCHANGED)
================================ */
async function spotifyDl(spotifyUrl) {
  return {
    download_url: `https://spotdown.org/api/direct-download?url=${spotifyUrl}`
  };
}

/* ===============================
   MODULE EXPORT (API ROUTES)
================================ */
module.exports = [
  {
    name: "Spotify",
    desc: "Spotify MP3 Downloader",
    category: "Downloader",
    path: "/download/spotify?apikey=&url=",
    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const result = await spotifyDl(url);
        res.status(200).json({
          status: true,
          result
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          error: error.message
        });
      }
    },
  },
  {
    name: "Spotify Search",
    desc: "Search tracks from Spotify (Official API)",
    category: "Search",
    path: "/search/spotify?apikey=&q=",
    async run(req, res) {
      const { apikey, q } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!q) {
        return res.json({ status: false, error: "Query is required" });
      }

      try {
        const results = await spotifySearchV1(q);
        res.status(200).json({
          status: true,
          result: results
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          error: error.message
        });
      }
    }
  }
];