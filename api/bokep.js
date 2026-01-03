/**
 * BOKEPSIN Scraper
 * - search by query
 * - get title, href, duration
 * - fetch detail page
 * - decode base64 player
 * - extract real iframe src
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

function slugify(t){return t.trim().toLowerCase().replace(/\s+/g,'-')}
function encodeTitle(t){return encodeURIComponent(t).replace(/%20/g,'+')}

async function getRealIframe(videoUrl,title){
  try{
    const res = await fetch(videoUrl,{headers:{'User-Agent':'Mozilla/5.0'}});
    const html = await res.text();
    const $ = cheerio.load(html);
    const dataSrc = $('.secure-iframe-wrapper').attr('data-src');
    if(!dataSrc) return null;

    const playerUrl = `https://bokepsin.in.net/player/${dataSrc}/?title=${encodeTitle(title)}`;
    const pRes = await fetch(playerUrl,{headers:{'User-Agent':'Mozilla/5.0'}});
    let pHtml = await pRes.text();

    const m = pHtml.match(/data:text\/html;base64,([^"']+)/i);
    if(m){
      pHtml = Buffer.from(m[1],'base64').toString('utf-8');
      const $$ = cheerio.load(pHtml);
      let iframe = $$('iframe').attr('src');
      if(iframe) return iframe.startsWith('http') ? iframe : new URL(iframe,playerUrl).href;
    }

    return playerUrl;
  }catch{
    return null;
  }
}

async function bokepsinSearch(query){
  const slug = slugify(query);
  const url = `https://bokepsin.in.net/videos/${slug}`;
  const res = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
  const html = await res.text();
  const $ = cheerio.load(html);
  const results = [];

  $('article.three-card').each((_,el)=>{
    const title = $(el).find('header.three-card-title').text().trim();
    const link = $(el).find('a.three-card-link').attr('href');
    const duration = $(el).find('span.three-card-duration').text().trim();
    if(title && link) results.push({title,link,duration,download:null});
  });

  for(const item of results){
    item.download = await getRealIframe(item.link,item.title);
  }

  return {query,slug,total:results.length,results};
}

module.exports = {
  name:"Bokep Search",
  desc:"Search video from Bokepsin",
  category:"Search",
  path:"/search/bokep?apikey=&q=",
  async run(req,res){
    const { apikey, q } = req.query;
    if(!global.apikey.includes(apikey)) return res.json({status:false,error:"Apikey invalid"});
    if(!q) return res.json({status:false,error:"Query is required"});
    try{
      const data = await bokepsinSearch(q);
      res.json({status:true,result:data});
    }catch(e){
      res.status(500).json({status:false,error:e.message});
    }
  }
};