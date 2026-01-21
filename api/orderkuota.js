const fetch = global.fetch;
const { URLSearchParams } = require('url');
const crypto = require("crypto");
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images');

// CLASS OrderKuota
class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static API_URL_ORDER = 'https://app.orderkuota.com/api/v2/order';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.12.0';
  static APP_VERSION_NAME = '25.09.18';
  static APP_VERSION_CODE = '250918';
  static APP_REG_ID = 'cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw';
  static PHONE_MODEL = '23124RA7EO';
  static PHONE_UUID = 'cdzXkBynRECkAODZEHwkeV';
  static PHONE_ANDROID_VERSION = '15'; 
  
  // E-Wallet Products (hasil discovery)
  static E_WALLET_PRODUCTS = {
    'gopay': { code: 'GOPAY', fee: 800, name: 'Gopay Topup', min: 10000, max: 1000000 },
    'gopay_driver': { code: 'GODRIVE', fee: 805, name: 'Gopay Driver', min: 10000, max: 1000000 },
    'dana': { code: 'BNDN', fee: 200, name: 'Dana Topup', min: 10000, max: 1000000 },
    'ovo': { code: 'OVOTUVMOPEN', fee: 800, name: 'OVO Topup', min: 10000, max: 1000000 },
    'linkaja': { code: 'LINKAJA', fee: 805, name: 'Link Aja Topup', min: 10000, max: 1000000 },
    'shopeepay': { code: 'SHOPEE', fee: 650, name: 'ShopeePay Topup', min: 10000, max: 1000000 },
    'sakuku': { code: 'SAKUKUBEBAS', fee: 1500, name: 'Topup Sakuku', min: 10000, max: 1000000 },
    'transfer': { code: 'CTRF', fee: 0, name: 'Bebas Nominal Transfer Uang', min: 1000, max: 1000000 }
  };

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
    this.vouchersCache = null;
    this.cacheTime = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 menit cache
  }

  // ==================== AUTHENTICATION ====================
  async loginRequest(username, password) {
    const payload = new URLSearchParams({
      username,
      password,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async getAuthToken(username, otp) {
    const payload = new URLSearchParams({
      username,
      password: otp,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  // ==================== ACCOUNT & PROFILE ====================
  async getAccountInfo() {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });
    
    const response = await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
    return response.account?.results;
  }

  // ==================== QRIS METHODS ====================
  async getTransactionQris(type = '', userId = null) {
    if (!userId && this.authToken) {
      userId = this.authToken.split(':')[0];
    }
    
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_history][jumlah]': '',
      'requests[qris_history][jenis]': type,
      'requests[qris_history][page]': '1',
      'requests[qris_history][dari_tanggal]': '',
      'requests[qris_history][ke_tanggal]': '',
      'requests[qris_history][keterangan]': '',
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });
    
    const endpoint = userId ? 
      `${OrderKuota.API_URL}/qris/mutasi/${userId}` : 
      `${OrderKuota.API_URL}/get`;
      
    return await this.request('POST', endpoint, payload);
  }

  async generateQr(amount = '') {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_merchant_terms][jumlah]': amount,
      'requests[0]': 'qris_merchant_terms',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      phone_model: OrderKuota.PHONE_MODEL
    });

    const response = await this.request('POST', `${OrderKuota.API_URL}/get`, payload);

    try {
      if (response.success && response.qris_merchant_terms && response.qris_merchant_terms.results) {
        return response.qris_merchant_terms.results;
      }
      return response;
    } catch (err) {
      return { error: err.message, raw: response };
    }
  }

  async withdrawalQris(amount = '') {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_withdraw][amount]': amount,
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });

    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }

  // ==================== PPOB & VOUCHERS METHODS ====================
  async getAllVouchers(forceRefresh = false) {
    const now = Date.now();
    
    // Return cache jika masih valid
    if (!forceRefresh && this.vouchersCache && this.cacheTime && 
        (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.vouchersCache;
    }

    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[0]': 'vouchers',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });

    const response = await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
    this.vouchersCache = response.vouchers?.results || [];
    this.cacheTime = now;
    
    return this.vouchersCache;
  }

  async searchVouchers(filters = {}) {
    const {
      keyword = '',
      category = '',
      provider = '',
      minPrice = 0,
      maxPrice = 100000000,
      limit = 50,
      page = 1
    } = filters;

    const allVouchers = await this.getAllVouchers();
    
    let filtered = allVouchers.filter(voucher => {
      // Filter by keyword
      if (keyword) {
        const searchText = (
          (voucher.name || '') + ' ' +
          (voucher.description || '') + ' ' +
          (voucher.codes || '') + ' ' +
          (voucher.code || '')
        ).toLowerCase();
        
        if (!searchText.includes(keyword.toLowerCase())) return false;
      }
      
      // Filter by category
      if (category) {
        const name = (voucher.name || '').toLowerCase();
        if (!name.includes(category.toLowerCase())) return false;
      }
      
      // Filter by provider
      if (provider) {
        const name = (voucher.name || '').toLowerCase();
        const voucherProvider = (voucher.provider || '').toLowerCase();
        if (!name.includes(provider.toLowerCase()) && 
            !voucherProvider.includes(provider.toLowerCase())) return false;
      }
      
      // Filter by price
      if (voucher.price < minPrice || voucher.price > maxPrice) return false;
      
      return true;
    });
    
    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);
    
    return {
      total: filtered.length,
      page,
      limit,
      total_pages: Math.ceil(filtered.length / limit),
      data: paginated
    };
  }

  // ==================== E-WALLET METHODS ====================
  getEWalletProduct(walletType) {
    const product = OrderKuota.E_WALLET_PRODUCTS[walletType.toLowerCase()];
    if (!product) {
      throw new Error(`E-Wallet type not supported: ${walletType}. Available: ${Object.keys(OrderKuota.E_WALLET_PRODUCTS).join(', ')}`);
    }
    return product;
  }

  calculateTotalAmount(amount, walletType) {
    const product = this.getEWalletProduct(walletType);
    return parseInt(amount) + product.fee;
  }

  validateAmount(amount, walletType) {
    const product = this.getEWalletProduct(walletType);
    
    if (amount < product.min) {
      throw new Error(`Minimum amount for ${product.name} is Rp ${product.min.toLocaleString('id-ID')}`);
    }
    if (amount > product.max) {
      throw new Error(`Maximum amount for ${product.name} is Rp ${product.max.toLocaleString('id-ID')}`);
    }
    return true;
  }

  async topupEWalletBebas(walletType, amount, customerId, refId = '') {
    // Validasi
    this.validateAmount(amount, walletType);
    const product = this.getEWalletProduct(walletType);
    
    const totalAmount = this.calculateTotalAmount(amount, walletType);
    
    console.log(`💰 E-Wallet Topup Details:`);
    console.log(`   Wallet: ${product.name}`);
    console.log(`   Amount: Rp ${amount.toLocaleString('id-ID')}`);
    console.log(`   Fee: Rp ${product.fee.toLocaleString('id-ID')}`);
    console.log(`   Total: Rp ${totalAmount.toLocaleString('id-ID')}`);
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Product Code: ${product.code}`);
    
    // Lakukan topup
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL,
      'requests[0]': 'voucher_topup',
      'requests[voucher_topup][voucher_code]': product.code,
      'requests[voucher_topup][customer_number]': customerId,
      'requests[voucher_topup][ref_id]': refId || `EW${Date.now()}`,
      'requests[voucher_topup][amount]': amount  // Parameter amount untuk bebas nominal
    });
    
    const response = await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
    
    // Tambahkan informasi tambahan ke response
    if (response.success) {
      response.ewallet_details = {
        wallet_type: walletType,
        amount: amount,
        fee: product.fee,
        total_amount: totalAmount,
        product_code: product.code,
        customer_id: customerId
      };
    }
    
    return response;
  }

  async getAllEWalletProducts() {
    const allVouchers = await this.getAllVouchers();
    
    const ewalletProducts = [];
    const productCodes = Object.values(OrderKuota.E_WALLET_PRODUCTS).map(p => p.code);
    
    allVouchers.forEach(voucher => {
      if (productCodes.includes(voucher.codes) || productCodes.includes(voucher.code)) {
        const productKey = Object.keys(OrderKuota.E_WALLET_PRODUCTS).find(key => 
          OrderKuota.E_WALLET_PRODUCTS[key].code === voucher.codes || 
          OrderKuota.E_WALLET_PRODUCTS[key].code === voucher.code
        );
        
        if (productKey) {
          const productInfo = OrderKuota.E_WALLET_PRODUCTS[productKey];
          ewalletProducts.push({
            wallet_type: productKey,
            name: voucher.name,
            code: voucher.codes || voucher.code,
            fee: productInfo.fee,
            fee_str: voucher.price_str || productInfo.fee.toString(),
            description: voucher.description,
            min_amount: productInfo.min,
            max_amount: productInfo.max
          });
        }
      }
    });
    
    return ewalletProducts;
  }

  async getPPOBCategories() {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[0]': 'products',
      'requests[products][category]': 'pulsa',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });
    
    const response = await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
    return response.products?.results || [];
  }

  // ==================== CORE REQUEST METHOD ====================
  buildHeaders() {
    return {
      'Host': OrderKuota.HOST,
      'User-Agent': OrderKuota.USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept-encoding': 'gzip'
    };
  }

  async request(method, url, body = null) {
    try {
      const res = await fetch(url, {
        method,
        headers: this.buildHeaders(),
        body: body ? body.toString() : null,
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      } else {
        return await res.text();
      }
    } catch (err) {
      return { error: err.message };
    }
  }
}

// ==================== HELPER FUNCTIONS ====================
function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

function generateTransactionId() {
  return `IBRA-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function generateExpirationTime() {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30);
  return expirationTime;
}

