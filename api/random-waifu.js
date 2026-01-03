module.exports = {
  name: "Waifu",
  desc: "Random waifu beautiful",
  category: "Random",
  path: "/random/waifu?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    try {
      const data = await fetchJson(`https://api.waifu.pics/sfw/waifu`);
      const image = await getBuffer(data.url);

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