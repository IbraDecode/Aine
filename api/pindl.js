const axios = require("axios");
const crypto = require("crypto");
const { URLSearchParams } = require("url");

/* =========================
   HELPER
========================= */
function generateToken(length = 64) {
  return crypto.randomBytes(length / 2).toString("hex");
}

function generateHash(url) {
  const base64 = Buffer.from(url).toString("base64");
  const rand = crypto.randomBytes(6).toString("hex");
  return `${base64}=${rand}YWlvLWRs`;
}

function parseResult(data) {
  const video = data.medias?.find(
    m => m.extension === "mp4" && m.videoAvailable
  );

  const thumb = data.medias?.find(m => m.extension === "jpg");

  if (!video) return null;

  return {
    title: data.title,
    duration: data.duration,
    thumbnail: thumb?.url || data.thumbnail,
    quality: video.quality,
    size: video.formattedSize,
    url: video.url
  };
}

/* =========================
   CORE FUNCTION
========================= */
async function pinterestDl(url) {
  if (!url) {
    throw new Error("Hayyaaa url tak ade, nak download ape?");
  }

  const token = generateToken();
  const hash = generateHash(url);

  const payload = new URLSearchParams({
    url,
    token,
    hash
  });

  const { data } = await axios({
    method: "POST",
    url: "https://pinvideo.org/wp-json/aio-dl/video-data/",
    headers: {
      "User-Agent": "Mozilla/5.0 (Android)",
      "Content-Type": "application/x-www-form-urlencoded",
      origin: "https://pinvideo.org",
      referer: "https://pinvideo.org/",
      accept: "*/*"
    },
    data: payload.toString()
  });

  if (!data || typeof data !== "object") {
    throw new Error("Amboyy response kosong pulak");
  }

  const parsed = parseResult(data);
  if (!parsed) {
    throw new Error("Waduh video nya tak jumpa, lesap entah ke mana");
  }

  return parsed;
}

/* =========================
   EXPORT ENDPOINT
========================= */
module.exports = {
  name: "Pinterest",
  desc: "Pinterest video downloader",
  category: "Downloader",
  path: "/download/pinterest?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    if (!url) {
      return res.json({
        status: false,
        error: "Url is required"
      });
    }

    try {
      const result = await pinterestDl(url);
      res.status(200).json({
        status: true,
        result
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};