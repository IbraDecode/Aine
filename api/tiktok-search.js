const axios = require("axios");
const FormData = require("form-data");

async function ttSearch(query) {
  try {
    let d = new FormData();
    d.append("keywords", query);
    d.append("count", 15);
    d.append("cursor", 0);
    d.append("web", 1);
    d.append("hd", 1);

    const { data } = await axios.post("https://tikwm.com/api/feed/search", d, {
      headers: { ...d.getHeaders() }
    });

    const baseURL = "https://tikwm.com";
    const videos = data.data.videos.map(video => ({
      ...video,
      play: baseURL + video.play,
      wmplay: baseURL + video.wmplay,
      music: baseURL + video.music,
      cover: baseURL + video.cover,
      avatar: baseURL + video.avatar
    }));

    return videos;
  } catch (e) {
    return e;
  }
}

module.exports = {
  name: "Tiktok Search",
  desc: "Search video tiktok",
  category: "Search",
  path: "/search/tiktok?q=",
  async run(req, res) {
    const { q } = req.query;
    if (!q) return res.json({ status: false, error: "Query is required" });

    try {
      const results = await ttSearch(q);
      res.status(200).json({
        status: true,
        result: results
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};