// ==========================================================
// Aine Api’S — Docs (Redesign)
// - Data source: GET /settings (categories + items)
// - Assets: /images/*
// ==========================================================

let settings = {};
let originalCategories = [];
let currentMethodFilter = "all";
let currentSearch = "";

// DOM
const loadingScreen = document.getElementById("loadingScreen");
const apiListEl = document.getElementById("apiList");
const stateContainer = document.getElementById("stateContainer");
const stateImage = document.getElementById("stateImage");
const searchInput = document.getElementById("searchInput");
const methodButtons = document.querySelectorAll(".methodFilter");

const titleApi = document.getElementById("titleApi");
const descApi = document.getElementById("descApi");
const footerEl = document.getElementById("footer");

const statTotal = document.getElementById("statTotal");
const statCategories = document.getElementById("statCategories");
const statTheme = document.getElementById("statTheme");
const statStatus = document.getElementById("statStatus");

const copyBaseBtn = document.getElementById("copyBaseBtn");

// MODAL DOM
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalMethodEl = document.getElementById("modalMethod");
const modalPathEl = document.getElementById("modalPath");
const modalNameEl = document.getElementById("modalName");
const modalUrlEl = document.getElementById("modalUrl");
const modalCopyUrlBtn = document.getElementById("modalCopyUrl");
const modalExecuteBtn = document.getElementById("modalExecute");
const modalClearBtn = document.getElementById("modalClear");
const paramsContainer = document.getElementById("paramsContainer");

const responseWrap = document.getElementById("responseWrap");
const respStatus = document.getElementById("respStatus");
const respTime = document.getElementById("respTime");
const respContent = document.getElementById("respContent");
const modalCopyResp = document.getElementById("modalCopyResp");

// Active modal endpoint
let activeEndpoint = null;

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function showState(type) {
  // type: "loading" | "no-results" | "500" | "404" | "429"
  let src = "/images/no-results.webp";
  if (type === "loading") src = "/images/loading-search.webp";
  if (type === "500") src = "/images/500.webp";
  if (type === "404") src = "/images/404.webp";
  if (type === "429") src = "/images/429-rate-limiter.webp";

  stateImage.src = src;
  stateContainer.classList.remove("hidden");
  apiListEl.classList.add("hidden");
}

function hideState() {
  stateContainer.classList.add("hidden");
  apiListEl.classList.remove("hidden");
}

function pickCardBg(index = 0) {
  const n = (index % 8) + 1;
  return `/images/card-bg/card-${n}.webp`;
}

function methodClass(method) {
  const m = (method || "GET").toUpperCase();
  if (m === "GET") return "m-get";
  if (m === "POST") return "m-post";
  if (m === "PUT") return "m-put";
  if (m === "DELETE") return "m-del";
  return "m-other";
}

function methodLabel(method) {
  return (method || "GET").toUpperCase();
}

function buildInitialUrl(path = "") {
  let initialUrl = window.location.origin + path;

  // Reset query string values to empty (keep keys)
  if (path && path.includes("?")) {
    const [base, query] = path.split("?");
    if (query) {
      const params = new URLSearchParams(query);
      for (const [key] of params) params.set(key, "");
      initialUrl = window.location.origin + base + "?" + params.toString();
    }
  }

  return initialUrl;
}

function extractParameters(path) {
  const params = [];
  if (!path) return params;
  const queryString = path.split("?")[1];
  if (!queryString) return params;

  try {
    const urlParams = new URLSearchParams(queryString);
    for (const [key, value] of urlParams) {
      params.push({ name: key, defaultValue: value || "" });
    }
  } catch (e) {}
  return params;
}

