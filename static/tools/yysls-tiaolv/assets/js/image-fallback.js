(function () {
  "use strict";

  const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  const iconLabelMap = {
    "icon1": "武器",
    "icon3": "环",
    "icon4": "佩",
    "icon5": "冠胄",
    "icon6": "胸甲",
    "icon7": "胫甲",
    "icon8": "腕甲",
    "icon9_1": "弓诀",
    "icon1_1": "剑",
    "icon1_2": "枪",
    "icon1_3": "伞",
    "icon1_4": "扇",
    "icon1_5": "绳标",
    "icon1_6": "双刀",
    "icon1_7": "陌刀",
    "icon1_8": "横刀",
    "icon1_9": "拳甲",
    "sample": "样本"
  };

  function firstHan(text) {
    const match = String(text || "").match(/[\u3400-\u9fff]/);
    return match ? match[0] : "";
  }

  function labelFromImage(img) {
    const src = decodeURIComponent(img.getAttribute("src") || img.src || "");
    const file = src.split("/").pop().split("?")[0].replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, "");
    if (iconLabelMap[file]) return iconLabelMap[file];
    const hanFromFile = firstHan(file);
    if (hanFromFile) return file;
    const alt = img.getAttribute("alt") || "";
    const hanFromAlt = firstHan(alt);
    if (hanFromAlt) return alt;
    const parentText = (img.parentElement && img.parentElement.textContent) || "";
    const hanFromParent = firstHan(parentText);
    if (hanFromParent) return parentText.trim();
    return "图";
  }

  function placeholderDataUrl(label) {
    const text = firstHan(label) || "图";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5b4631"/>
            <stop offset="100%" stop-color="#a77a45"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="18" fill="url(#g)"/>
        <rect x="6" y="6" width="148" height="148" rx="14" fill="none" stroke="rgba(255,255,255,0.24)"/>
        <text x="80" y="95" text-anchor="middle" font-size="72" font-family="Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif" fill="#fff6e9">${text}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function applyFallback(img) {
    if (!img || img.dataset.placeholderApplied === "true") return;
    const rawSrc = decodeURIComponent(img.getAttribute("src") || img.src || "");
    img.dataset.placeholderApplied = "true";
    img.onerror = null;
    if (!rawSrc || rawSrc.endsWith("index.html")) {
      img.src = BLANK_PIXEL;
      return;
    }
    img.src = placeholderDataUrl(labelFromImage(img));
  }

  document.addEventListener("error", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    applyFallback(target);
  }, true);
}());
