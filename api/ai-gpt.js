const axios = require("axios");

async function askNoteGPT(question) {
const body = JSON.stringify({
message: question,
language: "qug",
model: "gpt-4.1-mini",
tone: "default",
length: "moderate",
conversation_id: "3fb44b18-afc6-48d8-a053-a903416ab842"
});

const config = {  
    method: "POST",  
    url: "https://notegpt.io/api/v2/chat/stream",  
    responseType: "stream",  
    headers: {  
        "User-Agent": "Mozilla/5.0",  
        "Content-Type": "application/json"  
    },  
    data: body  
};  

return new Promise((resolve, reject) => {  
    axios.request(config).then(res => {  
        let finalText = "";  

        res.data.on("data", chunk => {  
            const parts = chunk.toString().split("\n");  

            for (let line of parts) {  
                if (!line.startsWith("data:")) continue;  

                try {  
                    const json = JSON.parse(line.replace("data: ", ""));  

                    if (json.text) finalText += json.text;  
                    if (json.done) return resolve(finalText.trim());  
                } catch {}  
            }  
        });  

        res.data.on("error", reject);  
    }).catch(reject);  
});

}

module.exports = {
name: "Chat GPT",
desc: "AI Chat GPT models",
category: "Openai",
path: "/ai/gpt?apikey=&question=",

async run(req, res) {  
    const { question, apikey } = req.query;  

    if (!question) return res.json({ status: false, error: "Question is required" });  
    if (!apikey || !global.apikey?.includes(apikey)) {  
        return res.json({ status: false, error: "Invalid API key" });  
    }  

    try {  
        const result = await askNoteGPT(question);  
        if (!result) {  
            return res.status(500).json({ status: false, error: "No response from AI" });  
        }  
        res.json({ status: true, result });  
    } catch (err) {  
        res.status(500).json({ status: false, error: err.message });  
    }  
}

};