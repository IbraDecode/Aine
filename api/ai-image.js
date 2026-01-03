const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { URLSearchParams } = require('url');

module.exports = {
  name: "Image Generator",
  desc: "Generate AI Image from prompt",
  category: "Openai",
  path: "/ai/image-generator?apikey=&prompt=",
  async run(req, res) {
    const { apikey, prompt } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!prompt) {
      return res.json({ status: false, error: "Prompt tidak boleh kosong" });
    }

    try {
      /* 1. Ambil nonce dari HTML */
      const html = await fetch(
        'https://flatai.org/ai-image-generator-free-no-signup/',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html'
          }
        }
      ).then(r => r.text());

      const nonceMatch = html.match(/ai_generate_image_nonce":"([a-f0-9]+)"/i);
      if (!nonceMatch) {
        return res.json({ status: false, error: "Nonce tidak ditemukan" });
      }

      const nonce = nonceMatch[1];

      /* 2. Request generate image */
      const data = new URLSearchParams();
      data.append('action', 'ai_generate_image');
      data.append('nonce', nonce);
      data.append('prompt', prompt);
      data.append('aspect_ratio', '1:1');
      data.append('seed', Date.now().toString());
      data.append('style_model', 'flataipro');

      const response = await fetch(
        'https://flatai.org/wp-admin/admin-ajax.php',
        {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest',
            'origin': 'https://flatai.org',
            'referer': 'https://flatai.org/ai-image-generator-free-no-signup/'
          },
          body: data.toString()
        }
      );

      const result = await response.json();

      if (!result || result.success === false) {
        return res.json({
          status: false,
          error: "Gagal generate image"
        });
      }

      res.json({
        status: true,
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};