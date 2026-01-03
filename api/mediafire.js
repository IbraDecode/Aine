const fetch = require("node-fetch");

// ============================
//     FUNCTION MEDIAFIRE DL
// ============================
const mfdl = async function (mfUrl) {
    const r = await fetch(mfUrl, {
        headers: {
            "accept-encoding": "gzip, deflate, br, zstd"
        }
    });

    if (!r.ok) throw Error(`${r.status} ${r.statusText}`);

    const html = await r.text();
    const url = html.match(/href="(.+?)" +id="downloadButton"/)?.[1];
    if (!url) throw Error(`Gagal menemukan match url`);

    const ft_m = html.match(/class="filetype"><span>(.+?)<(?:.+?) \((.+?)\)/);
    const fileType = `${ft_m?.[1] || '(no ext)'} ${ft_m?.[2] || '(no ext)'}`;

    const d_m = html.match(/<div class="description">(.+?)<\/div>/s)?.[1];
    const titleExt = d_m?.match(/subheading">(.+?)</)?.[1] || '(no title extension)';
    const descriptionExt = d_m?.match(/<p>(.+?)<\/p>/)?.[1] || '(no about extension)';

    const fileSize = html.match(/File size: <span>(.+?)<\/span>/)?.[1] || '(no file size)';
    const uploaded = html.match(/Uploaded: <span>(.+?)<\/span>/)?.[1] || '(no date)';
    const fileName = html.match(/class="filename">(.+?)<\/div>/)?.[1] || '(no file name)';

    return { fileName, fileSize, url, uploaded, fileType, titleExt, descriptionExt };
};


// ============================
//     ENDPOINT EXPRESS.JS
// ============================
module.exports = [
  {
    name: "Mediafire",
    desc: "Mediafire file downloader",
    category: "Downloader",
    path: "/download/mediafire?apikey=&url=",
    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const result = await mfdl(url);
        res.status(200).json({
          status: true,
          result,
        });
      } catch (err) {
        res.status(500).json({
          status: false,
          error: err.message,
        });
      }
    },
  },
];