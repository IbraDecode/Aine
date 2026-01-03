module.exports = {
  name: "Brat",
  desc: "Brat text generator",
  category: "Imagecreator",
  path: "/imagecreator/brat?text=",
  async run(req, res) {
    const { text } = req.query;
    if (!text) return res.json({ status: false, error: 'Missing text' });

    const buffer = await getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=false&delay=500`);
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}