const axios = require("axios");

async function askNoteGPTv2(question, imageUrl) {
    const payload = {
        message: question,
        language: "bcl",
        model: "gpt-4.1-mini",
        tone: "default",
        length: "moderate",
        conversation_id: "55efcea7-9145-47eb-8a2a-7bd75aefdada"
    };

    if (imageUrl) {
        payload.image_urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
    }

    const config = {
        method: "POST",
        url: "https://notegpt.io/api/v2/chat/stream",
        responseType: "stream",
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/json"
        },
        data: JSON.stringify(payload)
    };

    return new Promise((resolve, reject) => {
        axios.request(config).then(res => {
            let text = "";

            res.data.on("data", chunk => {
                const lines = chunk.toString().split("\n");

                for (let line of lines) {
                    if (!line.startsWith("data:")) continue;

                    try {
                        const json = JSON.parse(line.replace("data: ", ""));

                        if (json.text) text += json.text;
                        if (json.done) return resolve(text.trim());
                    } catch {}
                }
            });

            res.data.on("error", reject);
        }).catch(reject);
    });
}

module.exports = {
    name: "Chat GPT2",
    desc: "AI Chat GPT with Image support",
    category: "Openai",
    path: "/ai/gpt-v2?apikey=&question=&imageUrl=",

    async run(req, res) {
        const { question, apikey, imageUrl } = req.query;

        if (!question) return res.json({ status: false, error: "Question is required" });
        if (!apikey || !global.apikey?.includes(apikey)) {
            return res.json({ status: false, error: "Invalid API key" });
        }

        try {
            const img = imageUrl ? decodeURIComponent(imageUrl).split(",") : null;
            const result = await askNoteGPTv2(question, img);

            if (!result) {
                return res.status(500).json({ status: false, error: "No response from AI" });
            }

            res.json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
};