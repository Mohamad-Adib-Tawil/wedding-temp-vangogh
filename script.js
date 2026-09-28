/* ============================================================
   قالب vangogh «ليلة النجوم» — مستوحى من فان كوخ
   الدخول: فيديو فان كوخ يعزف بين دوّار الشمس + شريط تحميل (محرّك classic)
   الهيرو: سماء «ليلة النجوم» تُرسَم حيّاً بالكانفاس — دوّامات، نجوم، قمر، سرو
   الفواصل: صفوف دوّار شمس مرسومة برمجياً · العدّاد: بلاطات ليلية مصغّرة
   ============================================================ */

const WEDDING_CONFIG = (typeof window !== "undefined" && window.__INVITE__ && window.__INVITE__.config) || {
  groom: "محمد",
  bride: "لينا",

  date: "2026-12-11T19:00:00",
  dateText: "يوم الجمعة، ١١ كانون الأول ٢٠٢٦",
  timeText: "الساعة السابعة مساءً",

  heroSub: "يتشرّفان بدعوتكم لمشاركتهما فرحة العمر",

  verse: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا",

  invitationText: "تحت سماءٍ ترسمها النجوم، وبقلوبٍ تفيض بالمحبة، نتشرّف بدعوتكم لمشاركتنا أجمل لوحات العمر — حفل زفافنا. حضوركم لمسة الذهب في لوحتنا.",

  groomParents: "نجل السيّد كريم عبد الله و السيّدة هدى",
  brideParents: "كريمة السيّد سامي حسن و السيّدة رنا",

  venueName: "قاعة النجوم الكبرى",
  venueAddr: "بغداد — المنصور",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Baghdad",

  program: [
    { time: "٧:٠٠ مساءً", title: "استقبال الضيوف" },
    { time: "٧:٣٠ مساءً", title: "عقد القران" },
    { time: "٨:٣٠ مساءً", title: "الكوكتيل" },
    { time: "٩:٣٠ مساءً", title: "العشاء" },
    { time: "١٠:٣٠ مساءً", title: "الرقص والسهرة" },
  ],

  notes: [
    "يُرجى الحضور قبل الموعد بنصف ساعة",
    "نتشرّف بحضوركم بأبهى حلّة",
    "الدعوة تشمل حاملها والعائلة الكريمة",
  ],

  closingNote: "حضوركم نجمةٌ في سمائنا",
  hashtag: "#ليلة_النجوم",
  contactLabel: "للاستفسار والتأكيد",
  contactName: "أبو محمد",
  contactPhone: "+9647700000000",
  closingFamilies: "عائلة عبد الله  &  عائلة حسن",

  images: { venue: "" },
};

/* ============================================================
   ريشة فان كوخ — محرّك الرسم بالكانفاس
   ============================================================ */

/* لوحة الألوان — ليلة النجوم */
const VG = {
  skyDeep: ["#0b1533", "#101f4a", "#16295e"],
  skyMid: ["#1f3a7a", "#28468c", "#31549e"],
  skyLight: ["#3e6db5", "#5b8ecb", "#7aa5d6"],
  cream: ["#cfd9e8", "#e4e0c0", "#d9cf9e"],
  star: ["#f2e6b8", "#e8d18a", "#d9b95c"],
  moon: "#f0d878",
  hills: ["#101d42", "#15284f", "#1b3055"],
  cypress: ["#0c1810", "#122217", "#182d1e"],
  sun: { petals: ["#e8b830", "#f2ca4a", "#d99a26", "#f5d76e"], heart: ["#5a3a1a", "#3d2812"], leaf: "#4a6e2a" },
};

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/* تجهيز كانفاس بدقة الشاشة */
function prep(canvas, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  return ctx;
}

/* حقل الجريان: دوّامتا «ليلة النجوم» + انجراف موجي أفقي */
function makeField(w, h) {
  const rotors = [
    { x: w * 0.38, y: h * 0.30, r: w * 0.30, dir: 1 },   // الدوّامة الكبرى
    { x: w * 0.62, y: h * 0.22, r: w * 0.18, dir: -1 },  // توأمها الصغير
    { x: w * 0.15, y: h * 0.45, r: w * 0.16, dir: 1 },
  ];
  return (x, y) => {
    let vx = 1, vy = Math.sin(x / w * TAU * 1.6 + y * 0.012) * 0.35; // انجراف موجي
    for (const R of rotors) {
      const dx = x - R.x, dy = y - R.y;
      const d = Math.hypot(dx, dy);
      const fall = Math.exp(-(d * d) / (2 * R.r * R.r)) * 2.6;
      vx += (-dy / (d + 1)) * fall * R.dir;
      vy += (dx / (d + 1)) * fall * R.dir;
    }
    const m = Math.hypot(vx, vy) || 1;
    return [vx / m, vy / m];
  };
}