function showToast(message, type = "info") {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.className = "toast";

  const iconMap = {
    success: "/images/icons/check.svg",
    error: "/images/icons/error.svg",
    info: "/images/icons/info.svg",
    warning: "/images/icons/warning.svg",
  };

  const icon = iconMap[type] || "/images/icons/info.svg";
  toast.innerHTML = `
    <img src="${icon}" class="w-5 h-5 opacity-80" alt="">
    <div class="text-slate-700">${escapeHtml(message)}</div>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// ----------------------------------------------------------
// API Load
// ----------------------------------------------------------

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    showState("loading");
    settings = await loadSettings();
    setupUI(settings);

    // categories from settings
    originalCategories = settings.categories || [];
    updateStats(originalCategories);

    // render
    renderCards(applyFilters(originalCategories));
    hideState();

    setupListeners();
  } catch (err) {
    console.error(err);
    showState("500");
    showToast("Failed to load docs data.", "error");
  } finally {
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = "none";
    }, 600);
  }
}

async function loadSettings() {
  const res = await fetch("/settings");
  if (!res.ok) throw new Error("Settings not found");
  return await res.json();
}

function setupUI(cfg) {
  // name/desc
  if (titleApi) titleApi.textContent = cfg.name || "Aine Api’S";
  if (descApi) descApi.textContent = cfg.description || "Developer-first REST API docs with real-time testing.";
  if (footerEl) footerEl.textContent = `© ${new Date().getFullYear()} ${cfg.creator || "Aine Api’S"} — Build For Developer To Developer`;

  // theme stat
  if (statTheme) statTheme.textContent = (cfg.theme || "light").toUpperCase();

  // base copy
  if (copyBaseBtn) {
    copyBaseBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(window.location.origin);
      showToast("Base URL copied!", "success");
    });
  }
}

function updateStats(categories) {
  let total = 0;
  categories.forEach(c => total += (c.items || []).length);

  if (statTotal) statTotal.textContent = total.toString();
  if (statCategories) statCategories.textContent = (categories.length || 0).toString();
  if (statStatus) statStatus.textContent = "Ready";
}

// ----------------------------------------------------------
// Filters
// ----------------------------------------------------------

function setupListeners() {
  // search
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value || "";
      rerender();
    });
  }

  // method filters
  methodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      currentMethodFilter = btn.dataset.method || "all";

      // tiny visual selection
      methodButtons.forEach(b => b.classList.remove("ring-2", "ring-sky-200"));
      btn.classList.add("ring-2", "ring-sky-200");

      rerender();
    });
  });

  // modal close
  closeModalBtn?.addEventListener("click", closeModal);
  modalBackdrop?.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // copy response
  modalCopyResp?.addEventListener("click", async () => {
    const text = respContent?.innerText || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast("Response copied!", "success");
  });

  // copy url
  modalCopyUrlBtn?.addEventListener("click", async () => {
    const url = modalUrlEl.textContent.trim();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    showToast("URL copied!", "success");
  });

  // execute
  modalExecuteBtn?.addEventListener("click", executeModalRequest);

  // clear
  modalClearBtn?.addEventListener("click", () => {
    responseWrap.classList.add("hidden");
    respContent.innerHTML = "";
    respStatus.textContent = "—";
    respTime.textContent = "—";
    // clear inputs
    paramsContainer.querySelectorAll("input").forEach(i => i.value = "");
    // update url again
    updateModalUrl();
    showToast("Cleared.", "info");
  });
}

function rerender() {
  const filtered = applyFilters(originalCategories);
  renderCards(filtered);

  const hasAny = filtered.some(c => (c.items || []).length > 0);
  if (!hasAny) {
    showState("no-results");
  } else {
    hideState();
  }
}

function applyFilters(categories) {
  const s = (currentSearch || "").toLowerCase().trim();
  const m = currentMethodFilter;

  if (!s && (m === "all")) return categories;

  const out = [];
  for (const cat of categories) {
    const items = (cat.items || []).filter(item => {
      const method = (item.method || "GET").toLowerCase();
      const matchMethod = (m === "all") ? true : method === m;

      if (!s) return matchMethod;

      const hay = [
        cat.name || "",
        item.name || "",
        item.desc || "",
        item.path || "",
        item.method || "",
        item.status || ""
      ].join(" ").toLowerCase();

      return matchMethod && hay.includes(s);
    });

    if (items.length) out.push({ ...cat, items });
  }
  return out;
}

// ----------------------------------------------------------
// Render Cards (Grid)
// ----------------------------------------------------------

function renderCards(categories) {
  if (!apiListEl) return;

  apiListEl.innerHTML = "";

  let globalIndex = 0;

  for (const cat of categories) {
    const catName = cat.name || "Uncategorized";
    const items = cat.items || [];
    if (!items.length) continue;

    // Category header as a full-width row (2 columns span)
    const header = document.createElement("div");
    header.className = "md:col-span-2";
    header.innerHTML = `
      <div class="glass p-5 border border-white/60 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <img src="/images/icons/folder.svg" class="w-6 h-6 opacity-70" alt="">
          <div class="min-w-0">
            <div class="text-lg font-extrabold text-slate-900 truncate">${escapeHtml(catName)}</div>
            <div class="text-sm text-slate-600 font-medium">${items.length} endpoints</div>
          </div>
        </div>
      </div>
    `;
    apiListEl.appendChild(header);

    // Items
    for (const item of items) {
      const method = methodLabel(item.method);
      const path = item.path || "/";
      const name = item.name || "Untitled Endpoint";
      const desc = item.desc || "";
      const bg = pickCardBg(globalIndex);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${bg}" class="card-bg" alt="">
        <div class="card-shade"></div>

        <div class="relative z-10 p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="method ${methodClass(method)}">${method}</span>
                <code class="mono text-[13px] font-semibold text-slate-900 truncate block max-w-[310px]" title="${escapeHtml(path)}">${escapeHtml(path)}</code>
              </div>
              <div class="text-sm font-bold text-slate-800 mt-2 truncate" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
              <div class="text-sm text-slate-600 mt-1 line-clamp-2">${escapeHtml(desc)}</div>
            </div>

            <button class="btn !py-2 !px-3 copyBtn" title="Copy URL">
              <img src="/images/icons/copy.svg" class="w-5 h-5 opacity-75" alt="">
            </button>
          </div>

          <div class="mt-4 flex items-center justify-between gap-2">
            <button class="btn !py-2.5 !px-3 detailsBtn">
              <img src="/images/icons/docs.svg" class="w-5 h-5 opacity-75" alt="">
              Details
            </button>

            <button class="btn btn-primary !py-2.5 !px-3 tryBtn">
              <img src="/images/icons/play.svg" class="w-5 h-5 opacity-95" alt="">
              Try
            </button>
          </div>
        </div>
      `;

      // events
      const copyBtn = card.querySelector(".copyBtn");
      copyBtn.addEventListener("click", async () => {
        const full = buildInitialUrl(path);
        await navigator.clipboard.writeText(full);
        showToast("Copied endpoint URL!", "success");
      });

      const detailsBtn = card.querySelector(".detailsBtn");
      const tryBtn = card.querySelector(".tryBtn");

      detailsBtn.addEventListener("click", () => openModal(catName, item));
      tryBtn.addEventListener("click", () => openModal(catName, item, true));

      apiListEl.appendChild(card);
      globalIndex++;
    }
  }
}

