const axios = require('axios');
const cheerio = require('cheerio');
const vm = require('vm');
const { URLSearchParams } = require('url');

async function savegram(url) {
  if (!url) throw new Error('Hayyaaa Yang Bener Laa Url tak ade, Nak download ape ha?');

  const payload = new URLSearchParams({
    url,
    action: 'post',
    lang: 'id',
  });

  const { data: obfuscatedScript } = await axios({
    method: 'post',
    url: 'https://savegram.info/action.php',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://savegram.info/id',
    },
    data: payload.toString(),
  });

  if (typeof obfuscatedScript !== 'string') throw new Error('Amboy Aneh kali lah, Script tak ade');

  let capturedHtml = '';
  const context = {
    window: { location: { hostname: 'savegram.info' } },
    pushAlert: () => {},
    gtag: () => {},
    document: {
      getElementById: (id) => {
        if (id === 'div_download') {
          return {
            set innerHTML(html) {
              capturedHtml = html;
            },
          };
        }
        return { style: {}, remove: () => {} };
      },
      querySelector: () => ({ classList: { remove: () => {} } }),
    },
  };

  vm.createContext(context);
  const script = new vm.Script(obfuscatedScript);
  script.runInContext(context);

  if (!capturedHtml) throw new Error('Hayaa, takde html nya maa:)');

  const $ = cheerio.load(capturedHtml);
  const out = [];

  $('.download-items').each((_, el) => {
    const item = $(el);
    const thumbnail = item.find('img').attr('src');
    const btn = item.find('.download-items__btn a');
    const url_download = btn.attr('href');
    const kualitas = btn.text().trim() || 'standar kaya muka lu';

    if (url_download) out.push({ thumbnail, kualitas, url_download });
  });

  if (!out.length) throw new Error('Waduh url download nya takde lah, jatuh kat jalan kek nya');

  return out;
}

module.exports = {
  name: "Instagram",
  desc: "Instagram downloader",
  category: "Downloader",
  path: "/download/instagram?url=",
  async run(req, res) {
    const { url } = req.query;

    if (!url) {
      return res.json({ status: false, error: "Url is required" });
    }

    try {
      const resu = await savegram(url);
      let dat = resu
      res.status(200).json({
        status: true,
        result: dat
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};