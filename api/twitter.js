const axios = require("axios");
const cheerio = require("cheerio");
const { URLSearchParams } = require("url");

/* =========================
   HELPER
========================= */
function generateTT(length = 32) {
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function extractVideo($) {
  // 1️⃣ HD
  let url = $("a.quality-best").attr("data-directurl");
  if (url) return { quality: "HD", url };

  // 2️⃣ 480p
  $("a.download-btn").each((_, el) => {
    const text = $(el).text();
    const direct = $(el).attr("data-directurl") || $(el).attr("href");
    if (!url && text.includes("480")) url = direct;
  });
  if (url) return { quality: "480p", url };

  // 3️⃣ 320p
  $("a.download-btn").each((_, el) => {
    const text = $(el).text();
    const direct = $(el).attr("data-directurl") || $(el).attr("href");
    if (!url && text.includes("320")) url = direct;
  });
  if (url) return { quality: "320p", url };

  // 4️⃣ fallback apa aja
  $("a.download-btn").each((_, el) => {
    const direct = $(el).attr("data-directurl") || $(el).attr("href");
    if (!url && direct && direct.startsWith("http")) url = direct;
  });

  return url ? { quality: "unknown", url } : null;
}

/* =========================
   CORE FUNCTION
========================= */
async function ssstwitter(url) {
  if (!url) {
    throw new Error("Hayyaaa url tak ade, nak download ape?");
  }

  const tt = generateTT();
  const ts = Math.floor(Date.now() / 1000);

  const payload = new URLSearchParams({
    id: url,
    locale: "id",
    tt,
    ts,
    source: "form"
  });

  const { data: html } = await axios({
    method: "POST",
    url: "https://ssstwitter.com/id",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Android)",
      origin: "https://ssstwitter.com",
      referer: "https://ssstwitter.com/id",
      "hx-request": "true",
      "hx-target": "target"
    },
    data: payload.toString()
  });

  if (typeof html !== "string") {
    throw new Error("Amboyy HTML tak keluar pulak");
  }

  const $ = cheerio.load(html);
  const video = extractVideo($);

  if (!video) {
    throw new Error("Waduh link video nya tak jumpa, jatuh laut kek nya");
  }

  return {
    quality: video.quality,
    url: video.url
  };
}

/* =========================
   EXPORT ENDPOINT
========================= */
module.exports = {
  name: "Twitter",
  desc: "Twitter / X video downloader",
  category: "Downloader",
  path: "/download/twitter?apikey=&url=",

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
      const result = await ssstwitter(url);
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