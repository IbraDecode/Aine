const fetch = require("node-fetch");

const googleSearchImage = async (query) => {

    if (!query) throw Error(`kata pencarian tidak boleh kosong`)
    const usp = {
        "as_st": "y",
        "as_q": query,
        "as_epq": "",
        "as_oq": "",
        "as_eq": "",
        "imgsz": "l", // image size result. (emptry string = any size) available size : l m i qsvga vga svga xga 2mp 4mp 6mp 8mp 10mp 12mp 15mp 20mp 40mp 70mp 
        "imgar": "",
        "imgcolor": "",
        "imgtype": "jpg", // image format (empty sting = any format) available format : jpg gif png bmp svg webp ico craw
        "cr": "",
        "as_sitesearch": "",
        "as_filetype": "",
        "tbs": "",
        "udm": "2"
    }

    const headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    }

    const response = await fetch("https://www.google.com/search?" + new URLSearchParams(usp).toString(), {
        headers
    })

    if (!response.ok) throw Error(`gagal hit api ${response.status} ${response.statusText}\n${await response.text() || null}`)

    const html = await response.text()
    const match = html.match(/var m=(.*?);var a=m/)?.[1] || null
    if (!match) throw Error("no match found!")
    const json = JSON.parse(match)
    const images = Object.entries(json).filter(v => v[1]?.[1]?.[3]?.[0]).map(v =>
    ({
        title: v[1]?.[1]?.[25]?.[2003]?.[3] || null,
        imageUrl: v[1][1][3][0] || null,
        height: v[1][1][3][1] || null,
        width: v[1][1][3][2] || null,
        imageSize: v[1]?.[1]?.[25]?.[2000]?.[2] || null,
        referer: v[1]?.[1]?.[25]?.[2003]?.[2] || null,
        aboutUrl: v[1]?.[1]?.[25]?.[2003]?.[33] || null
    })
    )

    if (!images.length) throw Error(`hasil pencarian ${query} kosong.`)
    images.pop() // buang element akhir
    return { total: images.length, images }

}

module.exports = {
  name: "Gimage",
  desc: "Search google image",
  category: "Search",
  path: "/search/gimage?q=",
  async run(req, res) {
    const { q } = req.query;

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await googleSearchImage(q);
      const final = results
      res.status(200).json({
        status: true,
        result: final
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};