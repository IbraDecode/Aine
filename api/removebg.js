const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const axios = require("axios");
const fs = require("fs");

/* Ambil buffer dari url */
async function getBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

/* Fungsi removeBg, jangan ubah header sama sekali */
async function removeBg(buffer, filename = "image.jpg") {
  const data = new FormData();

  // Bisa pakai buffer langsung atau fs.readFileSync
  data.append('image', buffer, { filename });

  data.append('format', 'png');
  data.append('model', 'v1');

  const options = {
    method: 'POST',
    headers: {
      ...data.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'x-client-version': 'web:pixelcut.ai:b8e5154f',
      'x-locale': 'id',
      'origin': 'https://www.pixelcut.ai',
      'x-requested-with': 'mark.via.gp',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://www.pixelcut.ai/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i'
    },
    body: data,
  };

  return fetch('https://api2.pixelcut.app/image/matte/v1', options)
    .then(res => res.arrayBuffer())
    .then(buf => Buffer.from(buf))
    .catch(err => ({ error: err.message }));
}

module.exports = {
  name: "Remove BG",
  desc: "Remove background image",
  category: "Tools",
  path: "/tools/removebg?apikey=&url=",

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
      const image = await removeBg(buffer, "image.jpg");

      if (!image || image.error) {
        return res.json({ status: false, error: image.error || "Gagal remove background" });
      }

      // Send image langsung
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": image.length
      });
      
      return res.end(image);

    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};