// ----------------------------------------------------------
// Modal Logic
// ----------------------------------------------------------

function openModal(categoryName, item, autoRun = false) {
  activeEndpoint = { categoryName, item };

  // method badge + path
  const method = methodLabel(item.method);
  modalMethodEl.textContent = method;
  modalMethodEl.className = `method ${methodClass(method)}`;

  modalPathEl.textContent = item.path || "/";
  modalNameEl.textContent = `${item.name || "Untitled"} • ${categoryName}`;

  // params
  paramsContainer.innerHTML = "";
  const params = extractParameters(item.path);
  if (!params.length) {
    paramsContainer.innerHTML = `
      <div class="col-span-full text-sm text-slate-500 font-semibold flex items-center gap-2">
        <img src="/images/icons/check.svg" class="w-5 h-5 opacity-70" alt="">
        No parameters required.
      </div>
    `;
  } else {
    params.forEach(p => {
      const wrap = document.createElement("div");
      wrap.className = "flex flex-col gap-2";
      wrap.innerHTML = `
        <label class="text-xs font-extrabold text-slate-500 uppercase">${escapeHtml(p.name)}</label>
        <input data-param="${escapeHtml(p.name)}"
               class="w-full px-4 py-3 rounded-2xl border border-white/70 bg-white/70 outline-none focus:ring-4 focus:ring-sky-200/60"
               placeholder="Input ${escapeHtml(p.name)}..."
               value="${escapeHtml(p.defaultValue || "")}">
      `;
      paramsContainer.appendChild(wrap);
    });
  }

  // update url
  updateModalUrl();

  // live update url
  paramsContainer.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updateModalUrl);
  });

  // reset response
  responseWrap.classList.add("hidden");
  respContent.innerHTML = "";
  respStatus.textContent = "—";
  respTime.textContent = "—";

  // show modal
  modalBackdrop.style.display = "flex";
  document.body.style.overflow = "hidden";

  if (autoRun) executeModalRequest();
}

function closeModal() {
  modalBackdrop.style.display = "none";
  document.body.style.overflow = "";
  activeEndpoint = null;
}