/* ضربة فرشاة تتبع الحقل */
function stroke(ctx, field, x0, y0, len, width, color, alpha) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.beginPath();
  let x = x0, y = y0;
  ctx.moveTo(x, y);
  const step = 3;
  for (let i = 0; i < len; i += step) {
    const [vx, vy] = field(x, y);
    x += vx * step; y += vy * step;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* نجمة متوهجة: هالة من ضربات قوسية + قلب مضيء */
function paintStar(ctx, x, y, r) {
  for (let ring = r; ring > 2; ring -= Math.max(2, r * 0.16)) {
    const n = Math.max(8, Math.round(ring * 0.9));
    for (let i = 0; i < n; i++) {
      const a0 = rand(0, TAU);
      const col = VG.star[Math.floor(rand(0, VG.star.length))];
      ctx.strokeStyle = col;
      ctx.globalAlpha = rand(0.14, 0.4) * (1 - ring / (r * 1.4)) + 0.12;
      ctx.lineWidth = rand(1.2, 2.6);
      ctx.beginPath();
      ctx.arc(x + rand(-1.5, 1.5), y + rand(-1.5, 1.5), ring, a0, a0 + rand(0.5, 1.6));
      ctx.stroke();
    }
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.55);
  g.addColorStop(0, "rgba(255,248,214,0.95)");
  g.addColorStop(0.45, "rgba(242,222,150,0.55)");
  g.addColorStop(1, "rgba(242,222,150,0)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
}

/* الهلال — أعلى الزاوية */
function paintMoon(ctx, x, y, r) {
  for (let ring = r * 1.5; ring > r * 0.7; ring -= 3) {
    const n = Math.round(ring * 0.8);
    for (let i = 0; i < n; i++) {
      const a0 = rand(0, TAU);
      ctx.strokeStyle = VG.star[Math.floor(rand(0, VG.star.length))];
      ctx.globalAlpha = rand(0.1, 0.3);
      ctx.lineWidth = rand(1.2, 2.4);
      ctx.beginPath(); ctx.arc(x, y, ring, a0, a0 + rand(0.4, 1.2)); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = VG.moon;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = "#e3c85e";
  ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, TAU); ctx.fill();
  /* القضمة الهلالية */
  ctx.fillStyle = "#f6edc4";
  ctx.beginPath(); ctx.arc(x - r * 0.34, y - r * 0.1, r * 0.78, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = "destination-over";
  ctx.globalCompositeOperation = "source-over";
}

/* التلال النائمة أسفل السماء — موجات طويلة هادئة */
function paintHills(ctx, w, h) {
  VG.hills.forEach((col, i) => {
    const base = h - (VG.hills.length - i) * (h * 0.05);
    ctx.fillStyle = col;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, base);
    const seg = 3 + i; /* موجات قليلة وعريضة — لا حراشف */
    for (let s = 0; s < seg; s++) {
      const x1 = ((s + 1) / seg) * w;
      const midX = ((s + 0.5) / seg) * w;
      const crest = base - (s % 2 ? h * 0.012 : h * 0.038) - i * 5;
      ctx.quadraticCurveTo(midX, crest, x1, base + (s % 2 ? -3 : 5));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });
}

/* شجرة السرو — لهب داكن كثيف يتمايل (بيضاوات متراكمة تضيق صعوداً) */
function paintCypress(ctx, x, baseY, height) {
  const layers = 34;
  const step = height / layers;
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const y = baseY - t * height;
    const wdt = (1 - t) * height * 0.085 + 3;
    const sway = Math.sin(t * 8.5) * wdt * 0.55;
    ctx.fillStyle = VG.cypress[i % VG.cypress.length];
    ctx.globalAlpha = rand(0.85, 1);
    ctx.beginPath();
    ctx.ellipse(x + sway + rand(-2, 2), y, wdt * rand(0.8, 1.15), step * 1.7, rand(-0.35, 0.35), 0, TAU);
    ctx.fill();
    /* ألسنة جانبية صغيرة تعطي ملمس الشجرة */
    if (i % 5 === 2) {
      ctx.beginPath();
      ctx.ellipse(x + sway + wdt * (i % 2 ? 0.9 : -0.9), y, wdt * 0.4, step * 1.2, rand(-0.8, 0.8), 0, TAU);
      ctx.fill();
    }
  }
  /* قمة اللهب المائلة */
  ctx.beginPath();
  ctx.ellipse(x + 3, baseY - height - step, 3.5, step * 2.4, 0.35, 0, TAU);
  ctx.fill();
}

/* ===== اللوحة الكبرى: سماء الهيرو ===== */
function paintSky(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return [];
  const ctx = prep(canvas, w, h);

  /* الأساس المتدرّج */
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0b1533"); g.addColorStop(0.55, "#152a5c"); g.addColorStop(1, "#1d3766");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  const field = makeField(w, h);
  const palettes = [VG.skyDeep, VG.skyMid, VG.skyMid, VG.skyLight, VG.cream];

  /* ضربات الفرشاة — كثيفة في الأعلى، تخف قرب التلال */
  const count = Math.round((w * h) / 420);
  for (let i = 0; i < count; i++) {
    const x = rand(-20, w + 20);
    const y = Math.pow(Math.random(), 1.25) * h * 0.9;
    const pal = palettes[Math.floor(rand(0, palettes.length))];
    stroke(ctx, field, x, y, rand(14, 40), rand(1.4, 3.2), pal[Math.floor(rand(0, pal.length))], rand(0.25, 0.7));
  }

  /* النجوم — مواقع شبه ثابتة تحاكي اللوحة */
  const stars = [
    { fx: 0.12, fy: 0.10, r: 0.05 }, { fx: 0.26, fy: 0.22, r: 0.035 },
    { fx: 0.48, fy: 0.08, r: 0.042 }, { fx: 0.68, fy: 0.16, r: 0.03 },
    { fx: 0.06, fy: 0.34, r: 0.033 }, { fx: 0.33, fy: 0.44, r: 0.028 },
    { fx: 0.58, fy: 0.36, r: 0.026 }, { fx: 0.80, fy: 0.42, r: 0.032 },
    { fx: 0.90, fy: 0.25, r: 0.027 },
  ];
  const glowPts = [];
  const R = Math.min(w, h);
  stars.forEach((s) => {
    paintStar(ctx, s.fx * w, s.fy * h, Math.max(10, s.r * R * 1.6));
    glowPts.push({ x: s.fx, y: s.fy, r: s.r * R * 1.6 });
  });

  /* الهلال أعلى اليسار (بعيداً عن النصوص الوسطى) */
  paintMoon(ctx, w * 0.87, h * 0.09, Math.max(18, R * 0.052));
  glowPts.push({ x: 0.87, y: 0.09, r: Math.max(18, R * 0.052) * 1.5, moon: true });

  paintHills(ctx, w, h);
  paintCypress(ctx, w * 0.085, h + 8, h * 0.5);
  ctx.globalAlpha = 1;
  return glowPts;
}

/* طبقة توهّج النجوم — عناصر CSS تنبض فوق اللوحة (بلا رسم متكرر) */
function mountStarGlows(layer, pts) {
  if (!layer) return;
  layer.innerHTML = "";
  pts.forEach((p, i) => {
    const s = document.createElement("span");
    s.className = "star-glow" + (p.moon ? " star-glow--moon" : "");
    s.style.left = (p.x * 100) + "%";
    s.style.top = (p.y * 100) + "%";
    s.style.width = s.style.height = (p.r * 2.6) + "px";
    s.style.animationDelay = (i * 0.7) + "s";
    s.style.animationDuration = rand(2.6, 4.6) + "s";
    layer.appendChild(s);
  });
}

/* ===== دوّار الشمس: زهرة واحدة مرسومة ===== */
function paintSunflower(ctx, x, y, r, rot) {
  const P = VG.sun;
  /* ورقتان خضراوان خلف الرأس */
  ctx.fillStyle = P.leaf; ctx.globalAlpha = 0.85;
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.ellipse(x + s * r * 0.8, y + r * 0.45, r * 0.5, r * 0.2, s * 0.7, 0, TAU);
    ctx.fill();
  });
  /* بتلات على طبقتين */
  [[1.0, 16, 0], [0.72, 12, 0.2]].forEach(([scale, n, off]) => {
    for (let i = 0; i < n; i++) {
      const a = rot + off + (i / n) * TAU;
      const px = x + Math.cos(a) * r * 0.55 * scale;
      const py = y + Math.sin(a) * r * 0.55 * scale;
      ctx.fillStyle = P.petals[Math.floor(rand(0, P.petals.length))];
      ctx.globalAlpha = rand(0.88, 1);
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.42 * scale, r * 0.15 * scale, a, 0, TAU);
      ctx.fill();
    }
  });
  /* القلب: قرص داكن ببذور حلزونية */
  ctx.globalAlpha = 1;
  ctx.fillStyle = P.heart[0];
  ctx.beginPath(); ctx.arc(x, y, r * 0.34, 0, TAU); ctx.fill();
  ctx.fillStyle = P.heart[1];
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996; // زاوية فيبوناتشي
    const rr = r * 0.05 + (i / 26) * r * 0.26;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, Math.max(0.8, r * 0.03), 0, TAU);
    ctx.fill();
  }
}

