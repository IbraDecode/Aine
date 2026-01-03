module.exports = {
  name: "Bratvid", 
  desc: "Brat video generator", 
  category: "Imagecreator", 
  path: "/imagecreator/bratvid?apikey=&text=",

  async run(req, res) {
    try {
      const { apikey, text } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' });
      }

      if (!text) {
        return res.json({ status: false, error: 'Text parameter is required' });
      }

      const buffer = await getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=true&delay=500`);

      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
      
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  }
};