const cheerio = require("cheerio");
const axios = require("axios");

async function tiktok(query) {
  try {
    const encodedParams = new URLSearchParams();
    encodedParams.set("url", query);
    encodedParams.set("hd", "1");

    const response = await axios({
      method: "POST",
      url: "https://tikwm.com/api/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: "current_language=en",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
      },
      data: encodedParams,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}


const scrapeSavetik = async (tiktokUrl) => {
  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://savetik.co',
      'Referer': 'https://savetik.co/id/tiktok-mp3-downloader',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
      'X-Requested-With': 'XMLHttpRequest'
    }

    const data = new URLSearchParams()
    data.append('q', tiktokUrl)
    data.append('lang', 'id')

    const res = await axios.post('https://savetik.co/api/ajaxSearch', data, { headers })
    const $ = cheerio.load(res.data.data)

    const title = $('h3').text()
    const thumbnail = $('.thumbnail img').attr('src')
    const buttons = $('a.tik-button-dl')
    const results = {}

    // Deteksi apakah ini video atau photo
    const isPhoto = $('.photo-list .download-items__btn a').length > 0

    if (isPhoto) {
      const images = []
      $('.photo-list .download-items__btn a').each((_, el) => {
        const link = $(el).attr('href')
        if (link) images.push(link)
      })
      const audio = $('a').filter((_, el) => $(el).text().includes('Unduh MP3')).attr('href') || ''
      return {
        type: 'photo',
        title,
        thumbnail,
        audio,
        images
      }
    } else {
      buttons.each((_, el) => {
        const text = $(el).text().toLowerCase()
        const href = $(el).attr('href')
        if (text.includes('mp3')) results.mp3 = href
        else if (text.includes('hd')) results.video_hd = href
        else if (text.includes('mp4')) results.video_sd = href
      })
      return {
        type: 'video',
        title,
        thumbnail,
        ...results
      }
    }
  } catch (err) {
    console.error('❌ Gagal scraping:', err.message)
    return null
  }
}

module.exports = [
  {
    name: "Tiktok",
    desc: "Tiktok downloader",
    category: "Downloader",
    path: "/download/tiktok?apikey=&url=",
    async run(req, res) {
      const { url, apikey } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }
      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const results = await scrapeSavetik(url);
        res.status(200).json({
          status: true,
          result: results,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },

  {
    name: "Tiktok V2",
    desc: "Tiktok downloader v2",
    category: "Downloader",
    path: "/download/tiktok-v2?apikey=&url=",
    async run(req, res) {
      const { url, apikey } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }
      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const results = await tiktok(url);
        res.status(200).json({
          status: true,
          result: results,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
];