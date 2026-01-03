const axios = require('axios');
const https = require('https');
const qs = require('qs');

async function pinterestV1(query) {
  const agent = new https.Agent({ keepAlive: true })
  try {
    const home = await axios.get('https://www.pinterest.com/', {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    })
    const raw = home.headers['set-cookie'] || []
    const cookies = raw.map(c => c.split(';')[0]).join('; ')
    const csrf = (raw.find(c => c.startsWith('csrftoken=')) || '')
      .split('=')[1]?.split(';')[0] || ''

    const source_url = `/search/pins/?q=${encodeURIComponent(query)}`
    const data = {
      options: { query, field_set_key: 'react_grid_pin', is_prefetch: false, page_size: 25 },
      context: {}
    }
    const body = qs.stringify({ source_url, data: JSON.stringify(data) })

    const res = await axios.post(
      'https://www.pinterest.com/resource/BaseSearchResource/get/',
      body,
      {
        httpsAgent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-CSRFToken': csrf,
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'https://www.pinterest.com',
          'Referer': `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
          'Cookie': cookies
        }
      }
    )

    const pins = res.data.resource_response.data.results
      .slice(0, 25)
      .map(p => ({
        link: `https://www.pinterest.com/pin/${p.id}/`,
        directLink: p.images?.orig?.url || p.images?.['236x']?.url
      }))
    return pins

  } catch (e) {
    return { error: e.message }
  }
}

module.exports = {
  name: "Pinterest",
  desc: "Search pinterest image",
  category: "Search",
  path: "/search/pinterest?q=",
  async run(req, res) {
    const { q } = req.query;

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await pinterestV1(q);
      const final = results.map(e => e.directLink)
      res.status(200).json({
        status: true,
        result: final
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};