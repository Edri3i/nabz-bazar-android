/* Nabz Bazar — economic calendar logic (ported from reaction.html: event classes, currency sensitivities, scenarios) */
"use strict";
(function () {
const ASSETS = [
  { id: "XAUUSD", fa: "طلا", base: 6, unit: "دلار", dec: 0 }, { id: "EURUSD", fa: "یورو/دلار", base: 15, unit: "پیپ", dec: 0 },
  { id: "WTI", fa: "نفت", base: 0.5, unit: "دلار", dec: 1 }, { id: "XAGUSD", fa: "نقره", base: 0.12, unit: "دلار", dec: 2 },
  { id: "GBPUSD", fa: "پوند/دلار", base: 18, unit: "پیپ", dec: 0 }, { id: "USDCHF", fa: "دلار/فرانک", base: 15, unit: "پیپ", dec: 0 },
  { id: "USDCAD", fa: "دلار/دلار کانادا", base: 14, unit: "پیپ", dec: 0 }, { id: "NZDUSD", fa: "دلار نیوزیلند/دلار", base: 12, unit: "پیپ", dec: 0 },
  { id: "BTCUSD", fa: "بیت‌کوین", base: 0.6, unit: "درصد", dec: 1 }
];
const CUR_FA = { USD: "دلار", EUR: "یورو", GBP: "پوند", CHF: "فرانک", CAD: "دلار کانادا", NZD: "دلار نیوزیلند", CNY: "یوان", AUD: "دلار استرالیا", JPY: "ین" };
const SENS = {
  USD: { EURUSD: -.8, GBPUSD: -.7, USDCHF: .7, USDCAD: .6, NZDUSD: -.7, XAUUSD: -.8, XAGUSD: -.7, WTI: -.3, BTCUSD: -.4 },
  EUR: { EURUSD: .9, GBPUSD: .2, USDCHF: -.4, USDCAD: -.1, NZDUSD: .1, XAUUSD: .3, XAGUSD: .2, WTI: .1, BTCUSD: .1 },
  GBP: { EURUSD: .2, GBPUSD: .9, USDCHF: -.2, USDCAD: -.1, NZDUSD: .1, XAUUSD: .3, XAGUSD: .2, WTI: .1, BTCUSD: .1 },
  JPY: { EURUSD: .1, GBPUSD: .1, USDCHF: -.2, USDCAD: -.1, NZDUSD: -.1, XAUUSD: .2, XAGUSD: .1, WTI: -.1, BTCUSD: -.2 },
  CHF: { EURUSD: -.2, GBPUSD: 0, USDCHF: -.9, USDCAD: -.1, NZDUSD: 0, XAUUSD: .2, XAGUSD: .1, WTI: 0, BTCUSD: 0 },
  CAD: { EURUSD: .1, GBPUSD: .1, USDCHF: -.1, USDCAD: -.9, NZDUSD: .1, XAUUSD: .1, XAGUSD: .1, WTI: .4, BTCUSD: .1 },
  AUD: { EURUSD: .1, GBPUSD: .1, USDCHF: -.1, USDCAD: -.1, NZDUSD: .4, XAUUSD: .2, XAGUSD: .2, WTI: .1, BTCUSD: .2 },
  NZD: { EURUSD: .1, GBPUSD: .1, USDCHF: -.1, USDCAD: -.1, NZDUSD: .9, XAUUSD: .1, XAGUSD: .1, WTI: 0, BTCUSD: .1 },
  CNY: { EURUSD: .1, GBPUSD: .1, USDCHF: 0, USDCAD: -.1, NZDUSD: .3, XAUUSD: .2, XAGUSD: .3, WTI: .3, BTCUSD: .1 }
};
const OILSENS = { USDCAD: -.2, WTI: .9 };
const CL = [
  { re: /non-?farm|nfp/i, fa: "گزارش اشتغال غیرکشاورزی", f: 3, k: "data", d: "تعداد شغل‌های تازه در بخش غیرکشاورزی آمریکا در ماه گذشته. مهم‌ترین گزارش بازار کار و محرک اصلی انتظار نرخ بهره.", h: "از پرنوسان‌ترین گزارش‌های ماهانه‌ست. حرکت اول معمولاً تنده و گاهی ظرف چند ساعت برمی‌گرده. طلا و دلار بیشتر وقت‌ها خلاف هم حرکت می‌کنن." },
  { re: /unemployment rate/i, fa: "نرخ بیکاری", f: 2, k: "data", inv: 1, d: "درصد افرادی که دنبال کارن ولی کار ندارن. عدد بالاتر یعنی بازار کار ضعیف‌تر.", h: "معمولاً همراه گزارش اشتغال منتشر میشه و واکنشش با عدد شغل‌ها ترکیب میشه." },
  { re: /average hourly earnings|average earnings|wage price|wages/i, fa: "رشد دستمزد", f: 2, k: "data", d: "رشد دستمزدها؛ نشانه‌ای از فشار تورمی بازار کار.", h: "دستمزد بالاتر از انتظار یعنی تورم دیرتر پایین میاد و نرخ بهره بالاتر می‌مونه؛ معمولاً به نفع ارز و به ضرر طلا." },
  { re: /core pce/i, fa: "تورم هسته PCE", f: 2.5, k: "data", d: "شاخص محبوب فدرال رزرو برای تورم، بدون غذا و انرژی.", h: "چون عددش از قبل با CPI و PPI تا حدی حدس زده میشه، واکنشش معمولاً از CPI کوچیک‌تره." },
  { re: /core cpi/i, fa: "تورم هسته‌ی مصرف‌کننده (Core CPI)", f: 3, k: "data", d: "تغییر قیمت‌های مصرفی بدون غذا و انرژی؛ روند پایه‌ی تورم.", h: "تورم بالاتر از انتظار معمولاً دلار رو بالا و طلا و بیت‌کوین رو پایین می‌بره. حرکت اول اغلب سریعه." },
  { re: /cpi|inflation|prices? flash/i, fa: "تورم مصرف‌کننده (CPI)", f: 2.5, k: "data", d: "تغییر قیمت کالاها و خدمات مصرفی؛ معیار اصلی تورم.", h: "تورم بالاتر از پیش‌بینی احتمال نرخ بهره‌ی بالاتر رو زیاد می‌کنه و ارز رو تقویت می‌کنه." },
  { re: /ppi|producer price/i, fa: "تورم تولیدکننده (PPI)", f: 1.5, k: "data", d: "تغییر قیمت در سطح تولیدکننده؛ نشانه‌ی زودهنگام تورم آینده.", h: "معمولاً اثرش از CPI کوچیک‌تره." },
  { re: /fomc press conference/i, fa: "نشست خبری رئیس فدرال رزرو", f: 3, k: "cb", d: "لحن رئیس فدرال رزرو درباره‌ی مسیر نرخ بهره.", h: "نوسان معمولاً چندمرحله‌ایه و بعد از پرسش و پاسخ ممکنه جهت عوض بشه." },
  { re: /minutes/i, fa: "صورت‌جلسه‌ی بانک مرکزی", f: 2, k: "cb", d: "جزئیات بحث‌های نشست قبلی بانک مرکزی.", h: "چون تصمیم قبلاً اعلام شده، واکنش معمولاً ملایم‌تره." },
  { re: /speaks|speech|testif|press conference|statement of/i, fa: "سخنرانی مقام بانک مرکزی", f: 2, k: "cb", d: "هر اشاره به نرخ بهره یا تورم می‌تونه بازار رو حرکت بده.", h: "اگه حرف تازه‌ای نزنه، اثرش کمه." },
  { re: /rate (statement|decision)|policy rate|bank rate|cash rate|refinancing rate|overnight rate|monetary policy|fomc|federal funds|official bank/i, fa: "تصمیم نرخ بهره", f: 3, k: "cb", d: "تصمیم نرخ بهره و بیانیه‌ی همراهش؛ از پرتأثیرترین رویدادها.", h: "بازار معمولاً خود تصمیم رو از قبل قیمت‌گذاری کرده؛ لحن بیانیه مهم‌تره." },
  { re: /gdp/i, fa: "رشد اقتصادی (GDP)", f: 2, k: "data", d: "رشد اقتصاد در دوره‌ی گذشته؛ معیار کلی سلامت اقتصاد.", h: "رشد بالاتر از انتظار ارز رو تقویت می‌کنه، ولی اثرش از شاخص‌های ماهانه کندتره." },
  { re: /retail sales/i, fa: "خرده‌فروشی", f: 2, k: "data", d: "تغییر خرج‌کرد مصرف‌کننده‌ها.", h: "عدد اصلی و عدد بدون خودرو رو با هم ببین." },
  { re: /ism .*(pmi|manufacturing|services)|ism (manufacturing|services)/i, fa: "شاخص مدیران خرید ISM", f: 2.2, k: "data", d: "نظرسنجی از مدیران خرید آمریکا؛ بالای ۵۰ یعنی رشد.", h: "زیرشاخص اشتغال و قیمت‌ها گاهی از عدد اصلی مهم‌ترن." },
  { re: /pmi/i, fa: "شاخص مدیران خرید (PMI)", f: 1.5, k: "data", d: "بالای ۵۰ یعنی رشد و زیر ۵۰ یعنی انقباض.", h: "نسخه‌ی اولیه (Flash) معمولاً از نهایی مهم‌تره." },
  { re: /jolts|job openings/i, fa: "فرصت‌های شغلی (JOLTS)", f: 1.5, k: "data", d: "تعداد شغل‌های خالی آمریکا.", h: "معمولاً اثر متوسطی روی دلار داره." },
  { re: /adp/i, fa: "اشتغال بخش خصوصی ADP", f: 1.5, k: "data", d: "برآورد مستقل شغل‌های بخش خصوصی آمریکا.", h: "ارتباطش با گزارش رسمی همیشه قوی نیست." },
  { re: /claims/i, fa: "درخواست بیمه‌ی بیکاری", f: 1, k: "data", inv: 1, d: "تعداد درخواست‌های تازه‌ی بیمه‌ی بیکاری هفته‌ی گذشته.", h: "گزارش هفتگیه و معمولاً اثر کوچیکی داره." },
  { re: /crude oil inventor|oil inventor|eia crude/i, fa: "ذخایر نفت خام آمریکا", f: 1.6, k: "data", inv: 1, oil: 1, d: "تغییر ذخایر نفت آمریکا؛ کاهش ذخایر یعنی تقاضای بیشتر.", h: "اثرش بیشتر روی خود نفته." },
  { re: /employment change|employment$/i, fa: "تغییر اشتغال", f: 2.2, k: "data", d: "تعداد شغل‌های تازه در کشور مربوطه.", h: "برای دلار کانادا از مهم‌ترین گزارش‌هاست." },
  { re: /trade balance|current account/i, fa: "تراز تجاری", f: 1, k: "data", d: "اختلاف صادرات و واردات.", h: "معمولاً واکنش کوچیکی داره." },
  { re: /confidence|sentiment|zew|ifo|tankan/i, fa: "شاخص اعتماد", f: 1.2, k: "data", d: "نظرسنجی درباره‌ی آینده‌ی اقتصاد.", h: "اثرش معمولاً کوتاه و کوچیکه." },
  { re: /durable goods|industrial production|manufacturing production/i, fa: "تولید و سفارش‌های صنعتی", f: 1.3, k: "data", d: "وضعیت تولید و سرمایه‌گذاری صنعتی.", h: "اثر متوسطی داره." }
];
const DEF = { fa: "", f: 1.3, k: "data", d: "رویداد اقتصادی؛ فاصله‌ی عدد واقعی با پیش‌بینی جهت ارز رو مشخص می‌کنه.", h: "سابقه‌ی جداگانه‌ای برای این نوع رویداد ثبت نشده." };
function classify(t, imp) { for (const c of CL) if (c.re.test(t)) return c; const c = Object.assign({}, DEF); if (imp === "High") c.f = 1.8; return c; }
function pnum(s) { if (s == null || s === "") return null; const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/); if (!m) return null; const u = String(s).slice(-1).toUpperCase(); return parseFloat(m[0]) * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[u] || 1); }
NB.calNormalize = function (rows) {
  const out = [];
  (rows || []).forEach((r, i) => {
    if (!r || (r.impact !== "High" && r.impact !== "Medium")) return;
    const cur = String(r.country || "").toUpperCase(); if (cur === "AUD" || cur === "JPY") return;
    const ts = new Date(r.date).getTime(); if (!isFinite(ts)) return;
    out.push({ id: (r.wk || "this") + "-" + i, title: r.title, cur, ts, impact: r.impact, fc: r.forecast || "", pv: r.previous || "", ac: r.actual || "", wk: r.wk || "this", c: classify(r.title, r.impact) });
  });
  return out.sort((a, b) => a.ts - b.ts);
};
/* official release dates (from the original reaction page), shown only where the live calendar has nothing yet */
const FALLBACK = [
  { title: "CPI y/y", country: "USD", date: "2026-11-10T13:30:00Z", impact: "High" }, { title: "Core CPI m/m", country: "USD", date: "2026-11-10T13:30:00Z", impact: "High" },
  { title: "PPI m/m", country: "USD", date: "2026-11-13T13:30:00Z", impact: "Medium" }, { title: "Retail Sales m/m", country: "USD", date: "2026-11-17T13:30:00Z", impact: "High" },
  { title: "FOMC Meeting Minutes", country: "USD", date: "2026-11-18T19:00:00Z", impact: "High" }, { title: "Prelim GDP q/q", country: "USD", date: "2026-11-25T13:30:00Z", impact: "High" },
  { title: "Core PCE Price Index m/m", country: "USD", date: "2026-11-25T13:30:00Z", impact: "High" }
];
NB.calMerge = function (items) {
  const now = Date.now(); let liveMax = 0;
  items.forEach(i => { if (i.ts > liveMax) liveMax = i.ts; });
  const add = NB.calNormalize(FALLBACK.map(r => Object.assign({}, r, { wk: "next" }))).filter(i => i.ts > liveMax && i.ts > now - 864e5 && i.ts <= now + 15 * 864e5);
  add.forEach(i => { i.alt = true; i.id = "alt-" + i.id; });
  return items.concat(add).sort((a, b) => a.ts - b.ts);
};
NB.calTrend = it => { const f = pnum(it.fc), p = pnum(it.pv); if (f == null || p == null) return null; const d = f > p ? 1 : f < p ? -1 : 0; return { d, better: d * (it.c.inv ? -1 : 1) }; };
NB.calActual = it => { const a = pnum(it.ac), f = pnum(it.fc); if (a == null || f == null) return null; const d = a > f ? 1 : a < f ? -1 : 0; return { d, better: d * (it.c.inv ? -1 : 1) }; };
NB.calLabels = c => c.k === "cb" ? ["اگه لحن سخت‌گیرانه باشه", "اگه لحن نرم باشه"] : c.inv ? ["اگه عدد پایین‌تر از پیش‌بینی بیاد", "اگه عدد بالاتر از پیش‌بینی بیاد"] : ["اگه عدد بالاتر از پیش‌بینی بیاد", "اگه عدد پایین‌تر از پیش‌بینی بیاد"];
NB.CUR_FA = CUR_FA;
/* effect on each asset when the news is good for the currency (strong=true) or bad */
NB.calFx = function (it, strong) {
  const c = it.c, sens = c.oil ? OILSENS : (SENS[it.cur] || SENS.USD);
  const list = [{ id: "CUR", fa: CUR_FA[it.cur] || it.cur, s: c.oil ? 0 : 1 }].concat(ASSETS.map(a => Object.assign({ s: sens[a.id] || 0 }, a)));
  return list.map(a => { const eff = a.s * (strong ? 1 : -1), abs = Math.abs(a.s), mag = (a.base || 0) * c.f * (0.4 + abs);
    return Object.assign({}, a, { abs, cls: abs < .15 ? "fl" : eff > 0 ? "up" : "dn", lvl: abs < .15 ? 0 : Math.min(4, Math.max(1, Math.round(abs * c.f * 1.4))), lo: mag * .7, hi: mag * 1.4 }); })
    .filter(a => a.abs >= .15).sort((a, b) => b.abs - a.abs);
};
})();
