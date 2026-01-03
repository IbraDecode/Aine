const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const axios = require("axios");
const fs = require("fs");

/**
 * Upscale pakai buffer
 * (INI TIDAK DIUBAH SAMA SEKALI)
 */
async function upscaleImg(buffer, filename = "image.jpg") {
  const data = new FormData();
  data.append('original_image_file', buffer, filename);

  const options = {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'sec-ch-ua-platform': '"Android"',
      'authorization': '',
      'timezone': 'Asia/Jakarta',
      'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'product-serial': '0a78953065c51e7532fbb98019e2233b',
      'origin': 'https://imgupscaler.ai',
      'x-requested-with': 'mark.via.gp',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://imgupscaler.ai/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i',
      ...data.getHeaders()
    },
    body: data
  };

  const a = await fetch(
    'https://api.imgupscaler.ai/api/image-upscaler/v2/upscale/create-job',
    options
  )
    .then(r => r.json())
    .catch(err => ({ error: err.message }));

  if (!a || !a.result || !a.result.job_id) return a;

  const options1 = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'product-serial',
      'origin': 'https://imgupscaler.ai',
      'sec-fetch-mode': 'cors',
      'x-requested-with': 'mark.via.gp',
      'sec-fetch-site': 'same-site',
      'sec-fetch-dest': 'empty',
      'referer': 'https://imgupscaler.ai/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'priority': 'u=1, i'
    }
  };
  
  const jobid = a.result.job_id

  let b = await fetch(
    `https://api.imgupscaler.ai/api/image-upscaler/v1/universal_upscale/get-job/${jobid}`,
    options1
  )
    .then(r => r.json())
    .catch(err => ({ error: err.message }));
    
  while (!b?.result?.output_url) {
  b = await fetch(
    `https://api.imgupscaler.ai/api/image-upscaler/v1/universal_upscale/get-job/${jobid}`,
    options1
  )
    .then(r => r.json())
    .catch(err => ({ error: err.message }));
  }

  return b.result;
}

/* ambil buffer dari URL */
async function getBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

module.exports = {
  name: "Upscaler",
  desc: "Upscale gambar via URL",
  category: "Tools",
  path: "/tools/upscale?apikey=&url=",

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
      const result = await upscaleImg(buffer, "image.jpg");

      res.json({
        status: true,
        result: result
      });

    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};