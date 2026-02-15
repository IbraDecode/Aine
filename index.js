const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Rate Limiter Configuration
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { status: false, error: 'Terlalu banyak permintaan, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const app = express();
const PORT = 3000;

// =====================================
//           BASIC SETTINGS
// =====================================
app.enable("trust proxy");
app.set("json spaces", 2);

app.use('/images', express.static(path.join(__dirname, 'client/dist/images')));
app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(limiter); // Rate limiting

// Force API Key to be 'free' globally
app.use((req, res, next) => {
  req.query.apikey = 'free';
  next();
});

// =====================================
//         REAL-TIME STATISTICS
// =====================================
const statistics = {
  requests: 0,
  success: 0,
  failed: 0
};

// Statistics middleware - only track API endpoints
app.use((req, res, next) => {
  // Only count actual API calls, not static files or pages
  if (req.path.startsWith('/') && req.path !== '/' && req.path !== '/settings' && req.path !== '/stats' && !req.path.includes('.')) {
    statistics.requests++;
    
    // Track success/failure on response
    const originalSend = res.send;
    res.send = function(data) {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed && parsed.status === true) {
          statistics.success++;
        } else if (parsed && parsed.status === false) {
          statistics.failed++;
        }
      } catch {
        // If parse fails but status code is successful, count as success
        if (res.statusCode >= 200 && res.statusCode < 300) {
          statistics.success++;
        } else if (res.statusCode >= 400) {
          statistics.failed++;
        }
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    status: true,
    data: {
      requests: statistics.requests,
      success: statistics.success,
      failed: statistics.failed,
      uptime: process.uptime(),
      timestamp: Date.now()
    }
  });
});

// =====================================
//           GLOBAL HELPERS
// =====================================
global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

// =====================================
//             SETTINGS
// =====================================
const settings = {
  name: "Aine Api's",
  description: "Dokumentasi REST API yang simpel dan mudah digunakan untuk integrasi Bot WhatsApp.",
  apiSettings: {
    creator: "Ibra Decode",
    apikey: ["free"]
  },
  linkTelegram: "https://t.me/ibracode",
  linkWhatsapp: "https://whatsapp.com/channel/0029Vb7cyPV9Bb64dYmXST3h",
  linkYoutube: "https://www.youtube.com/@ibradecode"
};

global.apikey = settings.apiSettings.apikey;

// =====================================
//   CUSTOM JSON RESPONSE MIDDLEWARE
// =====================================
app.use((req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (data && typeof data === 'object') {
      const responseData = {
        status: data.status,
        creator: settings.apiSettings.creator || "Created By Decode Community",
        ...data
      };
      return originalJson.call(this, responseData);
    }
    return originalJson.call(this, data);
  };

  next();
});

// =====================================
//           ROUTE LOADER (FLAT)
// =====================================
let totalRoutes = 0;
let rawEndpoints = {};

// Initialize database
const db = require('./database');

const apiFolder = path.join(__dirname, './api');

const register = (ep, file) => {
  if (
    ep &&
    ep.name &&
    ep.desc &&
    ep.category &&
    ep.path &&
    typeof ep.run === "function"
  ) {
    const cleanPath = ep.path.split("?")[0];

    app.get(cleanPath, ep.run);

    if (!rawEndpoints[ep.category]) rawEndpoints[ep.category] = [];

    rawEndpoints[ep.category].push({
      name: ep.name,
      desc: ep.desc,
      path: ep.path,
      ...(ep.innerDesc ? { innerDesc: ep.innerDesc } : {})
    });

    totalRoutes++;
    console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${file} → ${ep.name} `));
  }
};

fs.readdirSync(apiFolder).forEach((file) => {
  const filePath = path.join(apiFolder, file);

  if (path.extname(file) === '.js') {
    const routeModule = require(filePath);

    // ===============================
    //     CASE 1: ARRAY OF ROUTES
    // ===============================
    if (Array.isArray(routeModule)) {
      routeModule.forEach(ep => register(ep, file));
      return;
    }

    // ===============================
    //     CASE 2: SINGLE ROUTE OBJ
    // ===============================
    register(routeModule, file);

    // ===============================
    //     CASE 3: FUNCTION EXPORT (ROUTERS)
    // ===============================
    if (typeof routeModule === "function") {
      try {
        routeModule(app);
      } catch (error) {
        console.error(`Error loading router from ${file}:`, error.message);
      }
    }

    // ===============================
    //     CASE 4: endpoint: {...}
    // ===============================
    if (routeModule.endpoint) {
      register(routeModule.endpoint, file);
    }

    totalRoutes++;
  }
});



console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));



// =====================================
//       SETTINGS + ENDPOINT OUTPUT
// =====================================
app.get('/settings', (req, res) => {
  const endpoints = {
    categories: Object.keys(rawEndpoints)
      .sort((a, b) => a.localeCompare(b))
      .map(category => ({
        name: category,
        items: rawEndpoints[category].sort((a, b) => a.name.localeCompare(b.name))
      }))
  };

  settings.categories = endpoints.categories;
  res.json(settings);
});

// =====================================
//              MAIN PAGE
// =====================================
app.get(['/', '/docs'], (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// =====================================
//              START SERVER
// =====================================
app.listen(PORT, () => {
  console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
});

module.exports = app;
