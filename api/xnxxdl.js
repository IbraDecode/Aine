const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

// ============================
//      FUNCTION XNXX-DL (Dirpy Version)
// ============================
async function xnxxDl(url) {
  try {
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'upgrade-insecure-requests': '1',
        'dnt': '1',
        'x-requested-with': 'mark.via.gp',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    };

    // Jika URL bukan Dirpy, otomatis redirect ke Dirpy
    let dirpyUrl = url.includes('dirpy.com') ? url : `https://dirpy.com/studio?url=${encodeURIComponent(url)}`;

    const res = await fetch(dirpyUrl, options);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Ambil title dari panel-title
    let title = '';
    $('div.panel.panel-default').each((i, el) => {
      if ($(el).find('video#media-player').length > 0) {
        title = $(el).find('h2.panel-title').text().trim();
      }
    });

    // Ambil URL video CDN
    const videoUrl = $('#media-source').attr('src');

    return { title, videoUrl };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================
//      FUNCTION XNXX SEARCH (Tetap sama)
// ============================
async function xnxxSearch(query) {
  const axios = require("axios");
  const response = await axios.get(
    `https://www.xnxx.com/search/${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15)",
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.google.com/"
      }
    }
  );

  const $ = cheerio.load(response.data);
  let hasil = [];

  $(".thumb-block").each((i, el) => {
    const block = $(el);
    const a = block.find(".thumb-under p a");
    const title = a.attr("title") || a.text().trim();
    const href = a.attr("href");
    const link = href ? "https://www.xnxx.com" + href : null;

    let views = block.find(".metadata .right").first().text().trim();
    views = views.replace(/(\d+%)/, "").trim();

    let durationMatch = block.find(".metadata").text().match(/(\d+min)/);
    const duration = durationMatch ? durationMatch[1] : null;

    let quality = block.find(".video-hd").text().trim() || null;

    if (title && link) {
      hasil.push({ title, link, duration, views, quality });
    }
  });

  return hasil;
}

// ============================
//      ENDPOINT EXPRESS
// ============================
module.exports = [
  {
    name: "XNXX",
    desc: "Download video xnxx 18+ via Dirpy",
    category: "Downloader",
    path: "/download/xnxx?apikey=&url=",
    async run(req, res) {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!url) return res.json({ status: false, error: "Url is required" });

      try {
        const result = await xnxxDl(url);
        return res.status(200).json({ status: true, result });
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
      }
    }
  },
  {
    name: "XNXX Search",
    desc: "Search video xnxx 18+",
    category: "Search",
    path: "/search/xnxx?apikey=&query=",
    async run(req, res) {
      const { apikey, query } = req.query;
      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!query) return res.json({ status: false, error: "Query is required" });

      try {
        const result = await xnxxSearch(query);
        return res.status(200).json({ status: true, result });
      } catch (err) {
        return res.status(500).json({ status: false, error: err.message });
      }
    }
  }
];