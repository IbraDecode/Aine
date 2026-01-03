module.exports = {
  name: "NSFW",
  desc: "Random nsfw anime 18+",
  category: "Random",
  path: "/random/nsfw?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    try {
      const types = ["blowjob", "neko", "trap", "waifu"];
      const selected = types[Math.floor(Math.random() * types.length)];
      const json = await fetchJson(`https://api.waifu.pics/nsfw/${selected}`);
      const image = await getBuffer(json.url);

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': image.length
      });
      res.end(image);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};