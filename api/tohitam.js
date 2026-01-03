const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

// =====================
// Get buffer from URL
// =====================
async function getBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

// =====================
// To Hitam (Righthair AI)
// =====================
async function toHitamRighthair(imageUrl, skinTone = "deep_brown") {
  // === Ambil image buffer ===
  const buffer = await getBuffer(imageUrl);

  // === Upload Image ===
  const form = new FormData();
  form.append('image', buffer, {
    filename: path.basename(imageUrl),
    contentType: 'image/jpeg'
  });

  const upload = await fetch('https://api.righthair.ai/api/v2/image/upload', {
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15)',
      'Accept': 'application/json',
      'origin': 'https://righthair.ai',
      'referer': 'https://righthair.ai/',
      'x-product-id': '1',
      'x-requested-with': 'mark.via.gp'
    },
    body: form
  }).then(r => r.json());

  if (upload.code !== 200 || !upload.data?.img_name) {
    throw new Error("Upload image gagal");
  }

  const imgName = upload.data.img_name;

  // === Create Skin Tone Job ===
  const createJob = await fetch(
    'https://api.righthair.ai/api/v2/skin-tone-filter/create',
    {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 15)',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'origin': 'https://righthair.ai',
        'referer': 'https://righthair.ai/',
        'x-product-id': '1',
        'x-requested-with': 'mark.via.gp'
      },
      body: JSON.stringify({
        skin_tone_type: skinTone,
        img_name: imgName
      })
    }
  ).then(r => r.json());

  if (createJob.code !== 200 || !createJob.data?.job_id) {
    throw new Error("Gagal membuat job skin tone");
  }

  const jobId = createJob.data.job_id;

  // === Polling Result ===
  let result;
  while (true) {
    result = await fetch(
      `https://api.righthair.ai/api/v2/task/result?job_id=${jobId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 15)',
          'Accept': 'application/json',
          'origin': 'https://righthair.ai',
          'referer': 'https://righthair.ai/',
          'x-product-id': '1',
          'x-requested-with': 'mark.via.gp'
        }
      }
    ).then(r => r.json());

    if (result?.data?.status === "success") break;
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!result?.data?.task_result) {
    throw new Error("Result image tidak ditemukan");
  }

  // ✅ RETURN URL SAJA
  return result.data.task_result;
}


module.exports = [
{
  name: "To Hitam",
  desc: "Convert image to kulit hitam",
  category: "Tools",
  path: "/tools/tohitam?apikey=&url=",

  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    if (!url) {
      return res.json({
        status: false,
        error: "Masukkan url image"
      });
    }

    try {
      const resultUrl = await toHitamRighthair(url);

      return res.json({
        status: true,
        result: resultUrl
      });

    } catch (e) {
      return res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
}
];