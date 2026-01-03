const axios = require("axios");

async function askBlackbox(question) {
    const payload = JSON.stringify({
        "messages": [
            {
                "role": "user",
                "content": question,
                "id": "5v7Lmxe"
            }
        ],
        "id": "bECQimH",
        "previewToken": null,
        "userId": null,
        "codeModelMode": true,
        "trendingAgentMode": {},
        "isMicMode": false,
        "userSystemPrompt": null,
        "maxTokens": 1024,
        "playgroundTopP": null,
        "playgroundTemperature": null,
        "isChromeExt": false,
        "githubToken": "",
        "clickedAnswer2": false,
        "clickedAnswer3": false,
        "clickedForceWebSearch": false,
        "visitFromDelta": false,
        "isMemoryEnabled": false,
        "mobileClient": false,
        "userSelectedModel": null,
        "userSelectedAgent": "VscodeAgent",
        "validated": "a38f5889-8fef-46d4-8ede-bf4668b6a9bb",
        "imageGenerationMode": false,
        "imageGenMode": "autoMode",
        "webSearchModePrompt": false,
        "deepSearchMode": false,
        "promptSelection": "",
        "domains": null,
        "vscodeClient": false,
        "codeInterpreterMode": false,
        "customProfile": {
            "name": "",
            "occupation": "",
            "traits": [],
            "additionalInfo": "",
            "enableNewChats": false
        },
        "webSearchModeOption": {
            "autoMode": true,
            "webMode": false,
            "offlineMode": false
        },
        "session": {
            "user": {
                "name": "Saya Saya",
                "email": "setokemail001@gmail.com",
                "image": "https://lh3.googleusercontent.com/a/ACg8ocLRyLf3Wp9oR2iGwbyvOr8Y68U0t5Dnm9-QKI0sKc5RjZy_9g=s96-c",
                "id": "6090b984-0189-4b49-a07d-ef508ca0fc19"
            },
            "expires": "2026-05-10T14:09:08.628Z",
            "isNewUser": true
        },
        "isPremium": false,
        "teamAccount": "",
        "subscriptionCache": null,
        "beastMode": false,
        "reasoningMode": false,
        "designerMode": false,
        "workspaceId": "",
        "asyncMode": false,
        "integrations": {},
        "isTaskPersistent": false,
        "selectedElement": null
    });

    const config = {
        method: "POST",
        url: "https://app.blackbox.ai/api/chat",
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/json",
            "origin": "https://app.blackbox.ai",
            "referer": "https://app.blackbox.ai/",
            "Cookie": "_fbp=fb.1.xxx" // kamu boleh ganti cookie jika perlu
        },
        data: payload
    };

    try {
        const result = await axios.request(config);
        return result.data.split("</think>")[1] || "";
    } catch (err) {
        throw new Error(err.response?.data || err.message);
    }
}

module.exports = {
    name: "Groq AI",
    desc: "Groq Chat AI models",
    category: "Openai",
    path: "/ai/groq?apikey=&question=",

    async run(req, res) {
        const { question, apikey } = req.query;

        if (!question) return res.json({ status: false, error: "Question is required" });

        if (!apikey || !global.apikey?.includes(apikey)) {
            return res.json({ status: false, error: "Invalid API key" });
        }

        try {
            const result = await askBlackbox(question);

            if (!result) {
                return res.status(500).json({ status: false, error: "No response from AI" });
            }

            res.json({ status: true, result });

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
};