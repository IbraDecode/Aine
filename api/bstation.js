const axios = require("axios");
const cheerio = require("cheerio");

async function bsSearch(query) {
  try {
    const url = `https://www.bilibili.tv/id/search-result?q=${encodeURIComponent(query)}`;

    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(data);
    const hasil = [];

    $(".section__list__item").each((i, el) => {
      const root = $(el);

      // Ambil link video
      let href = root.find("a.bstar-video-card__cover-link").attr("href");
      if (!href) return;
      if (!href.includes("/id/video/")) return;

      href = href.replace(/^\/\//, "https://").replace("bstar_from=bstar-web.homepage.recommend.all", ""); // //www.bilibili.tv → https://www.bilibili.tv

      // Ambil title (highlight text)
      let title = "";
      root.find(".highlights i").each((x, node) => {
        title += $(node).text();
      });
      title = title.trim();

      // Ambil views
      let views = root.find(".bstar-video-card__desc").text().trim();
      views = views.replace("· ", ""); // buang bullet

      hasil.push({
        link: href,
        title: title || null,
        views: views || null
      });
    });

    return hasil;
  } catch (e) {
    return e;
  }
}


module.exports = {
  name: "Bstation Search",
  desc: "Search video on BiliBili/BStation",
  category: "Search",
  path: "/search/bstation?apikey=&q=",

  async run(req, res) {
    const { apikey, q } = req.query;

    if (!global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!q) return res.json({ status: false, error: "Query is required" });

    try {
      const results = await bsSearch(q);
      res.status(200).json({
        status: true,
        result: results
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};