const axios = require("axios");

const tokens = [
    "e4e2f8b34124eea2c0d2ff724d1704a8f6e85d87ca4a7caeba240fba1e83327d",
    "1e51b47b5526318a1b091ce809351831c283ac3508c1cc058d19c7dc153a6b1f",
    "56a630611abe6d81e2d92a361be12527b566095eb80e9b645b699b2da4e744a0",
    "92c508311f91f557d67acd09ac3feaf9884c790cc69df2edbbe0432f9eb3a965",
    "1268a2225806ec952aefe8eb950687c9b3d336de719e4b3245c2be3150003d09",
    "abd44b8d6fe5f877a4d184e0df08e29370f2d49414853a75a5d6d46e758c84c7",
    "84b6ed6ca89973bb531906f2cca7c1251424a8cac49604180cbf87977df8f62e",
    "4c107ec4076a436a4de96a6d5c337896ba79c991685896d7cff242d8107343ad",
    "6bcf8c2e12fe0f14c21a62801b4ccb2573e211ede930dcff1943eeb20cf663d8",
    "04f74d31946dbab25f603e412686d25a50d6c2ceb4d7ee2d3c37bca1ee68f720",
    "e83a0190933eb8e48429fec6d64cf4587c6d7fe50c932c8b837f9c2ef2b2d67c",
    "9c0807ac50818cb10cb9c4d7d58f33e15285e7924b32aa2ab41129eb581b49ce",
    "56ab13daaca55ddd1d23d283065999ef205df6a21b7590dd214306ae8ada1739",
    "891bb0e6b6fdd0a218d15374898b230be150622c393aa40a35c44c76dfc2fb84",
    "251471094f0f614c8112489a4c24140198438d235864c6fde6b0552e9e170993"
];

let currentTokenIndex = 0;

/**
 * Execute reaction to WA channel post using rotating tokens
 */
async function reactToChannel(postUrl, emojis) {
    let attempts = 0;
    const maxAttempts = tokens.length;

    while (attempts < maxAttempts) {

        const apiKey = tokens[currentTokenIndex];

        try {
            const response = await axios({
                method: "POST",
                url: `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`,
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    'origin': 'https://asitha.top',
                    'referer': 'https://asitha.top/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139 Mobile Safari/537.36'
                },
                data: {
                    post_link: postUrl,
                    reacts: Array.isArray(emojis) ? emojis : [emojis]
                }
            });

            return {
                success: true,
                data: response.data
            };

        } catch (err) {
            const e = err.response?.data || err.message;

            // Token limit → pindah
            if (err.response?.status === 402 ||
                e?.message?.includes("limit") ||
                e?.message?.includes("Limit")) {
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                attempts++;
                continue;
            }

            // Error fatal → keluar
            return {
                success: false,
                error: e,
                status: err.response?.status || 500
            };
        }
    }

    return {
        success: false,
        error: "All tokens are limited",
        status: 402
    };
}

module.exports = {
  name: "React Channel WhatsApp",
  desc: "React emoji to WhatsApp Channel Post",
  category: "Tools",
  path: "/tools/react-channel?apikey=&postUrl=&emoji=",

  async run(req, res) {
    const { apikey, postUrl, emoji } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }

    if (!postUrl) {
      return res.json({ status: false, error: "postUrl is required" });
    }

    if (!emoji) {
      return res.json({ status: false, error: "emoji is required" });
    }

    try {
      const result = await reactToChannel(postUrl, emoji);

      if (!result.success) {
        return res.status(result.status).json({
          status: false,
          error: result.error
        });
      }

      res.json({
        status: true,
        data: result.data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};