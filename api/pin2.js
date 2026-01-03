const axios = require("axios");
const cheerio = require("cheerio");

/* =========================
   CORE FUNCTION
========================= */
async function pinterestSearch(query) {
  try {
    const url = `https://id.pinterest.com/search/videos/?q=${encodeURIComponent(
      query
    )}&rs=content_type_filter`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    const $ = cheerio.load(data);
    const hasil = [];
    const seen = new Set();

    $("[data-test-pin-id]").each((_, el) => {
      const pinId = $(el).attr("data-test-pin-id");
      if (!pinId) return;

      const link = `https://id.pinterest.com/pin/${pinId}/`;
      if (seen.has(link)) return;

      seen.add(link);
      hasil.push(link);
    });

    return hasil;
  } catch (e) {
    throw new Error("Gagal mengambil data Pinterest");
  }
}

/* =========================
   EXPORT ENDPOINT
========================= */
module.exports = {
  name: "Pinterest Vid Search",
  desc: "Search video on Pinterest",
  category: "Search",
  path: "/search/pinterestvid?apikey=&q=",

  async run(req, res) {
    const { apikey, q } = req.query;

    if (!global.apikey.includes(apikey))
      return res.json({
        status: false,
        error: "Apikey invalid"
      });

    if (!q)
      return res.json({
        status: false,
        error: "Query is required"
      });

    try {
      const results = await pinterestSearch(q);
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
};