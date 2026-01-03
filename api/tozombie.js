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
// Product Serial Generator
// =====================
function generateProductSerial() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 10; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `browser_${Date.now()}${Math.floor(Math.random() * 1000)}_${suffix}`;
}

// =====================
// EZRemove Zombie AI
// =====================
async function ezRemoveZombieAI(buffer, filename = "image.jpg") {
  const productSerial = generateProductSerial();

  // === Create Job ===
  const form = new FormData();
  form.append('model_name', 'ezremove_3.0');
  form.append('target_images', buffer, {
    filename,
    contentType: 'image/jpeg'
  });
  form.append(
    'prompt',
    'Transform the person into a realistic zombie while preserving the original facial structure. Pale, decaying skin with visible veins and subtle cracks, sunken lifeless eyes with dark circles, slightly torn flesh on the cheeks and neck, dry cracked lips with minor blood stains. Maintain natural skin texture, realistic lighting and shadows. Photorealistic, ultra-detailed, cinematic, 4K quality. No cartoon, no illustration, no anime.'
  );
  form.append('ratio', 'match_input_image');

  const createJob = await fetch(
    'https://api.ezremove.ai/api/ez-remove/photo-editor/create-job',
    {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003)',
        'Accept': 'application/json, text/plain, */*',
        'product-serial': productSerial,
        'origin': 'https://ezremove.ai',
        'referer': 'https://ezremove.ai/'
      },
      body: form
    }
  ).then(r => r.json());

  if (!createJob?.result?.job_id) {
    throw new Error("Gagal membuat job");
  }

  const jobId = createJob.result.job_id;

  // === Polling Result ===
  let result;
  while (true) {
    result = await fetch(
      `https://api.ezremove.ai/api/ez-remove/photo-editor/get-job/${jobId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003)',
          'Accept': 'application/json, text/plain, */*',
          'product-serial': productSerial,
          'origin': 'https://ezremove.ai',
          'referer': 'https://ezremove.ai/'
        }
      }
    ).then(r => r.json());

    if (result?.result?.status > 1) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  // === Get Final Image ===
  const outputUrl = result?.result?.output?.[0];
  if (!outputUrl) throw new Error("Hasil image tidak ditemukan");

  const finalBuffer = await getBuffer(outputUrl);
  return finalBuffer;
}

// =====================
// EXPRESS ENDPOINT
// =====================
module.exports = [
{
  name: "To Zombie",
  desc: "Convert image to realistic zombie",
  category: "Tools",
  path: "/tools/tozombie?apikey=&url=",

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
      const image = await ezRemoveZombieAI(buffer, path.basename(url));

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": image.length
      });
      return res.end(image);

    } catch (e) {
      return res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
}
];