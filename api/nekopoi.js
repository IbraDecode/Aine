const axios = require("axios");
const cheerio = require("cheerio");

async function fetchNekopoiV1(query) {
  const searchUrl = `https://nekopoi.care/search/${encodeURIComponent(query)}`;
  const { data: html } = await axios.get(searchUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/143.0.7499.35 Mobile Safari/537.36" }
  });
  const $ = cheerio.load(html);
  const results = [];

  $("div.result ul li").each((i, li) => {
    const el = $(li);
    const aTag = el.find("h2 > a");
    const title = aTag.text().trim();
    const link = aTag.attr("href");
    let duration = null;
    el.find("div.desc p").each((i, p) => {
      const pText = $(p).text();
      if (/Duration\s*:/i.test(pText) || /Durasi\s*:/i.test(pText)) {
        duration = pText.replace(/Duration\s*:\s*/i, "").replace(/Durasi\s*:\s*/i, "").trim();
        return false;
      }
    });
    results.push({ title, link, duration });
  });

  for (let item of results) {
    try {
      const { data: detailHtml } = await axios.get(item.link, {
        headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/143.0.7499.35 Mobile Safari/537.36" }
      });
      const $$ = cheerio.load(detailHtml);
      const streamIds = ["#stream3", "#stream2", "#stream1"];
      let videoSrc = null;
      for (const id of streamIds) {
        const iframe = $$(id + " iframe.vids");
        if (iframe.length) {
          videoSrc = iframe.attr("src");
          if (videoSrc) break;
        }
      }
      item.videoSrc = videoSrc || null;
    } catch (e) {
      item.videoSrc = null;
    }
  }

  return results;
}

module.exports = {
  name: "Nekopoi",
  desc: "Search videos from Nekopoi.care",
  category: "Search",
  path: "/search/nekopoi?apikey=&q=",
  async run(req, res) {
    const { apikey, q } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await fetchNekopoiV1(q);
      res.status(200).json({ status: true, result: results });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};