async function elxyzFile(buffer) {
  const service = new ImageUploadService('pixhost.to');
  const { directLink } = await service.uploadFromBinary(buffer, 'ibra.png');
  return directLink;
}

async function createQRIS(amount, codeqr) {
  let qrisData = codeqr;
  qrisData = qrisData.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");
  amount = amount.toString();
  let uang = "54" + ("0" + amount.length).slice(-2) + amount;
  uang += "5802ID";
  const final = step2[0] + uang + step2[1];
  const result = final + convertCRC16(final);
  const buffer = await QRCode.toBuffer(result);
  const uploadedFile = await elxyzFile(buffer);
  return {
    idtransaksi: generateTransactionId(),
    jumlah: amount,
    expired: generateExpirationTime(),
    imageqris: { url: uploadedFile }
  };
}

// ==================== ROUTE EXPORT ====================
module.exports = [
  // ==================== AUTHENTICATION ====================
  {
    name: "Get OTP (tahap 1)",
    desc: "Get OTP Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/getotp?apikey=&username=&password=",
    async run(req, res) {
      const { apikey, username, password } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!password) return res.json({ status: false, error: 'Missing password' });
      try {
        const ok = new OrderKuota();
        const login = await ok.loginRequest(username, password);
        res.json({ status: true, result: login.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Get Token (tahap 2)",
    desc: "Get Token Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/gettoken?apikey=&username=&otp=",
    async run(req, res) {
      const { apikey, username, otp } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!otp) return res.json({ status: false, error: 'Missing otp' });
      try {
        const ok = new OrderKuota();
        const login = await ok.getAuthToken(username, otp);
        res.json({ status: true, result: login.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ==================== ACCOUNT & PROFILE ====================
  {
    name: "Cek Profile",
    desc: "Cek Profile Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/profile?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      try {
        const ok = new OrderKuota(username, token);
        const account = await ok.getAccountInfo();
        res.json({ status: true, result: account });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ==================== QRIS ====================
  {
    name: "Cek Mutasi QRIS",
    desc: "Cek Mutasi Qris Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/mutasiqr?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      try {
        const ok = new OrderKuota(username, token);
        const mutasi = await ok.getTransactionQris();
        const results = mutasi.qris_history?.results || mutasi;
        res.json({ status: true, result: results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Create QRIS",
    desc: "Generate QR Code Payment",
    category: "Orderkuota",
    path: "/orderkuota/createpayment?apikey=&username=&token=&amount=",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      if (!amount) return res.json({ status: false, error: 'Missing amount' });

      try {
        const ok = new OrderKuota(username, token);
        const qrcodeResp = await ok.generateQr(amount);

        if (!qrcodeResp.qris_data) {
          return res.status(400).json({ status: false, error: "QRIS generation failed", raw: qrcodeResp });
        }

        const buffer = await createQRIS(amount, qrcodeResp.qris_data);        

        res.status(200).json({
          status: true,
          result: buffer
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  },
  {
    name: "Withdraw QRIS",
    desc: "Tarik saldo QRIS Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/wdqr?apikey=&username=&token=&amount=",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      if (!amount) return res.json({ status: false, error: 'Missing amount' });

      try {
        const ok = new OrderKuota(username, token);
        const wd = await ok.withdrawalQris(amount);
        res.json({ status: true, result: wd });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  },

  // ==================== E-WALLET & BEBAS NOMINAL ====================
  {
    name: "E-Wallet Products",
    desc: "Get all E-Wallet products",
    category: "Orderkuota",
    path: "/orderkuota/ewallet/products?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      
      try {
        const ok = new OrderKuota(username, token);
        const products = await ok.getAllEWalletProducts();
        
        res.json({ 
          status: true, 
          count: products.length,
          result: products 
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Calculate E-Wallet Fee",
    desc: "Calculate total amount with fee",
    category: "Orderkuota",
    path: "/orderkuota/ewallet/calculate?apikey=&username=&token=&wallet=&amount=",
    async run(req, res) {
      const { apikey, username, token, wallet, amount } = req.query;
      
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      if (!wallet) return res.json({ status: false, error: 'Missing wallet type' });
      if (!amount) return res.json({ status: false, error: 'Missing amount' });
      
      try {
        const ok = new OrderKuota(username, token);
        const numericAmount = parseInt(amount);
        
        // Validasi amount
        ok.validateAmount(numericAmount, wallet);
        
        const product = ok.getEWalletProduct(wallet);
        const totalAmount = ok.calculateTotalAmount(numericAmount, wallet);
        
        res.json({ 
          status: true, 
          result: {
            wallet: wallet,
            product_name: product.name,
            product_code: product.code,
            amount: numericAmount,
            fee: product.fee,
            total_amount: totalAmount,
            min_amount: product.min,
            max_amount: product.max
          }
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Topup E-Wallet Bebas Nominal",
    desc: "Topup E-Wallet with flexible amount",
    category: "Orderkuota",
    path: "/orderkuota/ewallet/topup?apikey=&username=&token=&wallet=&amount=&customer_id=&ref_id=",
    async run(req, res) {
      const { apikey, username, token, wallet, amount, customer_id, ref_id } = req.query;
      
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      if (!wallet) return res.json({ status: false, error: 'Missing wallet type' });
      if (!amount) return res.json({ status: false, error: 'Missing amount' });
      if (!customer_id) return res.json({ status: false, error: 'Missing customer ID' });
      
      try {
        const ok = new OrderKuota(username, token);
        const numericAmount = parseInt(amount);
        
        const result = await ok.topupEWalletBebas(wallet, numericAmount, customer_id, ref_id);
        
        res.json({ 
          status: true, 
          result: result 
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ==================== PPOB & VOUCHERS ====================
  {
    name: "Get All Vouchers",
    desc: "Get all PPOB vouchers/products",
    category: "Orderkuota",
    path: "/orderkuota/vouchers?apikey=&username=&token=&limit=&page=",
    async run(req, res) {
      const { apikey, username, token, limit = 50, page = 1 } = req.query;
      
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      
      try {
        const ok = new OrderKuota(username, token);
        const result = await ok.searchVouchers({ limit: parseInt(limit), page: parseInt(page) });
        
        res.json({ 
          status: true, 
          result: result 
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "Search Vouchers",
    desc: "Search PPOB vouchers by keyword/category",
    category: "Orderkuota",
    path: "/orderkuota/vouchers/search?apikey=&username=&token=&keyword=&category=&provider=&min_price=&max_price=",
    async run(req, res) {
      const { apikey, username, token, keyword, category, provider, min_price, max_price } = req.query;
      
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      
      try {
        const ok = new OrderKuota(username, token);
        const filters = {
          keyword,
          category,
          provider,
          minPrice: min_price ? parseInt(min_price) : 0,
          maxPrice: max_price ? parseInt(max_price) : 100000000
        };
        
        const result = await ok.searchVouchers(filters);
        
        res.json({ 
          status: true, 
          result: result 
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },
  {
    name: "PPOB Categories",
    desc: "Get all PPOB categories",
    category: "Orderkuota",
    path: "/orderkuota/ppob/categories?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      if (!username) return res.json({ status: false, error: 'Missing username' });
      if (!token) return res.json({ status: false, error: 'Missing token' });
      
      try {
        const ok = new OrderKuota(username, token);
        const categories = await ok.getPPOBCategories();
        
        res.json({ 
          status: true, 
          count: categories.length,
          result: categories 
        });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  }
];