/* شريط دوّار الشمس الفاصل */
function paintSunrow(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const ctx = prep(canvas, w, h);
  const n = Math.max(7, Math.round(w / 74));
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w + rand(-8, 8);
    const y = h * rand(0.45, 0.62);
    paintSunflower(ctx, x, y, rand(16, 26), rand(0, TAU));
  }
}

/* بلاطة ليلية مصغّرة لخلايا العدّاد */
function paintMiniSky(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const ctx = prep(canvas, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#101f4a"); g.addColorStop(1, "#1d3766");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const field = makeField(w, h);
  for (let i = 0; i < 70; i++) {
    const pal = [VG.skyMid, VG.skyLight, VG.cream][Math.floor(rand(0, 3))];
    stroke(ctx, field, rand(0, w), rand(0, h), rand(8, 18), rand(1, 2), pal[Math.floor(rand(0, pal.length))], rand(0.2, 0.5));
  }
  paintStar(ctx, w * rand(0.25, 0.75), h * rand(0.2, 0.45), rand(6, 10));
  ctx.globalAlpha = 1;
}

/* سماء الختام (لوحة أفقية هادئة) */
function paintClosingSky(canvas) {
  const pts = paintSky(canvas);
  return pts;
}

/* رسم كل اللوحات — يُعاد عند تغيير المقاس */
let repaintTimer = null;
function paintAll() {
  const sky = document.getElementById("skyCanvas");
  if (sky) {
    const pts = paintSky(sky);
    mountStarGlows(document.getElementById("starGlows"), pts);
  }
  document.querySelectorAll("[data-sunrow]").forEach(paintSunrow);
  document.querySelectorAll("[data-minisky]").forEach(paintMiniSky);
  const closing = document.getElementById("closingSky");
  if (closing) paintClosingSky(closing);
}
window.addEventListener("resize", () => {
  window.clearTimeout(repaintTimer);
  repaintTimer = window.setTimeout(paintAll, 250);
});

/* ---------------- تعبئة المحتوى ---------------- */
function fillContent() {
  const c = WEDDING_CONFIG;
  setText("heroGroom", c.groom);
  setText("heroBride", c.bride);
  setText("heroInvite", c.heroSub);
  setText("heroDate", c.dateText);
  setText("verseText", c.verse);
  setText("invitationText", c.invitationText);
  setText("groomParents", c.groomParents);
  setText("brideParents", c.brideParents);
  setText("weddingDate", c.dateText);
  setText("weddingTime", c.timeText);
  setText("venueName", c.venueName);
  setText("venueAddr", c.venueAddr);
  setText("closingNote", c.closingNote);
  setText("closingHashtag", c.hashtag);
  setText("closingFamilies", c.closingFamilies);

  const mapBtn = document.getElementById("mapBtn");
  if (mapBtn && c.mapUrl) { mapBtn.href = c.mapUrl; }
  else if (mapBtn) { mapBtn.style.display = "none"; }

  const names = document.getElementById("preloaderNames");
  if (names && c.groom && c.bride) names.textContent = `${c.groom} & ${c.bride}`;

  buildTimeline(c.program);
  buildNotes(c.notes);
  buildContact(c);

  document.title = `دعوة زفاف ${c.groom} & ${c.bride}`;
}

function setText(id, value) { const el = document.getElementById(id); if (el && value != null) el.textContent = value; }

function loadImages() {
  const imgs = WEDDING_CONFIG.images || {};
  if (!imgs.venue) return;
  const img = new Image();
  img.onload = () => {
    const vp = document.getElementById("venuePhoto");
    const venue = document.querySelector(".venue");
    if (vp) vp.style.backgroundImage = `url("${imgs.venue}")`;
    if (venue) venue.classList.add("has-photo");
  };
  img.src = imgs.venue;
}

function buildTimeline(items) {
  const ul = document.getElementById("timeline");
  if (!ul || !Array.isArray(items)) return;
  ul.innerHTML = "";
  items.forEach((it) => {
    const li = document.createElement("li");
    li.className = "timeline__item";
    li.innerHTML = `<span class="timeline__dot" aria-hidden="true"></span>
      <span class="timeline__time">${it.time}</span>
      <span class="timeline__title">${it.title}</span>`;
    ul.appendChild(li);
  });
}

function buildNotes(items) {
  const ul = document.getElementById("notesList");
  if (!ul || !Array.isArray(items)) return;
  ul.innerHTML = "";
  items.forEach((txt) => {
    const li = document.createElement("li");
    li.className = "notes__item";
    li.innerHTML = `<span class="notes__mark" aria-hidden="true">✶</span><span>${txt}</span>`;
    ul.appendChild(li);
  });
  /* قسم بلا تنويهات لا يُترك بعنوانه — والملاحظة البارزة المحقونة تُنقل خارجه قبل إخفائه */
  if (!ul.children.length) {
    const sec = ul.closest(".notes");
    if (sec) {
      const note = sec.querySelector("#da3wa-note");
      if (note && sec.parentNode) sec.parentNode.insertBefore(note, sec);
      sec.style.display = "none";
    }
  }
}

function buildContact(c) {
  const link = document.getElementById("contactLink");
  const label = document.querySelector(".contact__label");
  if (label && c.contactLabel) label.textContent = c.contactLabel;
  if (!link) return;
  const wa = (c.contactPhone || "").replace(/[^0-9]/g, "");
  if (wa) {
    link.href = c.whatsappUrl || `https://wa.me/${wa}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = `<span aria-hidden="true">☎</span> `;
    link.appendChild(document.createTextNode(c.contactName ? c.contactName : c.contactPhone));
  } else {
    const box = document.getElementById("contactBox");
    if (box) box.style.display = "none";
  }
}

/* ---------------- ظهور الأقسام عند التمرير ---------------- */
function setupReveal() {
  const items = document.querySelectorAll(".creveal");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-visible")); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => obs.observe(el));
}

/* ---------------- العدّاد التنازلي (أرقام عربية) ---------------- */
function setupCountdown() {
  const target = new Date(WEDDING_CONFIG.date).getTime();
  if (isNaN(target)) return;
  const els = {
    days: document.getElementById("cdDays"), hours: document.getElementById("cdHours"),
    mins: document.getElementById("cdMins"), secs: document.getElementById("cdSecs"),
  };
  const cd = document.getElementById("countdown");
  const arrived = document.getElementById("cdArrived");
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { if (cd) cd.hidden = true; if (arrived) arrived.hidden = false; clearInterval(timer); return; }
    if (els.days) els.days.textContent = pad(Math.floor(diff / 86400000));
    if (els.hours) els.hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    if (els.mins) els.mins.textContent = pad(Math.floor((diff % 3600000) / 60000));
    if (els.secs) els.secs.textContent = pad(Math.floor((diff % 60000) / 1000));
  }
  const timer = setInterval(tick, 1000);
  tick();
}
function pad(n) { return toArabicDigits(String(n).padStart(2, "0")); }
function toArabicDigits(s) {
  const ar = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(s).replace(/[0-9]/g, (d) => ar[+d]);
}

/* ============================================================
   محرّك الدخول — فيديو فان كوخ + شريط تحميل (بنية classic العاملة)
   بعد الفيديو: تعتيم ليلي ثم تنكشف اللوحة المرسومة
   ============================================================ */
(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  /* زر موسيقى المنصّة (🎵) يبقى مخفياً طوال المقدمة — يظهر فقط بعد انتهاء الفيديو */
  const hideMusicStyle = document.createElement("style");
  hideMusicStyle.id = "vgHideMusic";
  hideMusicStyle.textContent = "#da3wa-music{display:none!important}";
  document.head.appendChild(hideMusicStyle);

  const body = document.body;
  const site = $("#site");
  const preloader = $("#preloader");
  const preloaderPoster = $("#preloaderPoster");
  const preloaderVideo = $("#preloaderVideo");
  const preloaderText = preloaderPoster ? $(".preloader-text", preloaderPoster) : null;
  const preloaderProgress = $("#preloaderProgress");
  const preloaderProgressBar = $("#preloaderProgressBar");
  const preloaderPercent = $("#preloaderPercent");
  let introTimer = null;
  let progressTimer = null;
  let introStarting = false;
  let introFinishing = false;
  let doorReady = false;          /* جهوزية الباب تُثبَّت ولا تُنقض — انظر updatePreloaderProgress */
  let doorFailed = false;         /* الفيديو أعلن عجزه: لا نُجرّبه ثانيةً ولا نُبقي الضيف ينتظر */
  let doorForced = false;         /* مضى وقت الأمان: يكفي أن تجهز الموسيقى ليُفتح الباب */
  const HAVE_CURRENT_DATA = 2;
  const HAVE_FUTURE_DATA = 3;
  const HAVE_ENOUGH_DATA = 4;

  function waitForAny(target, events, timeoutMs) {
    return new Promise((resolve, reject) => {
      let timer = null;
      const cleanup = () => {
        events.forEach((eventName) => target.removeEventListener(eventName, done));
        if (timer) window.clearTimeout(timer);
      };
      const done = (event) => { cleanup(); resolve(event); };
      events.forEach((eventName) => target.addEventListener(eventName, done, { once: true }));
      if (timeoutMs > 0) {
        timer = window.setTimeout(() => { cleanup(); reject(new Error("media timeout")); }, timeoutMs);
      }
    });
  }

  function hasFirstFrame(video) { return Boolean(video && video.readyState >= HAVE_CURRENT_DATA); }
  function clampPercent(value) { return Math.max(0, Math.min(100, Math.round(value))); }

  function getBufferedPercent(video) {
    if (!video) return 0;
    if (video.readyState >= HAVE_ENOUGH_DATA) return 100;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || !video.buffered?.length) {
      return hasFirstFrame(video) ? 35 : 0;
    }
    let bufferedEnd = 0;
    for (let index = 0; index < video.buffered.length; index += 1) {
      bufferedEnd = Math.max(bufferedEnd, video.buffered.end(index));
    }
    return clampPercent((bufferedEnd / duration) * 100);
  }

  /* جاهزية مشغّل موسيقى القالب: ننتظرها قبل تفعيل زر الفتح كي تنجح التهيئة الصامتة
     ضمن اللمسة (iOS). مهلة ٨ ثوانٍ حتى لا يعلق الدخول إن تعثّر يوتيوب. */
  let musicWaitExpired = false;
  window.setTimeout(() => { musicWaitExpired = true; updatePreloaderProgress(); }, 8000);
  /* يلتقط لحظة جاهزية المشغّل حتى لو اكتمل الفيديو قبله */
  const musicWatch = window.setInterval(() => {
    if (musicOk()) { window.clearInterval(musicWatch); updatePreloaderProgress(); }
  }, 250);
  function musicOk() {
    if (window.__da3waMusicReady === true) return true;
    if (!document.getElementById("da3wa-music")) return true; /* دعوة بلا موسيقى */
    return musicWaitExpired;
  }

  /* ــ الشريط: القياس شيء والعرض شيء آخر ــــــــــــــــــــــــــــــــــــــــ
     getBufferedPercent دالّة درجية لا خطّ متدرّج: يبقى صفراً حتى يقرأ المتصفح
     رأس الملف (moov)، ثم يقفز إلى ١٠٠ لحظة readyState=4؛ وكل نداء
     updatePreloaderProgress(100) كان يرسم ١٠٠٪ ثم تسحبه الدورة التالية إلى
     الوراء. فيرى الضيف «٠٪» ثابتة تقفز مرّةً واحدةً ثم تختفي، لا شريط تحميل.
     الآن: targetPercent يقيس، وshownPercent يصعد نحوه بنعومة ولا ينزل أبداً. */
  let shownPercent = 0;
  let loadSettled = false;
  let lastStepAt = 0;             /* «اكتمل» صار إعلاناً يُثبَّت لا رقماً يُرسم */
  const progressStartedAt = Date.now();
  const CREEP_FULL_MS = 9000;          /* زحف زمني حين لا يصل أي قياس من الفيديو */

  function targetPercent() {
    if (loadSettled) return 100;
    if (preloaderVideo && preloaderVideo.readyState >= HAVE_ENOUGH_DATA) return 100;
    const measured = getBufferedPercent(preloaderVideo);
    if (measured > 0) return Math.min(measured, 99);
    /* لا قياس بعد — تقدّم زمني حتى ٩٠٪ كي لا يتجمّد الشريط على صفر */
    return Math.min(90, ((Date.now() - progressStartedAt) / CREEP_FULL_MS) * 90);
  }

  function updatePreloaderProgress(forcePercent) {
    if (!preloaderVideo || !preloaderPoster) return;
    if (Number.isFinite(forcePercent) && forcePercent >= 100) loadSettled = true;
    const target = targetPercent();
    /* صعود مُخفَّف بوحدة زمنية لا بوحدة نبضة: يبلغ ١٠٠٪ في ٨٠٠ms تقريباً مهما
       تباطأت النبضات، فحتى القفزة المفاجئة تُرى امتلاءً لا وميضاً */
    const nowMs = Date.now();
    const frames = lastStepAt ? Math.min(6, (nowMs - lastStepAt) / 16.7) : 1;   /* لا قفزة بعد تجمّد التبويب */
    lastStepAt = nowMs;
    if (target > shownPercent) {
      shownPercent = Math.min(target, shownPercent + Math.max(0.38, (target - shownPercent) * 0.10) * frames);
    }
    const percent = clampPercent(shownPercent);
    /* الجهوزية تُثبَّت: زرٌّ يصير قابلاً للنقر ثم يعود يرفضه يبتلع ضغطات الضيف
       بصمت فيحبسه في شاشة البداية. ومؤقّت الأمان وحده لا يكفي هنا: الجهوزية
       مشروطة بالموسيقى أيضاً، وهي تتأخّر عنه، فنحفظ أن وقته مضى. */
    if ((loadSettled || percent >= 100 || preloaderVideo.readyState >= HAVE_FUTURE_DATA || doorForced) && musicOk()) doorReady = true;
    const ready = doorReady;
    preloaderPoster.classList.toggle("is-ready", ready);
    if (preloaderProgressBar) preloaderProgressBar.style.setProperty("--progress", shownPercent.toFixed(1) + "%");
    if (preloaderProgress) preloaderProgress.setAttribute("aria-valuenow", String(percent));
    if (preloaderPercent) preloaderPercent.textContent = `${percent}%`;
    if (shownPercent < 100) startProgressWatch();   /* الحلقة تُكمل الصعود ولو أُوقفت */
    if (introStarting || introFinishing) return;
    if (preloaderText) preloaderText.textContent = ready ? "اضغط لبدء الحكاية" : "جارٍ التحميل…";
  }

  /* تعذّر فيديو المقدّمة: لا ننتظر ما لن يأتي — ولا ننتظر الموسيقى كذلك،
     فالحكاية تُفتح بلا لوحة متحرّكة خيرٌ من ضيفٍ حبيس شاشة البداية. */
  function failOpenDoor() {
    doorFailed = true;
    doorReady = true;
    stopProgressWatch();
    updatePreloaderProgress(100);
  }

  function startProgressWatch() {
    if (progressTimer) return;
    /* ٢٥ms لا ٢٥٠: الصعود يُرسم لا يُقفز. setInterval لا rAF كي تبقى الجهوزية
       تتقدّم حتى لو غاب الضيف عن التبويب. */
    progressTimer = window.setInterval(() => {
      updatePreloaderProgress();
      if (shownPercent >= 100 && doorReady) stopProgressWatch();
    }, 25);
    updatePreloaderProgress();
  }
  function stopProgressWatch() {
    if (progressTimer) window.clearInterval(progressTimer);
    progressTimer = null;
  }

  async function waitForMediaReady(video, timeoutMs = 6000) {
    if (!video) return false;
    if (hasFirstFrame(video)) return true;
    video.preload = "auto";
    /* load() يُعيد التحميل من الصفر: لا نناديه والمتصفح يحمّل فعلاً (NETWORK_LOADING = 2)،
       فالضغطة المبكّرة تُكمل ما بدأ بدل أن تُهدره. آيفون لا يبدأ التحميل قبل اللمسة
       فيبقى دون هذه الحالة، وهناك load() داخل اللمسة هو ما يُطلقه. */
    if (video.networkState !== 2) {
      try { video.load(); } catch { return hasFirstFrame(video); }
    }
    try { await waitForAny(video, ["loadeddata", "canplay", "canplaythrough"], timeoutMs); }
    catch { return hasFirstFrame(video); }
    return hasFirstFrame(video);
  }

  async function startVideoPlayback(video, timeoutMs = 4500) {
    if (!video) return false;
    if (!video.paused && !video.ended) return true;
    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        await Promise.race([playPromise, waitForAny(video, ["playing", "timeupdate"], timeoutMs)]);
      } else {
        await waitForAny(video, ["playing", "timeupdate"], timeoutMs);
      }
    } catch { return false; }
    return !video.paused || video.currentTime > 0;
  }

  async function startPreloaderVideo() {
    /* الفيديو مكتوم دائماً — الكمان يعزف من عنصر صوت مستقل بدأ داخل اللمسة نفسها */
    preloaderVideo.muted = true;
    preloaderVideo.playsInline = true;
    preloaderVideo.preload = "auto";
    await waitForMediaReady(preloaderVideo, 8000);
    updatePreloaderProgress(100);
    try { preloaderVideo.currentTime = 0; } catch { /* بعض المتصفحات ترفض seek مبكراً */ }
    const started = await startVideoPlayback(preloaderVideo, 7000);
    if (introSound) { introSound.hidden = false; paintIntroSound(); }
    updatePreloaderProgress(100);
    return started;
  }

  /* عزف الكمان (ملف مستقل عن الفيديو) + زر كتمه */
  const introAudio = $("#introAudio");
  const introSound = $("#introSound");
  function paintIntroSound() { if (introSound) introSound.textContent = (introAudio && !introAudio.muted) ? "🔊" : "🔇"; }
  /* يُستدعى داخل لمسة الفتح مباشرة (قبل أي انتظار) — شرط iOS لتشغيل الصوت */
  function startViolin() {
    if (!introAudio) return;
    try { introAudio.currentTime = 0; } catch { /* لا شيء */ }
    introAudio.muted = false;
    introAudio.volume = 1;
    const p = introAudio.play();
    if (p && p.catch) p.catch(() => { /* رُفض الصوت — الفيديو يستمر صامتاً */ });
  }
  /* مزامنة خفيفة: حين يبدأ الفيديو فعلاً نطابق الكمان على زمنه */
  preloaderVideo.addEventListener("playing", () => {
    if (introAudio && !introAudio.paused) {
      try { introAudio.currentTime = preloaderVideo.currentTime; } catch { /* لا شيء */ }
    }
  }, { once: true });
  if (introSound) {
    introSound.addEventListener("click", (e) => {
      e.stopPropagation(); /* لا تصل لمشغّل موسيقى المنصّة ولا لتخطّي المقدمة */
      if (introAudio) introAudio.muted = !introAudio.muted;
      paintIntroSound();
    });
  }

  function armIntroTimer() {
    window.clearTimeout(introTimer);
    const duration = Number.isFinite(preloaderVideo.duration) && preloaderVideo.duration > 0 ? preloaderVideo.duration : 10;
    const currentTime = Number.isFinite(preloaderVideo.currentTime) ? preloaderVideo.currentTime : 0;
    const remainingMs = Math.max(2200, Math.ceil((duration - currentTime) * 1000) + 700);
    introTimer = window.setTimeout(finishIntro, remainingMs);
  }

  function revealHeroText() {
    $$(".hero .reveal, .hero .reveal-mask").forEach((element) => {
      const delay = Number(element.dataset.delay || 0);
      window.setTimeout(() => element.classList.add("is-in"), delay);
    });
  }

  function revealSite() {
    body.classList.remove("locked");
    site.classList.add("visible");
    paintAll();          // ترسم اللوحة لحظة الكشف (المقاسات صارت حقيقية)
    revealHeroText();
  }

  /* انطلاق موسيقى القالب مرة واحدة — مربوط بالثانية ٨ من الفيديو (نهايته) مباشرة،
     لا بمهلة الانتقال البصري. التخطي بالنقر يستدعيها فوراً أيضاً. */
  let musicHanded = false;
  function handOffMusic() {
    if (musicHanded) return;
    musicHanded = true;
    /* يتوقف الكمان وترتفع موسيقى القالب — كلاهما مجرد إيقاف/رفع صوت (مسموح بلا لمسة) */
    if (introAudio) { try { introAudio.pause(); } catch { /* لا شيء */ } }
    if (typeof window.__da3waMusicGo === "function") window.__da3waMusicGo();
  }
  const MUSIC_AT = 7.95; /* عتبة الثانية ٨ (timeupdate لا يضمن إصابة 8.00 تماماً) */
  preloaderVideo.addEventListener("timeupdate", () => {
    if (introStarting && preloaderVideo.currentTime >= MUSIC_AT) handOffMusic();
  });
  preloaderVideo.addEventListener("ended", handOffMusic);

  async function finishIntro() {
    if (!preloader || preloader.classList.contains("fade-out") || introFinishing) return;
    introFinishing = true;
    window.clearTimeout(introTimer);
    /* أسكِت عزف الكمان وسلّم الصوت لموسيقى القالب (المحددة في المحرّر) */
    try { preloaderVideo.pause(); } catch { /* لا شيء */ }
    if (introSound) introSound.hidden = true;
    hideMusicStyle.remove(); /* زر 🎵 يظهر الآن فقط — مع بدء موسيقى القالب */
    handOffMusic(); /* يغطي التخطي بالنقر — وعند النهاية الطبيعية سبق أن انطلقت عند الثانية ٨ */
    preloader.classList.add("nightfall");     // تعتيم ليلي بدل الوميض الأبيض
    window.setTimeout(() => {
      revealSite();
      preloader.classList.add("fade-out");
      window.setTimeout(() => preloader.classList.add("hidden"), 950);
    }, 520);
  }

  if (preloaderPoster && preloaderVideo) {
    preloaderVideo.load();
    startProgressWatch();
    window.setTimeout(() => {
      if (introStarting || introFinishing) return;
      doorForced = true;
      updatePreloaderProgress(100);
    }, 2500);
    /* متصفّحات آيفون لا تُحمّل الفيديو قبل لمسة الضيف، فيظلّ الشريط على ٠٪
       بلا طائل وينتظر الضيف انتظاراً لا ينتهي بشيء. فإن لم يبتلع العنصر
       بايتاً واحداً ولم يكن يُحمّل، الباب جاهز الآن — والتحميل يبدأ باللمسة. */
    window.setTimeout(() => {
      if (introStarting || introFinishing) return;
      if (preloaderVideo.readyState === 0 && preloaderVideo.networkState !== 2 && !preloaderVideo.buffered.length) {
        doorForced = true;
        updatePreloaderProgress(100);
      }
    }, 1000);


    /* أثناء المقدمة لا تصل اللمسات لمشغّل موسيقى المنصّة (وإلا تتصادم مع عزف الكمان).
       تخطّي المقدمة بالنقر يمرّر نقرته للمستند فتبدأ الموسيقى بلمسة حقيقية — انتقال سلس */
    preloader.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

    preloaderPoster.addEventListener("click", async (event) => {
      event.stopPropagation(); /* لمسة الفتح تشغّل الكمان لا موسيقى المنصّة */
      if (introStarting || introFinishing) return;
      /* ⚠️ لا تُبتلع ضغطة مبكّرة. كانت النقرة قبل جهوزية الباب — فيديو لم يُحمَّل بعد
         (شبكة بطيئة، آيفون لا يحمّل قبل اللمسة)، أو مشغّل موسيقى لم يجهز — تُتجاهَل
         بصمت، بينما تصل لمستُها مستمعَ الموسيقى على المستند فتنطلق الأغنية بلا أن
         يُفتح شيء، فيظنّ الضيف الزرّ معطوباً ويضغط ثانيةً بعد حين (شكوى ٢٠٢٦-٠٩-٢٢).
         الآن كل ضغطة تمضي في المسار نفسه: «جارٍ الفتح…» ثم انتظار الفيديو بمهلته
         داخل startPreloaderVideo، وحارس الثماني ثوانٍ يكشف الدعوة إن تعثّر —
         فالباب زينة والدعوة حقّ الضيف. */
      /* نهيّئ موسيقى القالب صامتةً ضمن هذه اللمسة — فتنطلق تلقائياً لحظة انتهاء الفيديو */
      if (typeof window.__da3waMusicPrime === "function") { try { window.__da3waMusicPrime(); } catch { /* لا شيء */ } }
      /* عزف الكمان يبدأ بنفس اللمسة (قبل أي انتظار) — فيتعايش الصوتان على iOS */
      startViolin();
      introStarting = true;
      preloaderPoster.classList.add("loading");
      preloaderPoster.setAttribute("aria-busy", "true");
      preloaderPoster.disabled = true;
      if (preloaderText) preloaderText.textContent = "تُرسَم اللوحة…";

      /* الفيديو أعلن عجزه سلفاً: لا معنى لانتظاره — تُكشف الحكاية الآن */
      if (doorFailed) {
        if (introAudio) { try { introAudio.pause(); } catch { /* لا شيء */ } }
        preloaderPoster.classList.add("hidden");
        finishIntro();
        return;
      }

      /* حارس النقرة: مهما تعثّرت اللوحة لا يبقى الضيف أمام «تُرسَم اللوحة…».
         يُلغى فور انطلاق الفيديو، فالمشهد الطبيعي لا يُقصّ. */
      const openGuard = window.setTimeout(() => {
        if (introFinishing) return;
        preloaderPoster.classList.add("hidden");
        finishIntro();
      }, 8000);

      const introStarted = await startPreloaderVideo();
      window.clearTimeout(openGuard);
      if (introFinishing) return;                 /* الحارس سبقنا وكشف الحكاية */

      if (!introStarted) {
        /* المقدّمة زينة، والدعوة حقّ الضيف: يُكشف المحتوى بلا لوحة */
        if (introAudio) { try { introAudio.pause(); } catch { /* لا شيء */ } }
        introStarting = false;
        preloaderPoster.classList.add("hidden");
        finishIntro();
        return;
      }

      preloaderPoster.classList.add("hidden");
      armIntroTimer();
      /* نقرة أثناء الفيديو = دخول فوري */
      preloader.addEventListener("click", finishIntro, { once: true });
    });

    ["loadedmetadata", "loadeddata", "canplay", "canplaythrough", "progress", "suspend", "stalled", "timeupdate"].forEach((eventName) => {
      preloaderVideo.addEventListener(eventName, updatePreloaderProgress);
    });
    preloaderVideo.addEventListener("ended", finishIntro);
    preloaderVideo.addEventListener("error", failOpenDoor);

    if (/[?&]autoopen=1/.test(location.search)) {
      const ao = window.setInterval(() => {
        if (preloaderPoster.classList.contains("is-ready")) { window.clearInterval(ao); preloaderPoster.click(); }
      }, 300);
    }
  } else {
    window.setTimeout(finishIntro, 600);
  }
})();

/* ---------------- تشغيل (نهاية body) ---------------- */
fillContent();
loadImages();
setupReveal();
setupCountdown();
