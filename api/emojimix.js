const fetch = require("node-fetch");

module.exports = {
  name: "Emoji Mix",
  desc: "Mixed emoji generator",
  category: "Tools",
  path: "/tools/emojimix?apikey=&emoji1=&emoji2=",
  async run(req, res) {
    const { apikey, emoji1, emoji2 } = req.query;
    
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!emoji1 || !emoji2) {
      return res.json({ status: false, error: 'Emoji1 dan Emoji2 wajib diisi' });
    }

    try {
      const json = await fetch(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`)
        .then(res => res.json());

      const url = json?.results?.[0]?.url;
      if (!url) throw new Error("Gagal mendapatkan hasil emoji mix");

      const image = await getBuffer(url);
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