/* Nabz Bazar — the full RSI scanner extras, ported from the original rsi.html:
   fundamental analysis (CoinGecko + GitHub + DefiLlama), Binance futures positioning, Hyperliquid market stats,
   whale positions of the top 40 wallets (+ your own wallets) and the combined smart-money score. Same formulas as the original. */
"use strict";
(function () {
const { faN, pct, esc, dl, usdS, usdM, ago, I, clamp } = NB;
const SC = NB.SC = {};
const ls = k => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };

/* ---------------- whales (Hyperliquid) ---------------- */
SC.customWallets = () => ls("set:hlw").split(/[\s,;]+/).filter(x => /^0x[0-9a-fA-F]{40}$/.test(x));
/* aggregate long / short value per coin over every tracked wallet; "d" = change of the net since the last stored snapshot (≥30 min old) */
SC.aggregate = function (rows) {
  const agg = {};
  (rows || []).forEach(r => (r.pos || []).forEach(q => { const sym = /^k[A-Z0-9]/.test(q.c) ? q.c.slice(1) : q.c; const g = agg[sym] || (agg[sym] = { l: 0, s: 0, nl: 0, ns: 0 }); if (q.L) { g.l += q.val; g.nl++; } else { g.s += q.val; g.ns++; } }));
  const net = {}, now = Date.now(); Object.keys(agg).forEach(k => { net[k] = agg[k].l - agg[k].s; });
  let prev = null; try { prev = JSON.parse(ls("hlprev") || "null"); } catch (e) { }
  let since = 0;
  if (prev && now - prev.ts > 30 * 60000 && now - prev.ts < 3 * 864e5) { Object.keys(agg).forEach(k => { agg[k].d = net[k] - ((prev.net && prev.net[k]) || 0); }); since = prev.ts; }
  if (!prev || now - prev.ts > 60 * 60000) { try { localStorage.setItem("hlprev", JSON.stringify({ ts: now, net })); } catch (e) { } }
  return { agg, since, n: (rows || []).length };
};
SC.whaleOf = function (sym) {
  const W = NB.S.wh, g = W && W.agg[sym]; if (!g) return null;
  const t = g.l + g.s; if (t < 200000 || g.nl + g.ns < 2) return null;
  return { net: Math.round((g.l - g.s) / t * 100), p: Math.round(g.l / t * 100), l: g.l, s: g.s, nl: g.nl, ns: g.ns, d: g.d };
};
/* combined smart-money score: candle flow 55% + whales' net long/short 45% */
SC.sf = function (c, k) {
  const v = c[k || NB.S.rsiMode], f = v && v.f != null ? v.f : null, w = SC.whaleOf(c.sym);
  if (f === null && !w) return null; if (!w) return f; if (f === null) return w.net;
  return Math.round(.55 * f + .45 * w.net);
};

/* ---------------- Binance futures for one coin ---------------- */
SC.loadFutures = function (sym) {
  const q = encodeURIComponent(sym) + "USDT", b = "https://fapi.binance.com";
  const get = p => NB.getJSON(b + p, { timeout: 12000 }).catch(() => null);
  const key = "fu_" + sym, c = NB.peek(key);
  if (c && Date.now() - c.t < 10 * 60000) return Promise.resolve(c.v);
  return Promise.all([get("/futures/data/topLongShortPositionRatio?symbol=" + q + "&period=1d&limit=7"), get("/futures/data/globalLongShortAccountRatio?symbol=" + q + "&period=1d&limit=7"),
    get("/futures/data/openInterestHist?symbol=" + q + "&period=1d&limit=8"), get("/fapi/v1/premiumIndex?symbol=" + q), get("/futures/data/takerlongshortRatio?symbol=" + q + "&period=1d&limit=7")]).then(a => {
    const top = Array.isArray(a[0]) && a[0].length ? a[0] : null, glob = Array.isArray(a[1]) && a[1].length ? a[1] : null, oi = Array.isArray(a[2]) && a[2].length > 1 ? a[2] : null,
      fp = a[3] && a[3].lastFundingRate !== undefined ? a[3] : null, tk = Array.isArray(a[4]) && a[4].length ? a[4] : null;
    if (!top && !glob && !oi && !fp && !tk) return null;
    const d = {};
    if (tk) { const tl = tk.slice(-3); d.taker = tl.reduce((s, z) => s + (+z.buySellRatio || 0), 0) / tl.length; }
    if (top) { d.topNow = +top[top.length - 1].longAccount * 100; d.topOld = +top[0].longAccount * 100; }
    if (glob) d.globNow = +glob[glob.length - 1].longAccount * 100;
    if (oi) { const o0 = +oi[0].sumOpenInterestValue, o1 = +oi[oi.length - 1].sumOpenInterestValue; if (o0 > 0) d.oiCh = (o1 / o0 - 1) * 100; }
    if (fp) d.fund = +fp.lastFundingRate * 100;
    NB.cset(key, d); return d;
  });
};

/* ---------------- Hyperliquid market stats (funding, OI, volume per coin) ---------------- */
SC.loadHlm = () => NB.src("hlm", 10 * 60000, [{ n: "hl", u: "https://api.hyperliquid.xyz/info", m: "POST", b: { type: "metaAndAssetCtxs" }, parse: a => {
  const u = a[0].universe, cx = a[1], m = {};
  for (let i = 0; i < u.length; i++) { const c = cx[i]; if (!c || u[i].isDelisted) continue; const mk = +c.markPx, pv = +c.prevDayPx, s = /^k[A-Z0-9]/.test(u[i].name) ? u[i].name.slice(1) : u[i].name;
    m[s] = { fund: +c.funding * 100, oi: +c.openInterest * mk, vol: +c.dayNtlVlm, ch: pv > 0 ? (mk / pv - 1) * 100 : null }; }
  return m; } }], { big: true, timeout: 15000 });

/* ---------------- fundamentals (CoinGecko + GitHub + DefiLlama) ---------------- */
function slim(j) {
  const md = j.market_data || {}, ln = j.links || {};
  const gh = ((ln.repos_url && ln.repos_url.github) || []).filter(u => /github\.com\/[^\/]+\/[^\/#?]+/.test(u || ""));
  return { sent: j.sentiment_votes_up_percentage, watch: j.watchlist_portfolio_users, genesis: j.genesis_date, repos: gh, gh: [],
    mcap: md.market_cap && md.market_cap.usd, vol: md.total_volume && md.total_volume.usd, fdv: md.fully_diluted_valuation && md.fully_diluted_valuation.usd,
    ath: md.ath_change_percentage && md.ath_change_percentage.usd, c30: md.price_change_percentage_30d, c7: md.price_change_percentage_7d,
    circ: md.circulating_supply, tot: md.total_supply, max: md.max_supply, img: j.image && j.image.small };
}
const sumLast = (a, n) => { let t = 0; for (let i = Math.max(0, a.length - n); i < a.length; i++) t += +a[i] || 0; return t; };
async function github(urls) {
  const tok = ls("set:ghtok"), hd = tok ? { Authorization: "Bearer " + tok, Accept: "application/vnd.github+json" } : null;
  let limited = false;
  const gj = u => NB.rawReq(u, { timeout: 12000, headers: hd }).then(r => { if (r.status === 403 || r.status === 429) { limited = true; return null; } if (r.status !== 200) return null; try { return JSON.parse(r.text); } catch (e) { return null; } });
  const a = (await Promise.all(urls.slice(0, 2).map(u => { const m = u.match(/github\.com\/([^\/]+)\/([^\/#?]+)/); if (!m) return null; const repo = encodeURIComponent(m[1]) + "/" + encodeURIComponent(m[2].replace(/\.git$/, ""));
    return gj("https://api.github.com/repos/" + repo).then(r => r && { repo, name: r.full_name, pushed: r.pushed_at, stars: r.stargazers_count || 0, forks: r.forks_count || 0, arch: !!r.archived }); }))).filter(Boolean);
  if (!a.length) return { list: [], limited };
  a.sort((x, y) => new Date(y.pushed) - new Date(x.pushed));
  const best = a[0];
  const [p, rel] = await Promise.all([gj("https://api.github.com/repos/" + best.repo + "/stats/participation"), gj("https://api.github.com/repos/" + best.repo + "/releases/latest")]);
  const all = (p && p.all) || []; if (all.length >= 8) { best.c4 = sumLast(all, 4); best.c26 = sumLast(all, 26); }
  if (rel && rel.published_at) best.rel = rel.published_at;
  return { list: a, limited };
}
const chainsMap = () => NB.src("chainsg", 6 * 3600e3, [{ n: "llama", u: "https://api.llama.fi/v2/chains", parse: a => { const m = {}; (a || []).forEach(x => { if (x && x.gecko_id && x.tvl > 0) m[x.gecko_id] = x.tvl; }); return m; } }], { big: true, timeout: 15000 }).then(r => r.v).catch(() => null);
SC.loadDetail = async function (id) {
  const key = "det_" + id, c = NB.cgetBig(key);
  if (c && Date.now() - c.t < (c.v.ghLimited ? 30 * 60000 : 12 * 3600e3)) return c.v;
  const j = await NB.getJSON("https://api.coingecko.com/api/v3/coins/" + encodeURIComponent(id) + "?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false", { timeout: 20000 });
  const d = slim(j);
  const [g, ch] = await Promise.all([d.repos.length ? github(d.repos) : { list: [], limited: false }, chainsMap()]);
  d.gh = g.list; d.ghLimited = g.limited; d.tvl = ch && ch[id] > 0 ? ch[id] : null;
  NB.cset(key, d, true);
  return d;
};

/* ---------------- scores (same formulas as the original) ---------------- */
const lg = (x, full) => x > 0 ? clamp(Math.log10(1 + x) / Math.log10(1 + full) * 10, 0, 10) : 0;
const avg = a => { a = a.filter(x => x != null && isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
function devScore(d) {
  if (!d.gh || !d.gh.length) return null; let best = 0;
  d.gh.forEach(g => { const days = (Date.now() - new Date(g.pushed).getTime()) / 864e5, rec = days <= 7 ? 10 : days <= 30 ? 8 : days <= 90 ? 6 : days <= 180 ? 4 : days <= 365 ? 2 : .5;
    const parts = [[rec, .35], [lg(g.stars, 1e4), .15], [lg(g.forks, 3000), .10]];
    if (g.c4 != null) parts.push([lg(g.c4, 150), .25]);
    if (g.rel) { const rd = (Date.now() - new Date(g.rel).getTime()) / 864e5; parts.push([rd <= 90 ? 10 : rd <= 180 ? 7 : rd <= 365 ? 4 : 1, .15]); }
    let sw = 0, sv = 0; parts.forEach(p => { sw += p[1]; sv += p[0] * p[1]; }); let sc = sv / sw; if (g.arch) sc = Math.min(sc, 2); best = Math.max(best, sc); });
  return best;
}
function techScore(v) {
  if (!v || v.r == null) return null; const r = v.r; let s;
  if (r < 20) s = 10; else if (r < 30) s = 10 - (r - 20) * .15; else if (r < 45) s = 8.5 - (r - 30) * .3; else if (r < 70) s = 4 - (r - 45) * .1; else s = 1;
  if (v.x != null && v.x >= 0) s += 1.5;
  return clamp(s, 0, 10);
}
/* EnterCrypto comparison table, snapshot "Data as of May 2026": [name, overall/10, speculative upside/10, risk] */
const EXT = { "BTC": ["Bitcoin", 8.5, 6.0, "Medium"], "ETH": ["Ethereum", 8.3, 7.0, "Medium"], "XRP": ["XRP", 6.0, 6.0, "High"], "BNB": ["BNB", 6.2, 6.0, "High"], "SOL": ["Solana", 7.5, 8.0, "High"], "TRX": ["TRON", 4.7, 5.0, "Very High"], "FIGR": ["Figure Heloc", 4.7, 2.0, "High"], "DOGE": ["Dogecoin", 3.5, 6.0, "Very High"], "WBT": ["WhiteBIT Coin", 5.8, 6.0, "High"], "HYPE": ["Hyperliquid", 7.2, 8.0, "High"], "LEO": ["LEO Token", 5.5, 4.0, "High"], "ADA": ["Cardano", 6.0, 6.0, "High"], "BCH": ["Bitcoin Cash", 5.0, 5.0, "High"], "XMR": ["Monero", 6.5, 7.0, "Very High"], "LINK": ["Chainlink", 7.0, 7.0, "Medium"], "ZEC": ["Zcash", 5.5, 6.0, "High"], "CC": ["Canton", 6.8, 7.0, "Medium"], "XLM": ["Stellar", 6.5, 7.0, "Medium"], "LTC": ["Litecoin", 4.5, 4.0, "High"], "AVAX": ["Avalanche", 6.5, 7.0, "High"], "TON": ["Toncoin", 6.5, 7.0, "High"], "HBAR": ["Hedera", 5.8, 5.0, "High"], "SUI": ["Sui", 6.8, 7.0, "High"], "SHIB": ["Shiba Inu", 3.0, 5.0, "Very High"], "M": ["MemeCore", 3.8, 6.0, "Very High"], "RAIN": ["Rain", 5.8, 6.0, "High"], "CRO": ["Cronos", 4.8, 5.0, "High"], "TAO": ["Bittensor", 6.5, 7.0, "High"], "DOT": ["Polkadot", 5.0, 5.0, "Very High"], "UNI": ["Uniswap", 6.5, 6.0, "High"], "MNT": ["Mantle", 5.8, 6.0, "High"], "WLFI": ["World Liberty Financial", 3.2, 5.0, "Very High"], "PI": ["Pi Network", 4.0, 5.0, "Very High"], "SKY": ["Sky", 6.5, 6.0, "Medium"], "OKB": ["OKB", 5.8, 5.0, "High"], "HTX": ["HTX DAO", 3.5, 4.0, "Very High"], "ASTER": ["Aster", 5.5, 6.0, "High"], "PEPE": ["Pepe", 3.0, 6.0, "Very High"], "NEAR": ["NEAR Protocol", 5.2, 5.0, "Very High"], "ONDO": ["Ondo Finance", 6.8, 7.0, "High"], "BGB": ["Bitget Token", 5.8, 6.0, "High"], "ICP": ["Internet Computer", 5.5, 6.0, "Very High"], "AAVE": ["Aave", 7.0, 7.0, "High"], "ETC": ["Ethereum Classic", 5.0, 5.0, "High"], "MORPHO": ["Morpho", 6.5, 6.0, "High"], "KCS": ["KuCoin Token", 5.0, 5.0, "High"], "ALGO": ["Algorand", 4.5, 4.0, "Very High"], "POL": ["POL", 4.8, 5.0, "Very High"], "ENA": ["Ethena", 5.5, 6.0, "Very High"], "QNT": ["Quant", 6.5, 6.0, "High"], "RENDER": ["Render", 6.0, 6.0, "High"], "BCAP": ["Blockchain Capital", 5.5, 3.0, "Medium"], "KAS": ["Kaspa", 5.0, 5.0, "High"], "ATOM": ["Cosmos Hub", 5.0, 5.0, "Very High"], "NEXO": ["NEXO", 5.5, 5.0, "Medium"], "GT": ["Gate", 5.0, 5.0, "High"], "WLD": ["Worldcoin", 3.5, 5.0, "Very High"], "APT": ["Aptos", 5.5, 5.0, "Very High"], "SKYAI": ["SkyAI", 3.5, 5.0, "Very High"], "FIL": ["Filecoin", 5.0, 5.0, "Very High"], "ARB": ["Arbitrum", 5.5, 5.0, "Very High"], "JST": ["JUST", 4.5, 4.0, "High"], "PENGU": ["Pudgy Penguins", 3.5, 5.0, "Very High"], "PUMP": ["Pump.fun", 3.0, 5.0, "Very High"], "FLR": ["Flare", 5.0, 5.0, "High"], "VET": ["VeChain", 5.0, 4.0, "Very High"], "JUP": ["Jupiter", 5.5, 5.0, "Very High"], "BDX": ["Beldex", 4.0, 4.0, "High"], "LUNC": ["Terra Luna Classic", 2.5, 3.0, "Extreme"] };
const RISK_FA = { Low: "کم", Medium: "متوسط", High: "زیاد", "Very High": "خیلی زیاد", Extreme: "بحرانی" };
const TRACKWHALE = { BTC: "bitcoin", ETH: "ethereum", XRP: "xrp", TRX: "trx", XLM: "xlm", WLD: "wld", LINK: "link", UNI: "uni", AAVE: "aave", PEPE: "pepe", SHIB: "shib", ONDO: "ondo", ENA: "ena", LDO: "ldo", ETHFI: "ethfi", FET: "fet", SAND: "sand", POL: "pol", STRK: "strk", WLFI: "wlfi", PENDLE: "pendle", ENS: "ens", FLOKI: "floki", SYRUP: "syrup" };
function extFor(c) {
  if (!c || !c.sym || !EXT.hasOwnProperty(c.sym)) return null;
  const e = EXT[c.sym], a = String(e[0]).toLowerCase().split(/[\s(]/)[0], b = String(c.en || c.name || "").toLowerCase().split(/[\s(]/)[0];
  if (!a || !b || (a.indexOf(b) < 0 && b.indexOf(a) < 0)) return null;
  return { o: e[1], u: e[2], r: e[3] };
}
SC.scores = function (d, coin, v) {
  const ratio = d.mcap > 0 && d.vol >= 0 ? d.vol / d.mcap : null, cap = d.max > 0 ? d.max : d.tot > 0 ? d.tot : null;
  const supplyS = cap && d.circ > 0 ? clamp(d.circ / cap, 0, 1) * 10 : null;
  const years = d.genesis ? (Date.now() - new Date(d.genesis).getTime()) / (365.25 * 864e5) : null, ageS = years != null && isFinite(years) ? clamp(years / 6 * 10, 0, 10) : null;
  const rankS = coin.rank ? clamp(10 - 3.2 * Math.log10(coin.rank / 10), 0, 10) : null;
  const items = [
    { l: "تکنیکال", n: "RSI و MACD روی همین تایم‌فریم", v: techScore(v), w: .25 },
    { l: "بنیادی", n: "رتبه، سن پروژه، عرضه در گردش" + (d.tvl > 0 ? "، TVL شبکه" : ""), v: avg([rankS, ageS, supplyS, d.tvl > 0 ? lg(d.tvl, 2e10) : null]), w: .20 },
    { l: "توسعه", n: d.repos && d.repos.length ? (d.gh && d.gh.length ? "کامیت، آخرین نسخه و ستاره‌ها در GitHub" : d.ghLimited ? "محدودیت GitHub؛ توکن رو توی تنظیمات بذار" : "GitHub جواب نداد") : "مخزن GitHub ثبت نشده", v: devScore(d), w: .15 },
    { l: "جامعه و محبوبیت", n: "تعداد دنبال‌کننده‌ها در CoinGecko", v: d.watch > 0 ? lg(d.watch, 2e6) : null, w: .15 },
    { l: "نقدشوندگی", n: "حجم ۲۴ ساعته نسبت به مارکت‌کپ", v: ratio != null ? clamp(ratio / .08 * 10, 0, 10) : null, w: .15 },
    { l: "احساسات کاربرها", n: "رأی مثبت کاربرهای CoinGecko", v: d.sent > 0 ? d.sent / 10 : null, w: .10 }
  ];
  const baseCnt = items.filter(it => it.v != null && isFinite(it.v)).length, ext = extFor(coin);
  if (ext) { const counted = baseCnt <= 3; items.push({ l: "ارزیابی EnterCrypto", n: "داده‌ی مه ۲۰۲۶ · " + (counted ? "چون داده‌ی دیگه کم بود توی امتیاز کلی حساب شد" : "فقط نمایشی، توی امتیاز کلی حساب نشد"), v: ext.o, w: counted ? .15 : 0 }); }
  let sw = 0, sv = 0, cnt = 0, of = ext && baseCnt <= 3 ? 7 : 6;
  items.forEach(it => { if (it.w > 0 && it.v != null && isFinite(it.v)) { sw += it.w; sv += it.v * it.w; cnt++; } });
  const flags = [];
  if (ratio != null && ratio < .01) flags.push("حجم معاملات کمتر از ۱٪ مارکت‌کپه؛ ورود و خروج سخت میشه.");
  if (cap && d.circ > 0 && d.circ / cap < .3) flags.push("کمتر از ۳۰٪ عرضه در گردشه؛ آزاد شدن توکن‌های جدید می‌تونه فشار فروش بسازه.");
  if (years != null && years < 1) flags.push("کمتر از یک سال از شروع این ارز گذشته.");
  if (coin.rank && coin.rank > 300) flags.push("رتبه‌ی مارکت‌کپ پایینه؛ نوسان و ریسک بیشتره.");
  if (d.ath != null && d.ath < -90) flags.push("قیمت بیشتر از ۹۰٪ زیر قله‌ی تاریخیه.");
  return { items, total: sw ? sv / sw : null, count: cnt, of, ext, flags, ratio, supplyPct: cap && d.circ > 0 ? d.circ / cap * 100 : null, years };
};
const tone = v => v >= 7 ? "hi" : v >= 5 ? "mid" : "lo";
const verdict = v => v >= 7 ? "قوی" : v >= 5 ? "متوسط" : "ضعیف";
const sgn = (n, k = 1) => n == null || !isFinite(n) ? "—" : (n >= 0 ? "+" : "−") + faN(Math.abs(n), k) + "٪";
const facts = list => `<div class="facts">${list.map(f => `<div><small>${f[0]}</small><b>${f[1]}</b></div>`).join("")}</div>`;

/* ---------------- HTML blocks for the coin sheet ---------------- */
SC.detailHTML = function (d, c, v) {
  const S = SC.scores(d, c, v);
  let h = "";
  if (S.total != null) h += `<div class="total"><span class="tot tone-${tone(S.total)}">${faN(S.total, 1)}<small>از ۱۰</small></span><div><b>امتیاز کلی: ${verdict(S.total)}</b><small>میانگین وزنی ${faN(S.count)} معیار از ${faN(S.of)}. پیش‌بینی قیمت نیست.</small></div></div>`;
  h += '<div class="scores">' + S.items.map(it => it.v == null || !isFinite(it.v)
    ? `<div class="scr2"><div class="sl">${it.l}<small>${esc(it.n)}</small></div><span class="na">داده‌ی کافی نیست</span></div>`
    : `<div class="scr2"><div class="sl">${it.l}<small>${esc(it.n)}</small></div><div class="sb"><i class="tone-${tone(it.v)}" style="width:${Math.round(it.v * 10)}%"></i></div><b class="tone-${tone(it.v)}">${faN(it.v, 1)}</b></div>`).join("") + "</div>";
  if (S.flags.length) h += `<ul class="flags">${S.flags.map(f => `<li>${esc(f)}</li>`).join("")}</ul>`;
  const F = [["مارکت‌کپ", d.mcap ? usdS(d.mcap) : "—"], ["حجم ۲۴ ساعته", d.vol ? usdS(d.vol) : "—"], ["حجم به مارکت‌کپ", S.ratio != null ? faN(S.ratio * 100, 1) + "٪" : "—"],
    ["فاصله از قله‌ی تاریخی", sgn(d.ath)], ["تغییر ۷ روزه", sgn(d.c7)], ["تغییر ۳۰ روزه", sgn(d.c30)],
    ["عرضه در گردش", S.supplyPct != null ? faN(S.supplyPct, 0) + "٪ از سقف" : "—"], ["سن پروژه", S.years != null && isFinite(S.years) ? faN(S.years, 1) + " سال" : "—"], ["دنبال‌کننده‌ها", d.watch ? faN(d.watch) : "—"]];
  if (d.tvl > 0) F.push(["TVL شبکه (DeFiLlama)", usdS(d.tvl)]);
  if (d.gh && d.gh.length) { const g = d.gh[0]; F.push(["ستاره‌ی GitHub", faN(g.stars)]); F.push(["آخرین فعالیت کد", faN(Math.max(0, Math.round((Date.now() - new Date(g.pushed).getTime()) / 864e5))) + " روز پیش"]);
    if (g.c4 != null) F.push(["کامیت ۴ هفته‌ی اخیر", faN(g.c4)]); if (g.rel) F.push(["آخرین نسخه", faN(Math.max(0, Math.round((Date.now() - new Date(g.rel).getTime()) / 864e5))) + " روز پیش"]); }
  h += facts(F);
  if (S.ext) h += facts([["سطح ریسک (EnterCrypto)", RISK_FA[S.ext.r] || S.ext.r], ["پتانسیل سفته‌بازی (EnterCrypto)", faN(S.ext.u, 1) + " از ۱۰"]]);
  return h;
};
SC.flowHTML = function (v) {
  if (!v || v.f == null) return "";
  const fl = v.f >= 25 ? "ورود پول" : v.f <= -25 ? "خروج پول" : "خنثی";
  return `<h4 class="sh4">جریان پول (تخمینی) <span class="${v.f >= 25 ? "tx-up" : v.f <= -25 ? "tx-dn" : "mut"}">${fl} · ${v.f > 0 ? "+" : ""}${faN(v.f)}</span></h4>` +
    facts([["CMF (۲۰ کندل)", v.cm != null ? faN(v.cm, 2) : "—"], ["سهم خرید تهاجمی", v.tb != null ? faN(v.tb * 100, 0) + "٪" : "—"], ["حجم نسبت به میانگین", v.vs != null ? "×" + faN(v.vs, 1) : "—"]]);
};
SC.futHTML = function (d) {
  let h = '<h4 class="sh4">موقعیت معامله‌گرهای بزرگ <small class="mut">فیوچرز بایننس</small></h4>';
  if (d === undefined) return h + '<p class="mut sm">در حال دریافت…</p>';
  if (!d) return h + `<p class="mut sm">داده‌ای پیدا نشد؛ یا این ارز فیوچرز USDT توی بایننس نداره یا بایننس وصل نشد${NB.NET.vpn ? "" : " (بدون فیلترشکن باز نمیشه)"}.</p>`;
  const f = [];
  if (d.topNow !== undefined) f.push(["لانگ معامله‌گرهای بزرگ", faN(d.topNow, 0) + "٪ (۷ روز پیش " + faN(d.topOld, 0) + "٪)"]);
  if (d.globNow !== undefined) f.push(["لانگ کل معامله‌گرها", faN(d.globNow, 0) + "٪"]);
  if (d.oiCh !== undefined) f.push(["تغییر سرمایه‌ی باز ۷ روزه", sgn(d.oiCh)]);
  if (d.fund !== undefined) f.push(["نرخ تأمین مالی", sgn(d.fund, 3)]);
  if (d.taker !== undefined && isFinite(d.taker)) f.push(["خرید به فروش تهاجمی (۳ روز)", faN(d.taker, 2) + (d.taker > 1.05 ? " · خریدار قوی‌تر" : d.taker < .95 ? " · فروشنده قوی‌تر" : "")]);
  h += facts(f);
  if (d.topNow !== undefined && d.globNow !== undefined) { const diff = d.topNow - d.globNow;
    h += `<p class="sig">${diff >= 5 ? "معامله‌گرهای بزرگ از بقیه‌ی بازار لانگ‌ترن (" + faN(diff, 0) + " واحد درصد بیشتر)." : diff <= -5 ? "معامله‌گرهای بزرگ از بقیه‌ی بازار شورت‌ترن (" + faN(-diff, 0) + " واحد درصد کمتر لانگ)." : "موقعیت معامله‌گرهای بزرگ نزدیک به کل بازاره."}</p>`; }
  return h;
};
SC.hlHTML = function (c, m) {
  const w = SC.whaleOf(c.sym), s = SC.sf(c), f = [];
  let h = '<h4 class="sh4">پول هوشمند و هایپرلیکوید <small class="mut">API عمومی و رایگان</small></h4>';
  if (s != null) f.push(["امتیاز ترکیبی پول هوشمند", (s > 0 ? "+" : "") + faN(s)]);
  if (w) { f.push(["لانگ نهنگ‌ها", usdM(w.l) + " (" + faN(w.nl) + " کیف‌پول)"]); f.push(["شورت نهنگ‌ها", usdM(w.s) + " (" + faN(w.ns) + " کیف‌پول)"]);
    if (w.d !== undefined) f.push(["تغییر خالص از به‌روزرسانی قبل", (w.d >= 0 ? "+" : "−") + usdM(Math.abs(w.d))]); }
  if (m) { f.push(["تأمین مالی ساعتی HL", (m.fund >= 0 ? "+" : "") + m.fund.toFixed(4) + "%"]); f.push(["سرمایه‌ی باز در HL", usdS(m.oi)]); f.push(["حجم ۲۴ ساعته‌ی HL", usdS(m.vol)]); }
  if (!f.length) return h + `<p class="mut sm">${NB.S.wh && NB.S.wh.loading ? "در حال دریافت…" : "این ارز توی هایپرلیکوید معامله نمیشه یا نهنگ‌های ردیابی‌شده موقعیتی توش ندارن."}</p>`;
  h += facts(f);
  if (w) h += `<p class="sig">${w.p >= 65 ? "بیشتر پول نهنگ‌های برتر هایپرلیکوید روی لانگه (" + faN(w.p) + "٪)." : w.p <= 35 ? "بیشتر پول نهنگ‌های برتر هایپرلیکوید روی شورته (" + faN(100 - w.p) + "٪ شورت)." : "موقعیت نهنگ‌های برتر تقریباً متعادله."} ممکنه بخشی هج باشه؛ این سیگنال تأییدکننده‌ست نه پیش‌بینی.</p>`;
  return h;
};
SC.linksHTML = function (c) {
  const tw = TRACKWHALE[c.sym];
  return `<div class="links" style="margin-top:12px">
    <button class="lk" data-ext="https://www.coingecko.com/en/coins/${encodeURIComponent(c.id)}">صفحه در CoinGecko${I.ext}</button>
    <button class="lk" data-ext="${tw ? "https://trackwhale.io/" + tw + "-whale-tracker" : "https://trackwhale.io/exchange-flows"}">TrackWhale${tw ? " · " + esc(c.sym) : ""}${I.ext}</button>
    <button class="lk" data-ext="https://www.bithub.ge/en/diligence/${encodeURIComponent(c.id)}">گزارش Bithub${I.ext}</button>
    <button class="lk" data-ext="https://enter-crypto.com/crypto-reviews-comparison">جدول EnterCrypto${I.ext}</button>
    <button class="lk" data-ext="https://app.nansen.ai/">Nansen${I.ext}</button>
    <button class="lk" data-ext="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(({ Binance: "BINANCE", Bybit: "BYBIT", OKX: "OKX", KuCoin: "KUCOIN", Gate: "GATEIO" }[c.ex] || "BINANCE") + ":" + c.sym + "USDT")}">TradingView${I.ext}</button></div>
    <p class="mut xs lh" style="margin-top:10px">منبع: CoinGecko، GitHub و DefiLlama. CoinGecko آمار توییتر و تلگرام رو دیگه رایگان نمیده، برای همین امتیاز جامعه از تعداد دنبال‌کننده‌ها و رأی کاربرهاست. «جریان پول» تخمینی از حجم و قیمته و داده‌ی کیف‌پول‌های برچسب‌خورده نیست. این امتیازها توصیه‌ی خرید نیستن.</p>`;
};
SC.GUIDE = `<p><b>RSI:</b> ۱۴ دوره‌ای به روش Wilder. «جدید» یعنی کندل قبلی RSI بالاتر از آستانه بود و کندل فعلی وارد ناحیه‌ی اشباع فروش شده.</p>
  <p><b>MACD:</b> تقاطع صعودی یعنی خط MACD (۱۲ و ۲۶) خط سیگنال (۹) رو از پایین به بالا قطع کرده، وقتی هر دو زیر صفرن. تقاطع تا ۳ کندل اخیر نشون داده میشه.</p>
  <p><b>پول هوشمند:</b> شاخص تخمینی جریان پول از روی کندل‌ها: CMF، تغییر حجم‌های خرید و فروش، سهم خرید تهاجمی (فقط کندل‌های بایننس) و جهش حجم؛ از ۱۰۰− تا ۱۰۰+، از ۲۵+ «ورود پول» و از ۲۵− «خروج پول». اگه موقعیت ۴۰ کیف‌پول برتر هایپرلیکوید (به‌علاوه‌ی آدرس‌های دلخواه تو) برای اون ارز باشه، ۴۵٪ امتیاز از خالص لانگ و شورت اون‌ها و ۵۵٪ از شاخص کندلی میاد. لانگ بودن نهنگ‌ها ممکنه هج باشه و تضمین صعود نیست.</p>
  <p><b>تحلیل بنیادی:</b> با لمس هر ردیف باز میشه. امتیازها از ۱۰ و جمع‌بندی ساده‌ای از داده‌های CoinGecko و GitHub هستن؛ پیش‌بینی قیمت نیستن.</p>
  <p>فهرست ارزها از CoinGecko و کندل‌ها از بایننس، Bybit، OKX، KuCoin و Gate (به همین ترتیب). کندل‌ها به وقت UTC هستن: روزانه از ۰۳:۳۰ بامداد تهران. توی هفتگی ارزهایی بررسی میشن که حداقل ۲۰ هفته سابقه دارن. این ابزار توصیه‌ی خرید یا فروش نیست.</p>`;
})();
