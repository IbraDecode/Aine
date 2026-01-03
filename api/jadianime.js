const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const axios = require('axios');
const path = require('path');

/* ======================
   Get buffer from URL
====================== */
async function getBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

/* =====================================
   Transform Buffer → Anime / Ghibli
===================================== */
async function transformBufferToAnime(buffer, style = "anime") {
  const base64Image = buffer.toString('base64');

  let prompt =
    "Transform this image into high quality Japanese anime art style with clean lineart, vibrant colors, detailed eyes, and soft shading";

  if (style === "ghibli") {
    prompt =
      "Transform this image into beautiful Studio Ghibli anime art style with soft colors, dreamy atmosphere, and hand-painted aesthetic";
  }

  const data = JSON.stringify({
    image: base64Image,
    prompt,
    model: "gpt-image-1",
    n: 1,
    size: "1024x1024",
    quality: "low"
  });

  const options = {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/json',
      'x-device-uuid': 'd49c3485-a7af-4c3d-bb05-dbc7d9a03556',
      'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'x-device-language': 'en',
      'x-device-platform': 'web',
      'x-device-version': '1.0.44',
      'origin': 'https://overchat.ai',
      'x-requested-with': 'mark.via.gp',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://overchat.ai/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i'
    },
    body: data
  };

  const response = await fetch(
    'https://ghibli-proxy.netlify.app/.netlify/functions/ghibli-proxy',
    options
  );
  const result = await response.json();

  if (!result.success || !result.data || !result.data.length) {
    throw new Error("Response tidak valid dari Anime API");
  }

  return Buffer.from(result.data[0].b64_json, 'base64');
}

/* ======================
   EXPORT ENDPOINTS
====================== */
module.exports = [
  {
    name: "Jadi Anime",
    desc: "Convert to Anime Style",
    category: "Tools",
    path: "/tools/jadianime?apikey=&url=",

    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Masukkan url image" });
      }

      try {
        const buffer = await getBuffer(url);
        const image = await transformBufferToAnime(buffer, "anime");

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": image.length
        });
        return res.end(image);

      } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
      }
    }
  },
  {
    name: "To Ghibli",
    desc: "Convert to Ghibli Style",
    category: "Tools",
    path: "/tools/toghibli?apikey=&url=",

    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Masukkan url image" });
      }

      try {
        const buffer = await getBuffer(url);
        const image = await transformBufferToAnime(buffer, "ghibli");

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": image.length
        });
        return res.end(image);

      } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
      }
    }
  }
];