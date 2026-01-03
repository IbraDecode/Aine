const cheerio = require("cheerio");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function sfileScrape(url) {
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Android 15)',
      'Accept': 'text/html'
    }
  };

  const html = await fetch(url, options).then(r => r.text());
  const $ = cheerio.load(html);

  // TITLE LANGSUNG DARI <title>
  let title = $("title").text().trim() || null;

  // MIME TYPE
  const mimetype =
    $("span.text-sm.text-slate-600").first().text().trim() || null;

  // DOWNLOAD URL
  const download_url =
    $("#download").attr("href") ||
    $("a#download").attr("href") ||
    null;

  return { title, mimetype, download_url };
}

module.exports = {
  name: "Sfile Downloader",
  desc: "Sfile.mobi download URL",
  category: "Downloader",
  path: "/download/sfile?apikey=&url=",
  async run(req, res) {
    try {
      const { apikey, url } = req.query;
      
      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      if (!url)
        return res.json({ status: false, error: "Url is required" });

      const result = await sfileScrape(url);

      if (!result.download_url)
        return res.json({ status: false, error: "Failed to extract download URL" });

      res.status(200).json({
        status: true,
        result
      });

    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};