function encodeEmoji(emoji) {
  return [...emoji].map(char => char.codePointAt(0).toString(16)).join('-');
}

module.exports = {
  name: "Emoji To Gif",
  desc: "Convert emoji to gif",
  category: "Tools",
  path: "/tools/emojitogif?emoji=",
  async run(req, res) {
    const { emoji } = req.query;

    if (!emoji) {
      return res.json({ status: false, error: 'Emoji is required' });
    }

    try {
      const code = encodeEmoji(emoji);
      const buffer = await getBuffer(`https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`);
      
      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length
      });
      res.end(buffer);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};