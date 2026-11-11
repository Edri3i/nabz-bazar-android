/* Nabz Bazar — core: formatting, icons, charts, network with fallback routes, cache, data sources, indicators */
"use strict";
(function () {
const NB = window.NB = {};

/* ================= formatting ================= */
const faN = (v, d = 0) => (v == null || !isFinite(v)) ? "—" : Number(v).toLocaleString("fa-IR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v, d = 2) => faN(Math.abs(v), d) + "٪";
const dir = v => v > 0.005 ? "up" : v < -0.005 ? "dn" : "fl";
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dl = (v, d = 2) => v == null || !isFinite(v) ? "" : `<span class="dl ${dir(v)}">${v > 0.005 ? "▲" : v < -0.005 ? "▼" : ""} ${pct(v, d)}</span>`;
const cdec = v => v >= 1000 ? 0 : v >= 100 ? 2 : v >= 1 ? 3 : v >= 0.1 ? 4 : v >= 0.001 ? 5 : 7;
function usdS(v) { const a = Math.abs(v); return a >= 1e12 ? faN(v / 1e12, 2) + " تریلیون $" : a >= 1e9 ? faN(v / 1e9, 2) + " میلیارد $" : a >= 1e6 ? faN(v / 1e6, 1) + " میلیون $" : a >= 1e3 ? faN(v / 1e3, 1) + " هزار $" : faN(v, 0) + " $"; }
function usdM(v) { const a = Math.abs(v); return a >= 1e9 ? faN(v / 1e9, 2) + "B$" : a >= 1e6 ? faN(v / 1e6, 1) + "M$" : faN(v / 1e3, 0) + "K$"; }
function ago(t) {
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 20) return "همین الان"; if (s < 60) return faN(Math.round(s)) + " ثانیه پیش";
  if (s < 3600) return faN(Math.round(s / 60)) + " دقیقه پیش"; if (s < 86400) return faN(Math.round(s / 3600)) + " ساعت پیش";
  return faN(Math.round(s / 86400)) + " روز پیش";
}
const TZ = "Asia/Tehran";
const timeFa = d => new Date(d).toLocaleTimeString("fa-IR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dayFa = d => new Date(d).toLocaleDateString("fa-IR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const dateFa = (d, o) => new Date(d).toLocaleDateString("fa-IR", Object.assign({ timeZone: TZ }, o || { day: "numeric", month: "long" }));
const dayKey = d => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
const faD = s => String(s == null ? "" : s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]).replace(/\./g, "٫").replace(/%/g, "٪");
/* fear & greed colours: red (fear) → grey → green (greed) */
const fgColor = v => v < 25 ? "#D93A3F" : v < 45 ? "#F08A4B" : v <= 55 ? "#A6A6AE" : v <= 75 ? "#7CC46B" : "#15A34A";
Object.assign(NB, { faN, faD, fgColor, pct, dir, esc, dl, cdec, usdS, usdM, ago, timeFa, dayFa, dateFa, dayKey, TZ });

/* ================= icons ================= */
const st = (p, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const fl = p => `<svg viewBox="0 0 24 24" fill="currentColor">${p}</svg>`;
const I = NB.I = {
  pulse: st('<path d="M3 12h4l2.5-6.5 4 13 2.5-6.5H21"/>', 2.1),
  coins: st('<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>', 1.9),
  whale: st('<path d="M12 17.2v-5.4"/><path d="M12 11.9c-2.7 0-6.3-1.7-8-5.6 3-.4 6 .9 8 3.3 2-2.4 5-3.7 8-3.3-1.7 3.9-5.3 5.6-8 5.6z"/><path d="M3 20.2c1.5 0 1.5-1.1 3-1.1s1.5 1.1 3 1.1 1.5-1.1 3-1.1 1.5 1.1 3 1.1 1.5-1.1 3-1.1 1.5 1.1 3 1.1"/>', 1.8),
  cal: st('<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M12.6 12.4l-2.2 3.3h3.2l-2.2 3.3" stroke-width="1.7"/>', 1.9),
  gauge: st('<path d="M4.2 16.5a8.2 8.2 0 1 1 15.6 0"/><path d="M12 15.5l4.2-5"/><circle cx="12" cy="15.8" r="1.4" fill="currentColor"/>', 1.9),
  search: st('<circle cx="11" cy="11" r="6.6"/><path d="M20 20l-4.2-4.2"/>', 2.1),
  moon: st('<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z"/>', 2),
  sun: st('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>', 2),
  gear: st('<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>', 1.7),
  calc: st('<rect x="5" y="3" width="14" height="18" rx="3.2"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" stroke-width="2.4"/>', 1.9),
  pie: st('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5a9 9 0 0 1 5.5 5.5H15z"/>', 1.9),
  layers: st('<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/>', 1.8),
  star: st('<path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.8l-5.3 2.8 1-5.9-4.3-4.1 5.9-.8z"/>', 1.8),
  starF: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.8l-5.3 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg>',
  share: st('<path d="M12 15V3.5M7.5 7.5L12 3l4.5 4.5"/><path d="M5 12.5v5.5a2.5 2.5 0 0 0 2.5 2.5h9a2.5 2.5 0 0 0 2.5-2.5v-5.5"/>', 1.9),
  chev: st('<path d="M14.5 6l-6 6 6 6"/>', 2.2),
  chart: st('<path d="M4 19.5h16"/><path d="M6.5 15.5l4-4.5 3 2.5 4.5-6"/>', 2),
  info: st('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2" stroke-width="2.3"/>', 1.9),
  refresh: st('<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.8v4.6h-4.6"/>', 2),
  swap: st('<path d="M7 4v16M3.5 7.5L7 4l3.5 3.5M17 20V4M13.5 16.5L17 20l3.5-3.5"/>', 1.9),
  close: st('<path d="M6 6l12 12M18 6L6 18"/>', 2.2),
  wifi: st('<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.5a5 5 0 0 1 6.8 0"/><circle cx="12" cy="18.7" r="1.2" fill="currentColor"/>', 2),
  shield: st('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/>', 1.9),
  ext: st('<path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>', 1.9),
  drop: fl('<path d="M12 3c3.6 4.8 6 8 6 11a6 6 0 0 1-12 0c0-3 2.4-6.2 6-11z"/>'),
  bar: fl('<path d="M7.6 8.5h8.8l2.6 7.5H5z"/><path d="M4 17.2h16v2.3H4z" opacity=".5"/>'),
  barO: st('<path d="M7.6 8.5h8.8l2.6 7.5H5z"/><path d="M4 18.5h16"/>', 1.8),
  coin: st('<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4" stroke-width="1.4"/>', 1.9),
  btc: st('<path d="M8.4 5.6h4.9a2.9 2.9 0 0 1 0 5.8H8.4zM8.4 11.4h5.8a3.1 3.1 0 0 1 0 6.2H8.4zM8.4 5.6v12M10.4 3.6v2M13 3.6v2M10.4 17.6v2M13 17.6v2"/>', 2.1),
  eth: fl('<path d="M12 2.6 6.3 12 12 15.3 17.7 12z"/><path d="M12 16.5 6.3 13.2 12 21.4l5.7-8.2z" opacity=".55"/>'),
  sol: fl('<path d="M7.2 6h12.3l-2.6 2.7H4.6z"/><path d="M4.6 10.7h12.3l2.6 2.7H7.2z" opacity=".6"/><path d="M7.2 15.4h12.3l-2.6 2.7H4.6z"/>'),
  xrp: st('<path d="M5 5l4.6 4.4a3.4 3.4 0 0 0 4.8 0L19 5M5 19l4.6-4.4a3.4 3.4 0 0 1 4.8 0L19 19"/>', 2.2),
  bnb: fl('<path d="M12 3.2l2.8 2.8L12 8.8 9.2 6zM6.2 9.2 9 12l-2.8 2.8L3.4 12zM17.8 9.2l2.8 2.8-2.8 2.8L15 12zM12 15.2l2.8 2.8-2.8 2.8L9.2 18zM12 9.8l2.2 2.2-2.2 2.2L9.8 12z"/>'),
  usdt: st('<path d="M5.5 5.8h13M12 5.8v13.4"/><ellipse cx="12" cy="11.2" rx="6.4" ry="2"/>', 2.1),
  doge: st('<path d="M8 5h4.5a6.5 7 0 0 1 0 14H8zM5.5 12h7"/>', 2.1),
  ada: fl('<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="4.6" r="1.4"/><circle cx="12" cy="19.4" r="1.4"/><circle cx="5.6" cy="8.3" r="1.4"/><circle cx="18.4" cy="8.3" r="1.4"/><circle cx="5.6" cy="15.7" r="1.4"/><circle cx="18.4" cy="15.7" r="1.4"/>'),
  trx: st('<path d="M4 5l16 3.5-8.5 11.5z"/><path d="M4 5l7.5 15M20 8.5l-8.5 2.2"/>', 1.7)
};
const txt = t => `<span class="glyph">${esc(t)}</span>`;
const CLOGO = { BTC: I.btc, ETH: I.eth, SOL: I.sol, XRP: I.xrp, BNB: I.bnb, USDT: I.usdt, DOGE: I.doge, ADA: I.ada, TRX: I.trx };
const FXLOGO = { XAUUSD: I.bar, XAGUSD: I.barO, WTI: I.drop, BRENT: I.drop, EURUSD: txt("€"), GBPUSD: txt("£"), USDCHF: txt("Fr"), USDCAD: txt("C$"), NZDUSD: txt("NZ"), DXY: txt("$") };
/* real coin logos: CoinGecko image when known, then public icon CDNs, finally the old glyph */
NB.IMG = {};
try { NB.IMG = JSON.parse(localStorage.getItem("coinImg") || "{}") || {}; } catch (e) { }
let imgT = 0;
NB.setImg = (sym, url) => { sym = String(sym || "").toUpperCase(); if (!sym || !/^https:/.test(url) || NB.IMG[sym] === url) return; NB.IMG[sym] = url; clearTimeout(imgT); imgT = setTimeout(() => { try { localStorage.setItem("coinImg", JSON.stringify(NB.IMG)); } catch (e) { } }, 1500); };
const logoUrls = sym => { const l = String(sym).toLowerCase().replace(/[^a-z0-9]/g, ""); return [NB.IMG[String(sym).toUpperCase()], "https://assets.coincap.io/assets/icons/" + l + "@2x.png", "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/" + l + ".png"].filter(Boolean); };
NB.imgErr = el => { const u = JSON.parse(el.dataset.u || "[]"), i = +el.dataset.i + 1; if (i < u.length) { el.dataset.i = i; el.src = u[i]; } else { const g = document.createElement("span"); g.className = "glyph"; g.textContent = el.dataset.t || "?"; el.replaceWith(g); } };
const glyphT = sym => String(sym || "?").slice(0, sym && sym.length <= 3 ? 3 : 1);
NB.logo = (sym, kind) => {
  if (kind === "fx") return FXLOGO[sym] || txt(sym.slice(0, 2));
  if (!sym) return txt("?");
  const u = logoUrls(sym).filter(x => x), t = glyphT(sym);
  return `<img class="cimg" alt="" loading="lazy" referrerpolicy="no-referrer" src="${esc(u[0])}" data-i="0" data-u='${esc(JSON.stringify(u))}' data-t="${esc(t)}" onerror="NB.imgErr(this)">`;
};
NB.txt = txt;

/* ================= charts ================= */
function geo(pts, w, h, padX = 2, padT = 4, padB = 4) {
  const mn = Math.min(...pts), mx = Math.max(...pts), r = mx - mn || 1;
  const xs = pts.map((_, i) => padX + i * (w - 2 * padX) / Math.max(1, pts.length - 1));
  const ys = pts.map(v => padT + (1 - (v - mn) / r) * (h - padT - padB));
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = ((xs[i - 1] + xs[i]) / 2).toFixed(1);
    d += ` C${cx},${ys[i - 1].toFixed(1)} ${cx},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`;
  }
  return { d, xs, ys, mn, mx };
}
function sample(a, n) { if (!a || a.length <= n) return a || []; const o = [], s = (a.length - 1) / (n - 1); for (let i = 0; i < n; i++) o.push(a[Math.round(i * s)]); return o; }
let gid = 0;
NB.spark = function (pts, cls = "") {
  pts = (pts || []).filter(isFinite);
  const w = 62, h = 28;
  if (pts.length < 2) return `<svg class="spk ${cls}" viewBox="0 0 ${w} ${h}"><path d="M2 14H60" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 4" fill="none" opacity=".5"/></svg>`;
  pts = sample(pts, 40);
  const g = geo(pts, w, h, 2, 4, 4), n = pts.length - 1;
  return `<svg class="spk ${cls}" viewBox="0 0 ${w} ${h}"><path class="ln" d="${g.d}" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>` +
    `<circle cx="${g.xs[n].toFixed(1)}" cy="${g.ys[n].toFixed(1)}" r="2.3" fill="currentColor"/></svg>`;
};
NB.area = function (pts, w, h, o = {}) {
  pts = (pts || []).filter(isFinite);
  if (pts.length < 2) return `<div class="nochart" style="height:${h}px">داده‌ی نمودار در دسترس نیست</div>`;
  pts = sample(pts, o.max || 120);
  const g = geo(pts, w, h, o.padX ?? 0, o.padT ?? 6, o.padB ?? 0), id = "ga" + (++gid), n = pts.length - 1;
  const a = g.d + ` L${g.xs[n].toFixed(1)},${h} L${g.xs[0].toFixed(1)},${h} Z`;
  let dots = "";
  if (o.dots) o.dots.forEach(i => { if (i <= n) dots += `<circle cx="${g.xs[i].toFixed(1)}" cy="${g.ys[i].toFixed(1)}" r="3.2" fill="var(--card)" stroke="var(--area)" stroke-width="2"/>`; });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="overflow:visible"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="var(--area)" stop-opacity="${o.op ?? .14}"/><stop offset="1" stop-color="var(--area)" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="${a}" fill="url(#${id})"/><path class="ln" d="${g.d}" fill="none" stroke="var(--area)" stroke-width="${o.sw ?? 2}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${dots}` +
    (o.end ? `<circle cx="${g.xs[n].toFixed(1)}" cy="${g.ys[n].toFixed(1)}" r="4.5" fill="var(--area)" stroke="var(--card)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>` : "") + `</svg>`;
};

/* ================= network ================= */
const native = !!window.NBN;
NB.native = native;
const pending = {};
let seq = 0;
window.NBdone = function (id, status) {
  const p = pending[id]; if (!p) { if (native) NBN.take(id); return; }
  delete pending[id]; clearTimeout(p.t);
  p.res({ status, text: native ? NBN.take(id) : "" });
};
function rawReq(url, o = {}) {
  const timeout = o.timeout || 12000, method = o.method || (o.body ? "POST" : "GET"), body = o.body || "";
  if (native) return new Promise(res => {
    const id = "r" + (++seq);
    pending[id] = { res, t: setTimeout(() => { if (pending[id]) { delete pending[id]; res({ status: 0, text: "" }); } }, timeout + 4000) };
    if (o.headers) NBN.reqH(id, url, method, body, timeout, JSON.stringify(o.headers)); else NBN.req(id, url, method, body, timeout);
  });
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  return fetch(url, { method, body: body || undefined, headers: Object.assign(body ? { "content-type": "application/json" } : {}, o.headers || {}), signal: ctl.signal, cache: "no-store" })
    .then(async r => ({ status: r.status, text: await r.text() })).catch(() => ({ status: 0, text: "" })).finally(() => clearTimeout(t));
}
NB.rawReq = rawReq;
NB.getJSON = async function (url, o) { const r = await rawReq(url, o); if (r.status < 200 || r.status >= 300) throw new Error("http " + r.status); return JSON.parse(r.text); };
NB.hlTop = function (n) {
  if (!native) return NB.getJSON("https://stats-data.hyperliquid.xyz/Mainnet/leaderboard", { timeout: 90000 }).then(j => {
    const rows = []; (j.leaderboardRows || []).forEach(r => { const w = {}; (r.windowPerformances || []).forEach(x => { w[x[0]] = x[1]; }); const v = +r.accountValue;
      if (w.month && v >= 300000 && +w.month.pnl > 0 && +w.month.roi > 0 && w.allTime && +w.allTime.pnl > 0) rows.push({ a: r.ethAddress, n: r.displayName, p: Math.round(+w.month.pnl), v: Math.round(v) }); });
    return rows.sort((a, b) => b.p - a.p).slice(0, n);
  });
  return new Promise((res, rej) => {
    const id = "h" + (++seq);
    pending[id] = { res: r => { if (r.status === 200) { try { res(JSON.parse(r.text)); } catch (e) { rej(e); } } else rej(new Error("hl " + r.status)); }, t: setTimeout(() => { delete pending[id]; rej(new Error("timeout")); }, 120000) };
    NBN.hlTop(id, n);
  });
};

/* network mode: the app remembers which route works with the VPN on and which with it off */
NB.NET = { online: true, vpn: false, metered: true, wifi: false };
NB.readNet = function () { if (native) { try { Object.assign(NB.NET, JSON.parse(NBN.net())); } catch (e) { } } return NB.NET; };
const mode = () => NB.NET.vpn ? "v" : "d";

/* try routes in order (the last one that worked comes first); if one is slow, start the next in parallel */
function viaRoutes(key, routes, o = {}) {
  const timeout = o.timeout || 9000, hedge = o.hedge ?? 2400, mk = "rt:" + key + ":" + mode();
  const order = routes.map((_, i) => i);
  let best = -1; try { best = +localStorage.getItem(mk); } catch (e) { }
  if (best > 0 && best < routes.length) { order.splice(order.indexOf(best), 1); order.unshift(best); }
  return new Promise((resolve, reject) => {
    let done = false, next = 0, pend = 0, fails = 0;
    const launch = () => {
      if (done || next >= order.length) return;
      const i = order[next++], r = routes[i]; pend++;
      const url = typeof r.u === "function" ? r.u() : r.u;
      rawReq(url, { method: r.m, body: r.b ? JSON.stringify(r.b) : "", timeout: r.timeout || timeout }).then(res => {
        pend--; if (done) return;
        let v = null;
        if (res.status >= 200 && res.status < 300) { try { const j = JSON.parse(res.text); v = r.parse ? r.parse(j) : j; if (o.validate && !o.validate(v)) v = null; } catch (e) { v = null; } }
        if (v != null) { done = true; try { localStorage.setItem(mk, i); } catch (e) { } resolve({ v, route: r.n || i }); return; }
        if (++fails >= order.length) { done = true; reject(new Error("all routes failed: " + key)); return; }
        if (pend === 0) launch();
      });
      if (next < order.length && hedge > 0) setTimeout(() => { if (!done && pend > 0) launch(); }, hedge);
    };
    launch();
  });
}
NB.viaRoutes = viaRoutes;

/* ================= cache ================= */
const mem = {};
function cget(k) {
  if (mem[k]) return mem[k];
  try { const s = localStorage.getItem("c:" + k); if (s) return (mem[k] = JSON.parse(s)); } catch (e) { }
  return null;
}
function cgetBig(k) {
  if (mem[k]) return mem[k];
  try { const s = native ? NBN.load(k) : localStorage.getItem("b:" + k); if (s) return (mem[k] = JSON.parse(s)); } catch (e) { }
  return null;
}
function cset(k, v, big) {
  const o = { t: Date.now(), v }; mem[k] = o;
  try { const s = JSON.stringify(o); if (big) { if (native) NBN.save(k, s); else localStorage.setItem("b:" + k, s); } else localStorage.setItem("c:" + k, s); } catch (e) { }
  return o;
}
NB.cget = cget; NB.cgetBig = cgetBig; NB.cset = cset;

/* src(): cache-first source. Returns {v,t,stale?}. ttl in ms. */
const inflight = {};
NB.src = function (key, ttl, routes, o = {}) {
  const c = o.big ? cgetBig(key) : cget(key);
  if (c && !o.force && Date.now() - c.t < ttl) return Promise.resolve({ v: c.v, t: c.t, cached: true });
  if (inflight[key]) return inflight[key];
  const p = viaRoutes(key, routes, o).then(r => { const s = cset(key, r.v, o.big); return { v: r.v, t: s.t, route: r.route }; })
    .catch(e => { if (c) return { v: c.v, t: c.t, stale: true }; throw e; })
    .finally(() => { delete inflight[key]; });
  inflight[key] = p;
  return p;
};
NB.peek = (key, big) => { const c = big ? cgetBig(key) : cget(key); return c ? { v: c.v, t: c.t } : null; };

/* ================= endpoints ================= */
const CG = "https://api.coingecko.com/api/v3";
const BV = ["https://data-api.binance.vision", "https://api.binance.com", "https://api1.binance.com", "https://api3.binance.com"];
const FAPI = "https://fapi.binance.com";
const IRM = ["https://itsyebekhe.github.io/nabz", "https://raw.githubusercontent.com/itsyebekhe/nabz/main", "https://cdn.jsdelivr.net/gh/itsyebekhe/nabz@main"];
NB.worker = () => { let u = ""; try { u = localStorage.getItem("set:worker") || ""; } catch (e) { } return (u || "https://market-reaction-bot.ali-alasmia77.workers.dev").replace(/\/+$/, ""); };
const bv = path => BV.map((h, i) => ({ u: h + path, n: "binance" + i }));
NB.bv = bv;

const FA_NAMES = { bitcoin: "بیت‌کوین", ethereum: "اتریوم", binancecoin: "بی‌ان‌بی", ripple: "ریپل", solana: "سولانا", tron: "ترون", dogecoin: "دوج‌کوین", cardano: "کاردانو",
  "avalanche-2": "آوالانچ", chainlink: "چین‌لینک", stellar: "استلار", "the-open-network": "تون‌کوین", sui: "سویی", "shiba-inu": "شیبا اینو", hyperliquid: "هایپرلیکوید",
  litecoin: "لایت‌کوین", polkadot: "پولکادات", "bitcoin-cash": "بیت‌کوین کش", uniswap: "یونی‌سواپ", near: "نیر", aptos: "اپتوس", pepe: "پپه", "hedera-hashgraph": "هدرا",
  monero: "مونرو", zcash: "زی‌کش", "ethereum-classic": "اتریوم کلاسیک", "internet-computer": "اینترنت کامپیوتر", "crypto-com-chain": "کرونوس", dash: "دش", "leo-token": "لئو" };
const STABLE = new Set(("usdt usdc dai fdusd tusd usde usds usdd pyusd busd usdp gusd frax lusd susd eurc eurt usdy usdtb usd0 usdx rlusd bfusd usdf usdg usdt0 usd1 xaut paxg wbtc weth steth wsteth weeth cbbtc cbeth reth wbeth wbnb meth ezeth rseth lbtc solvbtc tbtc usdc.e usyc buidl bsc-usd susde sdai syrupusdc jitosol figr_heloc").split(" "));
NB.isStable = c => { const s = String(c.symbol || c.s || "").toLowerCase(); if (STABLE.has(s) || STABLE.has(c.id)) return true; const p = c.current_price ?? c.p; return !!(p && Math.abs(p - 1) < 0.03 && /usd|dollar|tether|stable/i.test((c.name || c.n || "") + " " + s)); };

/* crypto top 100 with 7d sparkline (CoinGecko), fallback: Binance 24h tickers for the coins we already know */
NB.loadMarkets = (force) => NB.src("mk", 40000, [
  { n: "coingecko", u: CG + "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h",
    parse: j => j.map(c => (c.image && NB.setImg(c.symbol, c.image), { id: c.id, s: String(c.symbol || "").toUpperCase(), n: FA_NAMES[c.id] || c.name, en: c.name, r: c.market_cap_rank, p: c.current_price,
      ch: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h, mc: c.market_cap, v: c.total_volume,
      sp: sample(((c.sparkline_in_7d && c.sparkline_in_7d.price) || []), 42).map(x => +(+x).toPrecision(6)), st: NB.isStable(c) ? 1 : 0 })) },
  { n: "binance", u: () => { const prev = (NB.peek("mk") || { v: [] }).v.filter(c => !c.st).slice(0, 60).map(c => c.s + "USDT"); return BV[0] + "/api/v3/ticker/24hr?symbols=" + encodeURIComponent(JSON.stringify(prev.length ? prev : ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT"])); },
    parse: j => { const prev = (NB.peek("mk") || { v: [] }).v, by = {}; j.forEach(t => { by[t.symbol.replace(/USDT$/, "")] = t; });
      const base = prev.length ? prev : Object.keys(by).map((s, i) => ({ id: s.toLowerCase(), s, n: s, en: s, r: i + 1, sp: [] }));
      return base.map(c => by[c.s] ? Object.assign({}, c, { p: +by[c.s].lastPrice, ch: +by[c.s].priceChangePercent }) : c); } }
], { force, validate: v => Array.isArray(v) && v.length > 5 });
NB.loadGlobal = () => NB.src("gl", 5 * 60000, [{ n: "coingecko", u: CG + "/global", parse: j => ({ dom: j.data.market_cap_percentage.btc, mc: j.data.total_market_cap.usd, mch: j.data.market_cap_change_percentage_24h_usd }) }]);

/* forex, metals, oil, DXY: straight from Yahoo Finance (the same source the friend's worker uses; one ~1.5 KB request for all ten),
   then the worker, then tokenised gold/silver as a last resort */
const YH = { EURUSD: "EURUSD=X", GBPUSD: "GBPUSD=X", USDCHF: "CHF=X", USDCAD: "CAD=X", NZDUSD: "NZDUSD=X", XAUUSD: "GC=F", XAGUSD: "SI=F", WTI: "CL=F", BRENT: "BZ=F", DXY: "DX-Y.NYB" };
const YQ = Object.values(YH).map(encodeURIComponent).join(",");
function yhOut(get) {
  const o = {};
  Object.keys(YH).forEach(k => { const r = get(YH[k]); if (!r) return; const cl = (r.close || []).filter(v => v != null && isFinite(v)); if (!cl.length) return;
    const p = cl[cl.length - 1], pc = r.prev || cl[0], ts = r.ts || [];
    o[k] = { p, ch: pc ? (p - pc) / pc * 100 : null, sp: cl, t: (ts[ts.length - 1] || 0) * 1000 }; });
  return Object.keys(o).length >= 5 ? o : null;
}
NB.loadFx = (force) => NB.src("fx", 40000, [
  { n: "yahoo2", u: "https://query2.finance.yahoo.com/v8/finance/spark?symbols=" + YQ + "&range=1d&interval=30m", parse: j => yhOut(s => j[s] && { close: j[s].close, prev: j[s].chartPreviousClose, ts: j[s].timestamp }) },
  { n: "yahoo1", u: "https://query1.finance.yahoo.com/v8/finance/spark?symbols=" + YQ + "&range=1d&interval=30m", parse: j => yhOut(s => j[s] && { close: j[s].close, prev: j[s].chartPreviousClose, ts: j[s].timestamp }) },
  { n: "worker", u: () => NB.worker() + "/prices", parse: j => { const o = {}; Object.keys(j.items || {}).forEach(k => { const it = j.items[k]; if (isFinite(it.price)) o[k] = { p: it.price, ch: it.change, sp: (it.points || []).map(x => Array.isArray(x) ? x[1] : (x && x.p != null ? x.p : x)).filter(isFinite), t: (it.t || 0) * 1000 }; }); return Object.keys(o).length ? o : null; } },
  { n: "tokens", u: CG + "/coins/markets?vs_currency=usd&ids=pax-gold,kinesis-silver&sparkline=true&price_change_percentage=24h",
    parse: j => { const o = {}; j.forEach(c => { const k = c.id === "pax-gold" ? "XAUUSD" : c.id === "kinesis-silver" ? "XAGUSD" : null; if (k) o[k] = { p: c.current_price, ch: c.price_change_percentage_24h, sp: sample(c.sparkline_in_7d.price, 40), approx: 1, t: Date.now() }; }); return o; } }
], { force, hedge: 3000 });

NB.loadFng = () => NB.src("fng", 30 * 60000, [{ n: "alternative", u: "https://api.alternative.me/fng/?limit=7", parse: j => j.data.map(d => +d.value) }]);
NB.loadBtc30 = () => NB.src("btc30", 20 * 60000, [
  ...bv("/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=31").map(r => Object.assign(r, { parse: j => j.map(k => +k[4]) })),
  { n: "coingecko", u: CG + "/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily", parse: j => j.prices.map(p => p[1]).slice(-31) }
], { validate: v => v.length > 20 });

/* ---------- Iran: every route is tiny, so all are asked at once and the freshest answer wins ---------- */
function irStamp(d, fromWorker) {
  /* the worker writes updated_at in UTC; the GitHub copies write Tehran time */
  const s = String(d.updated_at || "").replace(" ", "T");
  if (!s) return 0;
  const t = Date.parse(s + (fromWorker ? "Z" : "+03:30"));
  return isFinite(t) ? t : 0;
}
/* tgju.org's live price file (~30 KB gzip, rial): mapped to the same shape as the worker's /iran */
const TGJU = { usd: "price_dollar_rl", eur: "price_eur", gbp: "price_gbp", aed: "price_aed", try: "price_try", cad: "price_cad", aud: "price_aud", cny: "price_cny", chf: "price_chf",
  sar: "price_sar", qar: "price_qar", kwd: "price_kwd", iqd: "price_iqd", rub: "price_rub", jpy: "price_jpy", gold_18k: "geram18", gold_24k: "geram24", gold_mesghal: "mesghal",
  coin_emami: "sekee", coin_bahar: "sekeb", coin_half: "nim", coin_quarter: "rob", coin_gram: "gerami" };
function fromTgju(j) {
  const c = j && j.current; if (!c || !c.price_dollar_rl) return null;
  const num = s => parseFloat(String(s).replace(/,/g, ""));
  const d = { chg: {} };
  Object.keys(TGJU).forEach(k => { const x = c[TGJU[k]]; if (!x) return; const v = num(x.p); if (!isFinite(v)) return; d[k] = v / 10; d.chg[k] = (x.dt === "low" ? -1 : 1) * (+x.dp || 0); });
  if (c.ons) d.gold_ounce = num(c.ons.p);
  if (c.oil_brent) d.oil = num(c.oil_brent.p);
  d.updated_at = c.price_dollar_rl.ts; /* Tehran time */
  return isFinite(d.usd) ? d : null;
}
NB.loadIran = function (force, onLate) {
  const key = "ir", c = cget(key);
  if (c && !force && Date.now() - c.t < 45000) return Promise.resolve({ v: c.v, t: c.t, cached: true });
  if (inflight[key]) return inflight[key];
  const routes = [{ n: "tgju", u: "https://call1.tgju.org/ajax.json", p: fromTgju, live: 1 }, { n: "tgju3", u: "https://call3.tgju.org/ajax.json", p: fromTgju, live: 1 },
    { n: "worker", u: NB.worker() + "/iran", w: 1, live: 1 }].concat(IRM.map((b, i) => ({ n: "mirror" + i, u: b + "/market.json?t=" + Math.floor(Date.now() / 60000) })));
  const fix = d => { if (typeof d.oil === "string") d.oil = parseFloat(d.oil); if (/^mirror/.test(d._src)) d._oilWti = 1; /* the GitHub copy's "oil" is WTI, not Brent */ return d; };
  const p = new Promise(resolve => {
    let best = null, left = routes.length, finished = false;
    const finish = () => { if (finished) return; finished = true; resolve(best); };
    routes.forEach(r => rawReq(r.u, { timeout: 12000 }).then(res => {
      left--;
      if (res.status === 200) { try {
        const raw = JSON.parse(res.text), d = r.p ? r.p(raw) : raw;
        if (d && isFinite(d.usd)) {
          const ts = irStamp(d, r.w); d._ts = ts; d._src = r.n;
          const fresher = !best || ts > best._ts;
          if (fresher) best = d;
          if (finished && fresher && onLate) { const s = cset(key, fix(d)); onLate({ v: d, t: s.t }); }
          /* a live source that is less than half an hour old is good enough to show at once */
          if (r.live && Date.now() - ts < 30 * 60000) finish();
        } } catch (e) { } }
      if (!left) finish();
    }));
    setTimeout(finish, 7000);
  }).then(best => {
    if (!best) { if (c) return { v: c.v, t: c.t, stale: true }; throw new Error("iran"); }
    fix(best);
    const s = cset(key, best); return { v: best, t: s.t };
  }).finally(() => { delete inflight[key]; });
  inflight[key] = p; return p;
};

/* ---------- Tether in toman from several Iranian exchanges (some only answer without a VPN) ---------- */
/* buy = the lowest ask (what you pay), sell = the highest bid (what you get); p = the middle */
const USDT_EX = [
  { k: "nobitex", n: "نوبیتکس", u: "https://apiv2.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls", p: j => { const s = j.stats["usdt-rls"]; return { p: +s.latest / 10, buy: +s.bestSell / 10, sell: +s.bestBuy / 10, ch: +s.dayChange }; } },
  { k: "wallex", n: "والکس", u: "https://api.wallex.ir/v1/depth?symbol=USDTTMN", p: j => { const a = +j.result.ask[0].price, b = +j.result.bid[0].price; return { p: (a + b) / 2, buy: a, sell: b }; } },
  { k: "tabdeal", n: "تبدیل", u: "https://api1.tabdeal.org/r/api/v1/depth?symbol=USDTIRT&limit=5", p: j => { const a = +j.asks[0][0], b = +j.bids[0][0]; return { p: (a + b) / 2, buy: a, sell: b }; } }
];
NB.USDT_EX = USDT_EX;
NB.loadUsdt = function (onEach, only) {
  const c = cget("usdt") || { v: {} }, out = Object.assign({}, c.v);
  return Promise.all(USDT_EX.filter(e => !only || e.k === only).map(e => rawReq(e.u, { timeout: 8000 }).then(r => {
    if (r.status !== 200) return;
    try { const v = e.p(JSON.parse(r.text)); if (v && isFinite(v.p) && v.p > 10000) { out[e.k] = Object.assign(v, { t: Date.now() }); if (onEach) onEach(out); } } catch (err) { }
  }))).then(() => { Object.keys(out).forEach(k => { if (Date.now() - out[k].t > 6 * 3600e3 || !USDT_EX.some(e => e.k === k)) delete out[k]; }); cset("usdt", out); return out; });
};

/* Iranian price history (one file per item, GitHub + mirrors) */
NB.loadIrHist = key => NB.src("irh_" + key, 3600e3, IRM.map((b, i) => ({ n: "mirror" + i, u: b + "/api/history_" + key + ".json", parse: j => j.history.map(x => [x.timestamp * 1000, +x.price]).filter(x => isFinite(x[1])) })), { big: true, timeout: 15000, hedge: 3500 });

/* ---------- smart money ---------- */
NB.loadCoinPerps = () => NB.src("perps", 24 * 3600e3, [{ n: "fapi", u: FAPI + "/fapi/v1/exchangeInfo", parse: j => j.symbols.filter(s => s.underlyingType === "COIN" && s.contractType === "PERPETUAL" && s.status === "TRADING" && /USDT$/.test(s.symbol)).map(s => s.symbol) }], { timeout: 15000 });
NB.loadFut = (force) => NB.src("fut", 90000, [{ n: "fapi", u: FAPI + "/fapi/v1/premiumIndex", parse: j => { const o = {}; j.forEach(x => { o[x.symbol] = +x.lastFundingRate * 100; }); return o; } }], { force, timeout: 12000 });
NB.loadFut24 = (force) => NB.src("fut24", 90000, [{ n: "fapi", u: FAPI + "/fapi/v1/ticker/24hr", parse: j => { const o = {}; j.forEach(x => { o[x.symbol] = [+x.priceChangePercent, +x.quoteVolume]; }); return o; } }], { force, timeout: 15000 });
NB.loadLS = (sym, force) => NB.src("ls_" + sym, 5 * 60000, [{ n: "fapi", u: FAPI + "/futures/data/topLongShortPositionRatio?symbol=" + sym + "&period=1h&limit=1", parse: j => ({ l: +j[0].longAccount * 100, s: +j[0].shortAccount * 100 }) }], { force });
NB.loadOI = (sym, force) => NB.src("oi_" + sym, 5 * 60000, [{ n: "fapi", u: FAPI + "/futures/data/openInterestHist?symbol=" + sym + "&period=1h&limit=24", parse: j => { const a = +j[0].sumOpenInterestValue, b = +j[j.length - 1].sumOpenInterestValue; return { oi: b, co: (b - a) / a * 100 }; } }], { force });
NB.loadStable = () => NB.src("stable", 6 * 3600e3, [{ n: "llama", u: "https://stablecoins.llama.fi/stablecoincharts/all", parse: j => j.slice(-31).map(r => r.totalCirculatingUSD && r.totalCirculatingUSD.peggedUSD).filter(isFinite) }], { timeout: 20000, validate: v => v.length > 8 });
NB.loadChains = () => NB.src("chains", 6 * 3600e3, [{ n: "llama", u: "https://api.llama.fi/v2/chains", parse: j => j.filter(c => isFinite(c.tvl)).sort((a, b) => b.tvl - a.tvl).slice(0, 8).map(c => ({ n: c.name, t: c.tvl })) }], { timeout: 15000 });

/* Hyperliquid: the wallet list (39 MB leaderboard) is refreshed at most once a day, on Wi-Fi or by hand.
   Positions of those wallets are small requests and refresh every few minutes. */
NB.HL_SEED = window.HL_SEED || [];
NB.hlWallets = () => { const c = cget("hlw"); return (c && c.v && c.v.length ? c.v : NB.HL_SEED).slice(0, 40); };
NB.hlWalletsAge = () => { const c = cget("hlw"); return c ? c.t : 0; };
NB.refreshHlWallets = () => NB.hlTop(40).then(rows => { if (rows && rows.length) cset("hlw", rows); return rows; });
NB.loadHlPositions = function (force, n = 40) {
  const key = "hlpos", c = cget(key);
  if (c && !force && Date.now() - c.t < 6 * 60000) return Promise.resolve({ v: c.v, t: c.t, cached: true });
  if (inflight[key]) return inflight[key];
  /* the top 40 wallets (same filter as the original scanner) plus the user's own addresses from Settings */
  const ws = NB.hlWallets().slice(0, n);
  let mine = []; try { mine = (localStorage.getItem("set:hlw") || "").split(/[\s,;]+/).filter(x => /^0x[0-9a-fA-F]{40}$/.test(x)); } catch (e) { }
  mine.forEach(a => { if (!ws.some(w => w.a.toLowerCase() === a.toLowerCase())) ws.push({ a, n: "کیف‌پول من", mine: 1 }); });
  const out = new Array(ws.length);
  const p = NB.pool(ws.map((w, i) => ({ w, i })), 10, ({ w, i }) => rawReq("https://api.hyperliquid.xyz/info", { body: JSON.stringify({ type: "clearinghouseState", user: w.a }), timeout: 12000 }).then(r => {
    if (r.status !== 200) return;
    try {
      const s = JSON.parse(r.text);
      const pos = (s.assetPositions || []).map(x => { const q = x.position; return { c: q.coin, L: +q.szi > 0, val: Math.abs(+q.positionValue), lev: q.leverage && q.leverage.value, pnl: +q.unrealizedPnl }; }).filter(q => isFinite(q.val) && q.val > 0).sort((a, b) => b.val - a.val);
      out[i] = { a: w.a, n: w.n, p: w.p, v: +((s.marginSummary || {}).accountValue || w.v || 0), pos, mine: w.mine };
    } catch (e) { }
  })).then(() => {
    const rows = out.filter(Boolean);
    if (!rows.length) { if (c) return { v: c.v, t: c.t, stale: true }; throw new Error("hl"); }
    const s = cset(key, rows); return { v: rows, t: s.t };
  }).finally(() => { delete inflight[key]; });
  inflight[key] = p; return p;
};
NB.hlAgg = function (rows, top = 10) {
  const agg = {};
  (rows || []).slice(0, top).forEach(r => (r.pos || []).forEach(q => { const a = agg[q.c] || (agg[q.c] = { c: q.c, l: 0, s: 0, n: 0 }); if (q.L) a.l += q.val; else a.s += q.val; a.n++; }));
  return Object.values(agg).sort((a, b) => (b.l + b.s) - (a.l + a.s));
};

/* ---------- economic calendar (direct from the source: no CORS in the app) ---------- */
NB.loadCalendar = (force) => NB.src("cal", 15 * 60000, [
  { n: "ff", u: "https://nfs.faireconomy.media/ff_calendar_thisweek.json", parse: j => Array.isArray(j) && j.length && j[0].title ? { rows: j.map(r => Object.assign(r, { wk: "this" })) } : null },
  { n: "snapshot", u: "https://edri3i.github.io/market-reaction/calendar.json?t=" + Math.floor(Date.now() / 600000), parse: j => j && Array.isArray(j.thisweek) && j.thisweek.length ? { rows: j.thisweek.map(r => Object.assign(r, { wk: "this" })).concat((j.nextweek || []).map(r => Object.assign(r, { wk: "next" }))), news: j.news || [] } : null }
], { force, hedge: 2500 });
NB.loadCalNext = () => NB.src("cal2", 30 * 60000, [{ n: "ff", u: "https://nfs.faireconomy.media/ff_calendar_nextweek.json", parse: j => Array.isArray(j) ? j.map(r => Object.assign(r, { wk: "next" })) : null }], { timeout: 8000 });
NB.loadCalNews = () => NB.src("caln2", 15 * 60000, [{ n: "snapshot", u: "https://edri3i.github.io/market-reaction/calendar.json?t=" + Math.floor(Date.now() / 600000), parse: j => ({ news: j.news || [], next: (j.nextweek || []).map(r => Object.assign(r, { wk: "next" })) }) }], { timeout: 8000 });
NB.loadMove = t => NB.src("mv_" + t, 30 * 60000, [{ n: "worker", u: NB.worker() + "/move?t=" + Math.floor(t / 1000) }], { timeout: 9000 });

/* ---------- price charts for the detail sheet ---------- */
const RANGES = { "1": ["15m", 96, 1], "7": ["1h", 168, 7], "30": ["4h", 180, 30], "90": ["1d", 90, 90], "365": ["1d", 365, 365] };
NB.loadKlines = function (sym, range, cgId) {
  const R = RANGES[range];
  return NB.src("kl_" + sym + "_" + range, range === "1" ? 60000 : 5 * 60000, [
    ...bv(`/api/v3/klines?symbol=${sym}USDT&interval=${R[0]}&limit=${R[1]}`).map(r => Object.assign(r, { parse: j => j.map(k => [+k[0], +k[4]]) })),
    ...(cgId ? [{ n: "coingecko", u: `${CG}/coins/${cgId}/market_chart?vs_currency=usd&days=${R[2]}`, parse: j => j.prices }] : [])
  ], { validate: v => v.length > 5, hedge: 2500 });
};

/* ================= indicators (same maths as the original scanner) ================= */
function rsi(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  let gain = 0, loss = 0, i, d;
  for (i = 1; i <= period; i++) { d = closes[i] - closes[i - 1]; if (d >= 0) gain += d; else loss -= d; }
  let ag = gain / period, al = loss / period;
  for (i = period + 1; i < closes.length; i++) { d = closes[i] - closes[i - 1]; ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period; al = (al * (period - 1) + (d < 0 ? -d : 0)) / period; }
  if (al === 0) return ag === 0 ? 50 : 100;
  return 100 - 100 / (1 + ag / al);
}
function ema(v, p, start) {
  const out = new Array(v.length).fill(null);
  if (v.length - start < p) return out;
  const k = 2 / (p + 1); let s = 0;
  for (let i = start; i < start + p; i++) s += v[i];
  let e = s / p; out[start + p - 1] = e;
  for (let i = start + p; i < v.length; i++) { e = v[i] * k + e * (1 - k); out[i] = e; }
  return out;
}
function macdCross(closes, look = 3) {
  const e12 = ema(closes, 12, 0), e26 = ema(closes, 26, 0);
  const m = closes.map((_, i) => e26[i] !== null ? e12[i] - e26[i] : null), s = ema(m, 9, 25), n = closes.length;
  if (n < 2 || s[n - 1] === null) return null;
  if (!(m[n - 1] > s[n - 1])) return -1;
  for (let a = 0; a < look; a++) { const k = n - 1 - a; if (k < 1 || s[k] === null || s[k - 1] === null) break; if (m[k] > s[k] && m[k - 1] <= s[k - 1] && m[k] < 0 && s[k] < 0) return a; }
  return -1;
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function flowOf(cs) {
  if (!cs || cs.length < 22) return null;
  const w = cs.slice(-20); let mfv = 0, vs = 0;
  w.forEach(k => { if (!(k.v >= 0)) return; vs += k.v; const rg = k.h - k.l; if (rg > 0) mfv += ((k.c - k.l) - (k.h - k.c)) / rg * k.v; });
  if (!(vs > 0)) return null;
  const cmf = mfv / vs, t = cs.slice(-11); let obv = 0, sv = 0;
  for (let i = 1; i < t.length; i++) { const vol = t[i].v; if (!(vol >= 0)) continue; const d = t[i].c - t[i - 1].c; sv += vol; if (d > 0) obv += vol; else if (d < 0) obv -= vol; }
  const obvN = sv > 0 ? obv / sv : 0;
  let tbS = 0, tbV = 0; cs.slice(-5).forEach(q => { if (q.tb >= 0 && q.v > 0) { tbS += q.tb; tbV += q.v; } });
  const tb = tbV > 0 ? tbS / tbV : null;
  const prev = cs.slice(-23, -3); let pv = 0; prev.forEach(z => { pv += z.v >= 0 ? z.v : 0; });
  const avgPrev = prev.length ? pv / prev.length : 0; let rv = 0, rc = 0; cs.slice(-3).forEach(z => { if (z.v >= 0) { rv += z.v; rc++; } });
  const spike = avgPrev > 0 && rc ? (rv / rc) / avgPrev : null;
  const parts = [[clamp(cmf / 0.25, -1, 1), 0.4], [clamp(obvN / 0.4, -1, 1), 0.3]];
  if (tb !== null) parts.push([clamp((tb - 0.5) / 0.1, -1, 1), 0.3]);
  let sw = 0, sx = 0; parts.forEach(p => { sw += p[1]; sx += p[0] * p[1]; });
  return { f: Math.round(100 * sx / sw), cmf: Math.round(cmf * 100) / 100, tb: tb === null ? null : Math.round(tb * 1000) / 1000, vs: spike === null ? null : Math.round(spike * 10) / 10 };
}
function analyze(cs, minN) {
  const closes = cs.map(k => k.c);
  const r = closes.length >= minN ? rsi(closes) : null;
  const rp = r !== null && closes.length - 1 >= minN ? rsi(closes.slice(0, -1)) : null;
  const x = closes.length >= 36 ? macdCross(closes) : null;
  const f = flowOf(cs);
  return { r, rp, x, f: f ? f.f : null, cm: f ? f.cmf : null, tb: f ? f.tb : null, vs: f ? f.vs : null };
}
Object.assign(NB, { rsi, macdCross, flowOf, analyze, clamp, sample });

/* ================= RSI scanner ================= */
const TFS = NB.TFS = {
  "4h": { label: "۴ ساعته", ms: 4 * 3600e3, min: 40, bin: "4h", byb: "240", okx: "4H", kuc: "4hour", gate: "4h", ttl: 15 * 60000 },
  "1d": { label: "روزانه", ms: 864e5, min: 40, bin: "1d", byb: "D", okx: "1Dutc", kuc: "1day", gate: "1d", ttl: 45 * 60000 },
  "1w": { label: "هفتگی", ms: 7 * 864e5, min: 20, bin: "1w", byb: "W", okx: "1Wutc", kuc: "1week", gate: "7d", ttl: 4 * 3600e3 }
};
const LIMIT = 150;
const EX = [
  { n: "Binance", tick: () => NB.viaRoutes("tk_bn", bv("/api/v3/ticker/price").map(r => Object.assign(r, { parse: a => { const m = {}; a.forEach(x => { if (/USDT$/.test(x.symbol)) m[x.symbol.slice(0, -4)] = +x.price; }); return m; } }))).then(r => r.v),
    k: (b, tf, lim) => NB.viaRoutes("kl_bn", bv(`/api/v3/klines?symbol=${encodeURIComponent(b)}USDT&interval=${TFS[tf].bin}&limit=${lim}`).map(r => Object.assign(r, { parse: rows => rows.map(r => ({ t: +r[0], c: +r[4], h: +r[2], l: +r[3], v: +r[5], tb: +r[9] })) })), { hedge: 0, timeout: 10000 }).then(r => r.v) },
  { n: "Bybit", tick: () => NB.getJSON("https://api.bybit.com/v5/market/tickers?category=spot").then(j => { const m = {}; ((j.result && j.result.list) || []).forEach(x => { if (/USDT$/.test(x.symbol)) m[x.symbol.slice(0, -4)] = +x.lastPrice; }); return m; }),
    k: (b, tf, lim) => NB.getJSON(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${encodeURIComponent(b)}USDT&interval=${TFS[tf].byb}&limit=${lim}`).then(j => ((j.result && j.result.list) || []).map(r => ({ t: +r[0], c: +r[4], h: +r[2], l: +r[3], v: +r[5] })).reverse()) },
  { n: "OKX", tick: () => NB.getJSON("https://www.okx.com/api/v5/market/tickers?instType=SPOT").then(j => { const m = {}; (j.data || []).forEach(x => { if (/-USDT$/.test(x.instId)) m[x.instId.slice(0, -5)] = +x.last; }); return m; }),
    k: (b, tf, lim) => NB.getJSON(`https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(b)}-USDT&bar=${TFS[tf].okx}&limit=${Math.min(lim, 300)}`).then(j => (j.data || []).map(r => ({ t: +r[0], c: +r[4], h: +r[2], l: +r[3], v: +r[5] })).reverse()) },
  { n: "KuCoin", tick: () => NB.getJSON("https://api.kucoin.com/api/v1/market/allTickers").then(j => { const m = {}; ((j.data && j.data.ticker) || []).forEach(x => { if (/-USDT$/.test(x.symbol)) m[x.symbol.slice(0, -5)] = +x.last; }); return m; }),
    k: (b, tf, lim) => NB.getJSON(`https://api.kucoin.com/api/v1/market/candles?type=${TFS[tf].kuc}&symbol=${encodeURIComponent(b)}-USDT`).then(j => ((j && j.data) || []).slice(0, lim).map(r => ({ t: +r[0] * 1000, c: +r[2], h: +r[3], l: +r[4], v: +r[5] })).reverse()) },
  { n: "Gate", tick: () => NB.getJSON("https://api.gateio.ws/api/v4/spot/tickers").then(a => { const m = {}; a.forEach(x => { if (/_USDT$/.test(x.currency_pair)) m[x.currency_pair.slice(0, -5)] = +x.last; }); return m; }),
    k: (b, tf, lim) => NB.getJSON(`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(b)}_USDT&interval=${TFS[tf].gate}&limit=${lim}`).then(rows => rows.map(r => ({ t: +r[0] * 1000, c: +r[2], h: +r[3], l: +r[4], v: r[6] !== undefined ? +r[6] : +r[1] / +r[2] }))) }
];
NB.EX = EX;

function pool(items, limit, worker) {
  let i = 0; const run = () => i >= items.length ? Promise.resolve() : worker(items[i++]).then(run, run);
  return Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}
NB.pool = pool;
NB.rsiCached = tf => NB.peek("rsi_" + tf, true);

/* universe: top 500 coins by market cap (refreshed every 6 h); exchange listings refreshed every 12 h */
/* built-in list of the top 500 coins, used when CoinGecko rate-limits (it often does on shared mobile IPs) */
const seedUniv = from => (window.UNIV_SEED || []).slice(from || 0).map(r => ({ id: r[0], symbol: r[1], name: r[2], market_cap_rank: r[3] }));
function universe(force) {
  return NB.src("univ", 6 * 3600e3, [{ n: "coingecko", u: CG + "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false", parse: a => Array.isArray(a) && a.length ? a : null }], { big: true, force, timeout: 20000 })
    .catch(() => ({ v: seedUniv(0).slice(0, 250), seed: 1 }))
    .then(async r1 => {
      if (r1.seed) return seedUniv(0).filter(c => !NB.isStable(c)).map(c => ({ id: c.id, rank: c.market_cap_rank, sym: String(c.symbol).toUpperCase(), name: FA_NAMES[c.id] || c.name, en: c.name, price: null, ch: null }));
      let a = r1.v;
      const c2 = cgetBig("univ2");
      if (c2 && Date.now() - c2.t < 6 * 3600e3 && !force) a = a.concat(c2.v);
      else {
        /* CoinGecko's free API allows only a few calls a minute, so page 2 waits a little and retries once */
        const u2 = CG + "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2&sparkline=false";
        let p2 = null;
        for (let k = 0; k < 2 && !p2; k++) { await new Promise(r => setTimeout(r, k ? 6000 : 1200)); try { p2 = await NB.getJSON(u2, { timeout: 20000 }); } catch (e) { } }
        if (p2) { cset("univ2", p2, true); a = a.concat(p2); } else if (c2) a = a.concat(c2.v); else a = a.concat(seedUniv(250).filter(s => !a.some(x => x.id === s.id)));
      }
      return a.filter(c => !NB.isStable(c)).map(c => (c.image && NB.setImg(c.symbol, c.image), { id: c.id, rank: c.market_cap_rank, sym: String(c.symbol).toUpperCase(), name: FA_NAMES[c.id] || c.name, en: c.name, price: c.current_price, ch: c.price_change_percentage_24h, mc: c.market_cap, vol: c.total_volume }));
    });
}
async function listings(force) {
  const c = cgetBig("lst");
  if (c && !force && Date.now() - c.t < 12 * 3600e3) return c.v;
  const maps = await Promise.all(EX.map(e => e.tick().catch(() => null)));
  const v = maps.map(m => m || null);
  if (v.some(Boolean)) cset("lst", v, true);
  return v.some(Boolean) ? v : (c ? c.v : v);
}
/* scan: candles are cached per coin, so later scans only ask for the newest candles */
/* open time of the candle that is running now (Binance: UTC; weekly candles open on Monday) */
function candleOpen(tf, now) {
  const T = TFS[tf].ms;
  if (tf === "1w") { const mon = 4 * 864e5; return Math.floor((now - mon) / T) * T + mon; }
  return Math.floor(now / T) * T;
}
NB.rsiScan = async function (tf, onProgress, deep) {
  const T = TFS[tf];
  onProgress && onProgress(0.02, "در حال گرفتن فهرست ارزها…");
  const top = await universe(deep);
  onProgress && onProgress(0.08, "در حال گرفتن قیمت‌های لحظه‌ای…");
  const [maps, live] = await Promise.all([listings(deep), EX[0].tick().catch(() => null)]);
  const curOpen = candleOpen(tf, Date.now());
  if (!maps.some(Boolean)) throw new Error("NOEX");
  const plan = [], missing = [];
  top.forEach(coin => {
    const opts = [];
    maps.forEach((m, i) => { const p = m && m[coin.sym]; if (p > 0 && (!coin.price || Math.abs(p / coin.price - 1) < 0.25)) opts.push(i); });
    if (opts.length) plan.push({ coin, opts }); else missing.push(coin.sym);
  });
  const kc = cgetBig("kc_" + tf) || { v: {} }, kcache = kc.v || {};
  const results = []; let done = 0;
  let fast = 0;
  await pool(plan, 16, async job => {
    let res = null;
    for (const ei of job.opts) {
      const ck = EX[ei].n + ":" + job.coin.sym, old = kcache[ck];
      try {
        let rows;
        const fresh = old && old.length >= 30 && old[old.length - 1][0] > Date.now() - 20 * T.ms;
        const lp = live && live[job.coin.sym];
        if (fresh && ei === 0 && lp > 0 && old[old.length - 1][0] === curOpen) {
          /* same candle as last time: no request, just move the live candle to the current price */
          rows = old.slice(); const L = rows[rows.length - 1].slice();
          L[1] = lp; L[2] = Math.max(L[2], lp); L[3] = Math.min(L[3], lp); rows[rows.length - 1] = L; fast++;
        } else if (fresh && ei === 0) {
          const need = Math.min(LIMIT, Math.ceil((Date.now() - old[old.length - 1][0]) / T.ms) + 2);
          const add = await EX[ei].k(job.coin.sym, tf, need);
          const map = new Map(old.map(r => [r[0], r]));
          add.forEach(k => map.set(k.t, [k.t, k.c, k.h, k.l, k.v, k.tb]));
          rows = [...map.values()].sort((a, b) => a[0] - b[0]).slice(-LIMIT);
        } else {
          const ks = await EX[ei].k(job.coin.sym, tf, LIMIT);
          rows = ks.filter(k => isFinite(k.c) && isFinite(k.t)).sort((a, b) => a.t - b.t).map(k => [k.t, k.c, k.h, k.l, k.v, k.tb]);
        }
        if (rows.length < 16 || rows[rows.length - 1][0] < Date.now() - 2 * T.ms) continue;
        /* a pair with no trading (zero volume) gives a fake RSI of 0 or 100, so it is skipped */
        const recentVol = rows.slice(-20).reduce((s, r) => s + (r[4] > 0 ? r[4] : 0), 0);
        if (!(recentVol > 0)) continue;
        kcache[ck] = rows;
        res = { ex: EX[ei].n, rows }; break;
      } catch (e) { if (!NB.scanErr) NB.scanErr = String((e && e.stack) || e).slice(0, 300); }
    }
    done++;
    if (onProgress && (done % 6 === 0 || done === plan.length)) onProgress(0.1 + 0.9 * done / plan.length, `در حال محاسبه‌ی RSI… ${faN(done)} از ${faN(plan.length)}`, done % 60 === 0 ? { coins: results.slice(), missing: [], ts: Date.now(), partial: 1 } : null);
    if (!res) { missing.push(job.coin.sym); return; }
    const cs = res.rows.map(r => ({ t: r[0], c: r[1], h: r[2], l: r[3], v: r[4], tb: r[5] }));
    const isLive = cs[cs.length - 1].t + T.ms > Date.now();
    const c = job.coin;
    results.push({ id: c.id, rank: c.rank, sym: c.sym, name: c.name, en: c.en, price: cs[cs.length - 1].c, ch: c.ch, ex: res.ex,
      L: analyze(cs, T.min), C: analyze(isLive ? cs.slice(0, -1) : cs, T.min), sp: cs.slice(-30).map(k => k.c) });
  });
  cset("kc_" + tf, kcache, true);
  const out = { coins: results, missing, ts: Date.now(), fast };
  cset("rsi_" + tf, out, true);
  return out;
};
})();
