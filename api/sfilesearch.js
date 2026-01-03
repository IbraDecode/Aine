const axios = require("axios");
const cheerio = require("cheerio");

async function sfileSearchV1(query) {
  try {
    const url = `https://sfile.mobi/search.php?q=${encodeURIComponent(query)}&search=Search`;

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html"
      }
    });

    const $ = cheerio.load(html);
    let results = [];

    $(".list").each((i, el) => {
      const a = $(el).find("a");
      const info = $(el).find(".file-info").text().trim();

      if (!a.length || !info) return;

      const sizeMatch = info.match(/\((.*?)\)/);
      const downloadsMatch = info.match(/-\s*(\d+)\s*downloads/);

      results.push({
        title: a.text().trim(),
        link: a.attr("href"),
        size: sizeMatch ? sizeMatch[1] : null,
        downloads: downloadsMatch ? parseInt(downloadsMatch[1]) : null
      });
    });

    return results;
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = {
  name: "Sfile Search",
  desc: "Search files from Sfile.mobi",
  category: "Search",
  path: "/search/sfile?apikey=&q=",
  async run(req, res) {
    const { apikey, q } = req.query;

    // Apikey invalid
    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    // Query kosong
    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await sfileSearchV1(q);
      res.status(200).json({
        status: true,
        result: results
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};