function updateModalUrl() {
  if (!activeEndpoint) return;
  const path = activeEndpoint.item.path || "/";

  const full = buildInitialUrl(path);
  const [base, query] = full.split("?");

  if (!query) {
    modalUrlEl.textContent = full;
    return;
  }

  const params = new URLSearchParams(query);
  paramsContainer.querySelectorAll("input[data-param]").forEach(input => {
    const key = input.dataset.param;
    const val = input.value.trim();
    params.set(key, val);
  });

  modalUrlEl.textContent = base + "?" + params.toString();
}

// ----------------------------------------------------------
// Execute Request (Modal)
// ----------------------------------------------------------

async function executeModalRequest() {
  if (!activeEndpoint) return;

  const method = methodLabel(activeEndpoint.item.method);
  const url = modalUrlEl.textContent.trim();
  if (!url) return;

  responseWrap.classList.remove("hidden");
  respContent.innerHTML = `<div class="text-sm font-semibold text-slate-500">Loading...</div>`;
  respStatus.textContent = "Loading...";
  respStatus.className = "text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold";
  respTime.textContent = "";

  const start = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Accept": "*/*",
        "User-Agent": "Aine-API-Docs"
      }
    });

    const ms = Date.now() - start;
    const ct = res.headers.get("content-type") || "";

    respTime.textContent = `${ms}ms`;

    // status badge
    if (res.ok) {
      respStatus.textContent = `${res.status} OK`;
      respStatus.className = "text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold";
    } else {
      respStatus.textContent = `${res.status} ERROR`;
      respStatus.className = "text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-extrabold";
    }

    // handle special error images
    if (!res.ok) {
      const status = res.status;
      if (status === 429) {
        respContent.innerHTML = `
          <div class="glass overflow-hidden border border-white/60 shadow-lg">
            <img src="/images/429-rate-limiter.webp" class="w-full h-auto block" alt="429">
          </div>
        `;
        showToast("Rate limited (429).", "warning");
        return;
      }
      if (status >= 500) {
        respContent.innerHTML = `
          <div class="glass overflow-hidden border border-white/60 shadow-lg">
            <img src="/images/500.webp" class="w-full h-auto block" alt="500">
          </div>
        `;
        showToast("Server error.", "error");
        return;
      }
    }

    // IMAGE
    if (ct.startsWith("image/")) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      respContent.innerHTML = `
        <div class="flex justify-center">
          <img src="${blobUrl}" class="max-w-full max-h-[520px] object-contain rounded-2xl shadow" alt="Image"/>
        </div>
      `;
      showToast("Image response.", "success");
      return;
    }

    // AUDIO
    if (ct.includes("audio/")) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      respContent.innerHTML = `
        <div class="flex justify-center">
          <audio controls class="w-full max-w-md">
            <source src="${blobUrl}" type="${ct}">
          </audio>
        </div>
      `;
      showToast("Audio response.", "success");
      return;
    }

    // VIDEO
    if (ct.includes("video/")) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      respContent.innerHTML = `
        <div class="flex justify-center">
          <video controls class="w-full max-w-3xl max-h-[520px] object-contain rounded-2xl shadow">
            <source src="${blobUrl}" type="${ct}">
          </video>
        </div>
      `;
      showToast("Video response.", "success");
      return;
    }

    // JSON
    if (ct.includes("application/json")) {
      const data = await res.json();
      respContent.innerHTML = `
        <pre class="mono text-xs p-4 rounded-2xl bg-white/70 border border-white/60">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      `;
      showToast("Request success.", "success");
      return;
    }

    // TEXT / fallback
    const txt = await res.text();
    respContent.innerHTML = `
      <pre class="mono text-xs p-4 rounded-2xl bg-white/70 border border-white/60">${escapeHtml(txt)}</pre>
    `;
    showToast("Request success.", "success");

  } catch (err) {
    console.error(err);

    respStatus.textContent = "Error";
    respStatus.className = "text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-extrabold";
    respTime.textContent = "0ms";

    respContent.innerHTML = `
      <div class="glass overflow-hidden border border-white/60 shadow-lg">
        <img src="/images/500.webp" class="w-full h-auto block" alt="500">
      </div>
      <div class="text-xs text-slate-500 mt-3">${escapeHtml(err.message || "Unknown error")}</div>
    `;
    showToast("Request failed.", "error");
  }
}