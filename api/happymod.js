const axios = require("axios");
const cheerio = require("cheerio");
const { URLSearchParams } = require("url");


async function happymodSearch(query) {
  try {
    const data = new URLSearchParams();
    data.append("q", query);

    const res = await axios.post(
      "https://id.happymod.cloud/search.html",
      data.toString(),
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 15; Mobile Safari/537.36)",
          "Accept": "text/html,application/xhtml+xml",
          "Content-Type": "application/x-www-form-urlencoded",
          "Origin": "https://id.happymod.cloud",
          "Referer": "https://id.happymod.cloud/search.html"
        }
      }
    );

    const $ = cheerio.load(res.data);
    const results = [];

    $("li.list-item a.list-box").each((_, el) => {
      const title =
        $(el).find(".list-info-title").text().trim() ||
        $(el).attr("title");

      const href = $(el).attr("href");
      const link = href
        ? "https://id.happymod.cloud" + href + "download.html"
        : null;

      const icon =
        $(el).find(".list-icon img").attr("data-src") ||
        $(el).find(".list-icon img").attr("src");

      // ambil size MB
      let size = null;
      $(el)
        .find(".list-info-text")
        .first()
        .find("span")
        .each((i, s) => {
          const text = $(s).text();
          if (text.includes("MB")) size = text;
        });

      if (title && link) {
        results.push({
          title,
          size,
          icon,
          link
        });
      }
    });

    return results;
  } catch (e) {
    return { error: e.message };
  }
}


module.exports = {
  name: "HappyMod",
  desc: "Search app/game from HappyMod",
  category: "Search",
  path: "/search/happymod?apikey=&q=",

  async run(req, res) {
    const { apikey, q } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    if (!q) {
      return res.json({
        status: false,
        error: "Query is required"
      });
    }

    try {
      const result = await happymodSearch(q);

      if (!Array.isArray(result)) {
        return res.json({
          status: false,
          error: result.error
        });
      }

      res.status(200).json({
        status: true,
        total: result.length,
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