const fetch = require("node-fetch");

async function gemini(query) {
    const reqId = Math.floor(Math.random() * 10000000);
    const randomSid = Math.floor(Math.random() * 1000000000000000000).toString();
    
    const url = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20251112.03_p0&f.sid=${randomSid}&hl=id&_reqid=${reqId}&rt=c`;
    
    const headers = {
        'authority': 'gemini.google.com',
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'origin': 'https://gemini.google.com',
        'referer': 'https://gemini.google.com/',
        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'sec-ch-ua-arch': '""',
        'sec-ch-ua-bitness': '""',
        'sec-ch-ua-full-version': '"139.0.7339.0"',
        'sec-ch-ua-full-version-list': '"Chromium";v="139.0.7339.0", "Not;A=Brand";v="99.0.0.0"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-model': '"SM-A566B"',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua-platform-version': '"16.0.0"',
        'sec-ch-ua-wow64': '?0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'x-same-domain': '1'
    };

    const data = `f.req=%5Bnull%2C%22%5B%5B%5C%22${encodeURIComponent(query)}%5C%22%2C0%2Cnull%2Cnull%2Cnull%2Cnull%2C0%5D%2C%5B%5C%22id%5C%22%5D%2Cnull%2Cnull%5D%22%5D&`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: data
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        return parseGeminiResponse(responseText);
        
    } catch (error) {
        throw new Error(error.message);
    }
}

function parseGeminiResponse(responseText) {
    const lines = responseText.split('\n');
    let fullAnswer = '';
    let lastValidAnswer = '';
    
    for (const line of lines) {
        if (!line.trim() || !isNaN(line.trim())) {
            continue;
        }
        
        try {
            const jsonData = JSON.parse(line);
            
            if (Array.isArray(jsonData) && jsonData[0] && Array.isArray(jsonData[0])) {
                if (jsonData[0][0] === 'wrb.fr' && jsonData[0][2]) {
                    try {
                        const innerJson = JSON.parse(jsonData[0][2]);
                        
                        if (innerJson && Array.isArray(innerJson[4])) {
                            for (const item of innerJson[4]) {
                                if (Array.isArray(item) && item[0] && item[0].startsWith('rc_') && Array.isArray(item[1])) {
                                    const answerText = item[1][0];
                                    if (answerText && answerText.length > 10) {
                                        lastValidAnswer = answerText;
                                        
                                        if (answerText.includes('?') || answerText.length > fullAnswer.length) {
                                            fullAnswer = answerText;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
        } catch (e) {
            continue;
        }
    }
    
    return fullAnswer || lastValidAnswer || 'yahh, gagal';
}

module.exports = {
  name: "Gemini",
  desc: "AI with Gemini models",
  category: "Openai",
  path: "/ai/gemini?apikey=&question=",

  async run(req, res) {
    const { question, apikey } = req.query;
    
    if (!question) return res.json({ status: false, error: "Question is required" });
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }

    try {
      const data = await gemini(question);
      if (!data) {
        return res.status(500).json({ status: false, error: "No response from AI" });
      }
      res.json({ status: true, result: data });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};