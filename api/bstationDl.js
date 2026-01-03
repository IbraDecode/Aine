const axios = require("axios");
const { URLSearchParams } = require("url");

/* =========================
   CORE FUNCTION
========================= */
async function bstationDl(url) {
  if (!url) {
    throw new Error("Hayyaaa url tak ade, nak download ape?");
  }

  const welcomeURL =
    "https://www.tubeninja.net/id/welcome?url=" + encodeURIComponent(url);

  // =========================
  // 1️⃣ GET HTML (CSRF + COOKIE)
  // =========================
  const getPage = await axios.get(welcomeURL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html"
    }
  });

  const html = getPage.data;

  // CSRF dari HTML
  const csrfMatch = html.match(/csrfmiddlewaretoken'\s*:\s*'([^']+)'/);
  if (!csrfMatch) throw new Error("CSRF HTML tidak ditemukan");
  const csrfHTML = csrfMatch[1];

  // Cookie csrftoken
  const cookies = getPage.headers["set-cookie"] || [];
  const csrfCookie = cookies
    .find(c => c.startsWith("csrftoken="))
    ?.match(/csrftoken=([^;]+)/)?.[1];

  if (!csrfCookie) throw new Error("Cookie csrftoken tidak ditemukan");

  // =========================
  // 2️⃣ POST /get
  // =========================
  const payload = new URLSearchParams({
    url,
    csrfmiddlewaretoken: csrfHTML
  });

  const post = await axios.post(
    "https://www.tubeninja.net/get",
    payload.toString(),
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Android)",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Origin: "https://www.tubeninja.net",
        Referer: welcomeURL,
        Cookie: `csrftoken=${csrfCookie}`
      }
    }
  );

  const resultHTML = post.data;

  // =========================
  // 3️⃣ PARSE RESULT
  // =========================
  const result = {
    title: null,
    thumbnail: null,
    mp4: []
  };

  const titleMatch = resultHTML.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (titleMatch) result.title = titleMatch[1].trim();

  const thumbMatch = resultHTML.match(
    /<img src="([^"]+)" class="img-fluid img-rounded thumbnail"/
  );
  if (thumbMatch) result.thumbnail = thumbMatch[1];

  const mp4Regex =
    /<a[^>]+href="([^"]+)"[^>]*download[^>]*>[\s\S]*?<small>([^<]+)<\/small>/gi;

  let m;
  while ((m = mp4Regex.exec(resultHTML)) !== null) {
    result.mp4.push({
      url: m[1].replace(/&amp;/g, "&"),
      size: m[2].trim()
    });
  }

  if (!result.mp4.length) {
    throw new Error("Video tak jumpa, mungkin link tak supported");
  }

  return result;
}

/* =========================
   EXPORT ENDPOINT
========================= */
module.exports = {
  name: "Bstation",
  desc: "Bilibili / Bstation video downloader",
  category: "Downloader",
  path: "/download/bstation?apikey=&url=",

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
      const result = await bstationDl(url);
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