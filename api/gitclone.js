const fetch = require("node-fetch");

async function gitClone(urls) {
  const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
  try {
    let [, user, repo] = urls.match(regex) || [];
    if (!user || !repo) throw new Error("Invalid GitHub URL format");

    repo = repo.replace(/\.git$/, '');
    const url = `https://api.github.com/repos/${user}/${repo}/zipball`;

    const headRes = await fetch(url, { method: 'HEAD' });
    const headers = headRes.headers;

    const filename = headers.get('content-disposition')?.match(/filename=(.+)/)?.[1] || `${repo}.zip`;
    const mimetype = headers.get('content-type') || 'application/zip';

    return {
      download: url,
      filename: filename,
      mimetype: mimetype
    };
  } catch (err) {
    throw err;
  }
}

module.exports = [
  {
    name: "Gitclone",
    desc: "Clone github repositori",
    category: "Downloader",
    path: "/download/github?apikey=&url=",
    async run(req, res) {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }
      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const results = await gitClone(url);
        res.status(200).json({
          status: true,
          result: results
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  }
];