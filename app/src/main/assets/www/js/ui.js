/* Nabz Bazar — screens and sheets (render functions). State lives in NB.S, set up by main.js */
"use strict";
(function () {
const { faN, faD, fgColor, pct, dir, esc, dl, cdec, usdS, usdM, ago, timeFa, dayFa, dateFa, dayKey, I } = NB;
const UI = NB.UI = {};
const S = () => NB.S;
let rvI = 0;
const rv = (cls = "") => `class="rv ${cls}" style="--i:${rvI++}"`;
const N = (v, d = 0, k = "", extra = "") => `<b class="n" data-v="${v}" data-d="${d}"${k ? ` data-k="${k}"` : ""} ${extra}>${faN(v, d)}</b>`;
const header = (dt, h1, extraBtn = "") => `<div ${rv("hd")}><div><div class="dt">${dt}</div><h1>${h1}</h1></div><div class="tools">${extraBtn}<button class="ib" data-act="search" aria-label="جستجو">${I.search}</button><button class="ib themeBtn" data-act="theme" aria-label="حالت روز و شب">${S().dark ? I.sun : I.moon}</button></div></div>`;
const live = (t, stale, act = "refresh") => `<${act ? `button data-act="${act}"` : "span"} class="live${stale ? " off" : ""}"><i></i>${stale ? "قطع · " + ago(t) : t ? "زنده · " + ago(t) : "در حال اتصال"}</${act ? "button" : "span"}>`;
const tile = (ic, v, d, lab, ch, act) => `<button class="tile" ${act || ""}><span class="d ${ch > 0 ? "tx-up" : "tx-dn"}">${ch == null || !isFinite(ch) ? "" : (ch > 0 ? "▲ " : "▼ ") + pct(ch)}</span>${ic}${v == null ? '<b class="sk-t">—</b>' : N(v, d)}<small>${lab}</small></button>`;
const skRows = n => Array.from({ length: n }, () => '<div class="ar sk"><div class="lo"></div><div><i class="skl" style="width:70%"></i><i class="skl" style="width:40%"></i></div><i class="skl" style="height:24px"></i><i class="skl" style="width:80%;height:26px"></i></div>').join("");
const msg = (t, ic = I.info) => `<div class="msg">${ic}<span>${t}</span></div>`;
const vpnMsg = what => msg(`اتصال به ${what} برقرار نشد. ${NB.NET.vpn ? "اینترنت رو چک کن." : "این منبع ایران رو تحریم کرده؛ با فیلترشکن کار می‌کنه."}`, I.shield);
UI.reset = () => { rvI = 0; };

/* ================= HOME ================= */
const FXL = [["EURUSD", "یورو / دلار", "EUR/USD", 4, "forex"], ["GBPUSD", "پوند / دلار", "GBP/USD", 4, "forex"], ["USDCHF", "دلار / فرانک", "USD/CHF", 4, "forex"], ["USDCAD", "دلار / دلار کانادا", "USD/CAD", 4, "forex"], ["NZDUSD", "دلار نیوزیلند / دلار", "NZD/USD", 4, "forex"],
  ["XAUUSD", "طلا · اونس", "XAU/USD", 2, "metals"], ["XAGUSD", "نقره · اونس", "XAG/USD", 3, "metals"], ["WTI", "نفت وست تگزاس", "WTI", 2, "energy"], ["BRENT", "نفت برنت", "BRENT", 2, "energy"]];
UI.FXL = FXL;
function cRow(c) {
  return `<button class="ar" data-open="c:${esc(c.id)}"><div class="lo">${NB.logo(c.s)}</div><div class="nm"><b>${esc(c.n)}${starMark("c:" + c.id)}</b><small>${esc(c.s)}</small></div>${NB.spark(c.sp, c.ch >= 0 ? "u" : "d")}<div class="pr">${N(c.p, cdec(c.p), "c" + c.id)}${dl(c.ch)}</div></button>`;
}
function fRow(f) {
  const d = S().fx[f[0]];
  return `<button class="ar${d ? "" : " nodata"}" data-open="f:${f[0]}"><div class="lo">${NB.logo(f[0], "fx")}</div><div class="nm"><b>${f[1]}${starMark("f:" + f[0])}${d && d.approx ? '<span class="tag sm">تقریبی</span>' : ""}</b><small>${f[2]}</small></div>${NB.spark(d && d.sp)}<div class="pr">${d ? N(d.p, f[3], "f" + f[0]) + dl(d.ch) : '<b class="mut">—</b>'}</div></button>`;
}
const starMark = id => S().stars.includes(id) ? `<span class="stm">${I.starF}</span>` : "";
UI.cRow = cRow; UI.fRow = fRow;
UI.home = function () {
  const s = S(), mk = (s.mk || []).filter(c => !c.st), fx = s.fx || {}, gl = s.gl, fng = s.fng || [], ir = s.ir;
  let up = 0, dn = 0;
  FXL.forEach(f => { const d = fx[f[0]]; if (d && isFinite(d.ch)) { if (d.ch > .005) up++; else if (d.ch < -.005) dn++; } });
  mk.slice(0, 10).forEach(c => { if (c.ch > .005) up++; else if (c.ch < -.005) dn++; });
  const v = fng[0], ratio = up + dn ? up / (up + dn) : .5;
  const mood = v == null ? (ratio >= .65 ? "بازار صعودیه" : ratio <= .35 ? "بازار نزولیه" : "بازار متعادله") : v < 25 ? "بازار خیلی ترسیده" : v < 45 ? "بازار کمی ترسیده" : v <= 55 ? "بازار آرومه" : v <= 75 ? "بازار کمی طمع داره" : "بازار پرطمعه";
  const btc = mk.find(c => c.s === "BTC");
  const cl = s.btc30 || [], ch = []; for (let i = 1; i < cl.length; i++) ch.push((cl[i] - cl[i - 1]) / cl[i - 1] * 100);
  const ups = ch.filter(x => x >= .5).length, dns = ch.filter(x => x <= -.5).length;
  const heat = ch.length ? ch.map((x, j) => `<i class="pp ${x >= .5 ? "u" : x <= -.5 ? "" : "f"}${j === ch.length - 1 ? " t" : ""}" style="--j:${j}"></i>`).join("") : Array.from({ length: 30 }, () => '<i class="pp sk"></i>').join("");
  const fgR = fng.slice(0, 7).reverse(), fgBars = fgR.map((x, i) => `<div><span>${faN(x)}</span><i style="height:${Math.max(8, x / 70 * 44)}px;background:${fgColor(x)};opacity:${i === fgR.length - 1 ? 1 : .45}"></i></div>`).join("");
  const xau = fx.XAUUSD;
  /* markets list */
  const f = s.filter;
  let list = "";
  const stars = s.stars.filter(id => id[0] === "c" ? mk.some(c => "c:" + c.id === id) : !!fx[id.slice(2)]);
  if (stars.length && f === "all") list += `<div class="secS">${I.starF}ستاره‌دارها</div><div class="cd list">${stars.map(id => id[0] === "c" ? cRow(mk.find(c => "c:" + c.id === id)) : fRow(FXL.find(x => x[0] === id.slice(2)))).join("")}</div>`;
  if (f === "all" || f === "crypto") list += `<div class="secS">${I.btc}ارزهای دیجیتال${f === "all" ? ' <span class="mut sm">۱۰ ارز اول</span>' : ""}</div><div class="cd list">${mk.length ? mk.slice(0, f === "all" ? 10 : 100).map(cRow).join("") : skRows(5)}</div>`;
  if (f === "all" || f === "forex") list += `<div class="secS">${NB.txt("€")}فارکس</div><div class="cd list">${FXL.filter(x => x[4] === "forex").map(fRow).join("")}</div>`;
  if (f === "all" || f === "metals") list += `<div class="secS">${I.bar}طلا و نقره</div><div class="cd list">${FXL.filter(x => x[4] === "metals").map(fRow).join("")}</div>`;
  if (f === "all" || f === "energy") list += `<div class="secS">${I.drop}نفت</div><div class="cd list">${FXL.filter(x => x[4] === "energy").map(fRow).join("")}</div>`;
  if ((f === "all" || f === "crypto") && mk.length > 20) {
    const srt = mk.slice(0, 100).filter(c => isFinite(c.ch)).sort((a, b) => b.ch - a.ch);
    list += `<div class="secS">${I.chart}بیشترین صعود و نزول <span class="mut sm">بین ۱۰۰ ارز اول</span></div><div class="cd list">${srt.slice(0, 3).map(cRow).join("")}${srt.slice(-3).reverse().map(cRow).join("")}</div>`;
  }
  const fxErr = !Object.keys(fx).length && s.err.fx;
  return `${header(dateFa(Date.now(), { weekday: "long", day: "numeric", month: "long" }), "نبض بازار", `<button class="ib" data-act="settings" aria-label="تنظیمات">${I.gear}</button>`)}
  <div ${rv("cd")}><div class="row sp"><span class="mut sm">امروز</span>${live(s.t.mk, s.stale.mk)}</div>
    <div class="big">${mood}</div>
    <div class="mut sm">${faN(up)} صعودی · ${faN(dn)} نزولی${gl ? ` · ارزش کل کریپتو ${pct(gl.mch, 1)} ${gl.mch >= 0 ? "بیشتر" : "کمتر"} از دیروز` : ""}</div>
    <div class="chips"><span class="chip">${I.pie}سلطه بیت‌کوین ${gl ? faN(gl.dom, 1) + "٪" : "—"}</span><span class="chip">${I.layers}ارزش کل ${gl ? faN(gl.mc / 1e12, 2) : "—"}<small>تریلیون $</small></span></div>
    <button class="btn" data-act="convert">${I.calc}ماشین‌حساب تبدیل</button></div>
  <div ${rv("tiles")}>${tile(I.btc, btc && btc.p, 0, "بیت‌کوین · دلار", btc && btc.ch, btc ? `data-open="c:${btc.id}"` : "")}${tile(I.bar, xau && xau.p, 0, "طلا · اونس", xau && xau.ch, 'data-open="f:XAUUSD"')}${tile(I.coins, ir && ir.usd, 0, "دلار · تومان", ir && ir.chg && ir.chg.usd, 'data-open="i:usd"')}</div>
  <div ${rv("cd")}><div class="row sp"><span class="ttl">۳۰ روز اخیر بیت‌کوین</span><span class="mut sm">${ch.length ? faN(ups) + " مثبت · " + faN(dns) + " منفی" : ""}</span></div>
    <div class="heat">${heat}</div>
    <div class="lg3"><span><i class="u"></i>روز مثبت</span><span><i class="n"></i>روز منفی</span><span><i class="f"></i>کمتر از ۰٫۵٪</span></div></div>
  <div ${rv("two")}><button class="cd" data-open="f:XAUUSD"><div class="ttl">${I.bar}طلا</div><div class="mut xs">اونس${xau && xau.approx ? " · تقریبی" : ""}</div><span class="num">${xau ? N(xau.p, 0) : "—"}<span class="unit">دلار</span></span>
      <div class="areaW">${xau ? NB.area(xau.sp, 172, 66, { op: .13, sw: 1.8 }) : ""}</div></button>
    <button class="cd" data-tab="smart"><div class="ttl">${I.gauge}ترس و طمع</div><div class="mut xs">۷ روز اخیر</div><div class="row" style="margin-top:8px"><span class="num" style="margin:0;font-size:21px;color:${v == null ? "inherit" : fgColor(v)}">${v == null ? "—" : N(v, 0)}</span>${v == null ? "" : `<span class="dl ${v < 45 ? "dn" : v > 55 ? "up" : "fl"}">${fgWord(v)}</span>`}</div>
      <div class="fgbars">${fgBars}</div></button></div>
  <div ${rv("secH")}><h3>بازارها</h3><span class="mut sm">${s.t.fx ? "فارکس " + ago(s.t.fx) : ""}</span></div>
  <div ${rv("seg")}>${[["all", "همه"], ["crypto", "کریپتو"], ["forex", "فارکس"], ["metals", "طلا و نقره"], ["energy", "نفت"]].map(x => `<button data-filter="${x[0]}" class="${f === x[0] ? "on" : ""}">${x[1]}</button>`).join("")}</div>
  ${fxErr ? `<div ${rv()}>${msg("قیمت فارکس، طلا و نفت از سرور دوستت میاد که الان جواب نمیده. " + (NB.NET.vpn ? "کمی بعد دوباره امتحان کن." : "معمولاً بدون فیلترشکن باز نمیشه."), I.shield)}</div>` : ""}
  <div ${rv()}>${list}</div>
  <div class="foot">قیمت‌ها برای اطلاع هستن و توصیه‌ی خرید و فروش نیستن.</div>`;
};
let fgSeq = 0;
UI.smartSummary = () => UI._sm || null;
const fgWord = v => v < 25 ? "ترس شدید" : v < 45 ? "ترس" : v <= 55 ? "خنثی" : v <= 75 ? "طمع" : "طمع شدید";
UI.fgWord = fgWord;

/* ================= IRAN ================= */
const IR_FX = [["usd", "دلار آمریکا", "$", 1], ["eur", "یورو", "€", 1], ["gbp", "پوند انگلیس", "£", 1], ["aed", "درهم امارات", "د", 1], ["try", "لیر ترکیه", "₺", 1], ["cad", "دلار کانادا", "C$", 1], ["aud", "دلار استرالیا", "A$", 1], ["cny", "یوان چین", "¥", 1], ["chf", "فرانک سوئیس", "Fr", 1], ["sar", "ریال عربستان", "ر", 1], ["qar", "ریال قطر", "ق", 1], ["kwd", "دینار کویت", "د", 1], ["iqd", "دینار عراق", "ع", 1], ["rub", "روبل روسیه", "₽", 1], ["jpy", "ین ژاپن", "¥", 100]];
const IR_COIN = [["coin_emami", "سکه امامی", 8.133], ["coin_bahar", "بهار آزادی", 8.133], ["coin_half", "نیم‌سکه", 4.0665], ["coin_quarter", "ربع‌سکه", 2.03325], ["coin_gram", "سکه گرمی", 0]];
UI.IR_FX = IR_FX; UI.IR_COIN = IR_COIN;
const g24 = d => isFinite(d.gold_24k) ? d.gold_24k : isFinite(d.gold_18k) ? d.gold_18k * 24 / 18 : null;
UI.g24 = g24;
UI.irName = function (k) {
  const f = IR_FX.find(x => x[0] === k); if (f) return f[1];
  const c = IR_COIN.find(x => x[0] === k); if (c) return c[1];
  return { gold_18k: "طلای ۱۸ عیار", gold_24k: "طلای ۲۴ عیار", gold_mesghal: "مثقال آبشده", usdt: "تتر" }[k] || k;
};
UI.iran = function () {
  const s = S(), r = s.ir;
  if (!r) return `${header("قیمت به تومان", "بازار داخلی")}<div ${rv("cd")}>${s.err.ir ? msg("قیمت‌های داخلی دریافت نشد. اینترنت رو چک کن و دوباره بزن.") : '<i class="skl" style="height:150px"></i>'}</div>`;
  const c = r.chg || {}, gg = g24(r), oz = r.gold_ounce || r.usd_xau;
  const imp = gg && oz ? gg * 31.1035 / oz : null, gap = imp ? (r.usd - imp) / imp * 100 : null;
  const h = (s.irh && s.irh.usd) || [], h30 = h.slice(-31), m30 = h30.length > 5 ? (r.usd - h30[0][1]) / h30[0][1] * 100 : null;
  const age = r._ts ? Date.now() - r._ts : 0;
  const mil = (v, d = 2) => `${N(v / 1e6, d)}<span class="unit">میلیون</span>`;
  const kv = (ic, k, name, sub, v, ch, big) => `<button class="kv" data-open="i:${k}"><div class="lo">${ic}</div><div><b>${name}${starMark("i:" + k)}</b>${sub ? `<small>${sub}</small>` : ""}</div><div class="v">${big ? mil(v) : N(v, 0) + '<span class="unit">تومان</span>'}<div class="dlw">${ch == null ? "" : dl(ch)}</div></div></button>`;
  const coinRow = ([k, name, w]) => {
    if (!isFinite(r[k])) return "";
    let bub = "";
    if (w && gg) { const intr = w * .9 * gg, b = (r[k] - intr) / intr * 100; bub = `<small>حباب ${b >= 0 ? "" : "منفی "}${pct(b, 1)}</small><div class="bub"><i style="width:${Math.max(2, Math.min(100, Math.abs(b) / 20 * 100)).toFixed(1)}%"></i></div>`; }
    return `<button class="kv" data-open="i:${k}"><div class="lo">${I.coin}</div><div><b>${name}${starMark("i:" + k)}</b>${bub}</div><div class="v">${mil(r[k])}<div class="dlw">${dl(c[k])}</div></div></button>`;
  };
  /* tether */
  /* tether: pick an exchange (Nobitex, Wallex, Tabdeal); the chosen one is shown big with its buy and sell price */
  const ut = s.usdt || {}, exs = NB.USDT_EX.filter(e => ut[e.k]);
  const cheap = exs.length > 1 ? exs.reduce((a, e) => (ut[e.k].buy || ut[e.k].p) < (ut[a.k].buy || ut[a.k].p) ? e : a, exs[0]) : null;
  const selE = NB.USDT_EX.find(e => e.k === s.usdtEx) || NB.USDT_EX[0], sel = ut[selE.k];
  const tdiff = sel ? (sel.p - r.usd) / r.usd * 100 : null;
  const tether = `<div ${rv("cd")}><div class="row sp"><span class="ttl"><span class="lo xs">${I.usdt}</span>تتر · USDT</span>${sel ? (sel.ch != null ? dl(sel.ch) : `<span class="mut xs">${ago(sel.t)}</span>`) : ""}</div>
    <div class="segc exsel">${NB.USDT_EX.map(e => `<button data-ex="${e.k}" class="${e === selE ? "on" : ""}"><span>${e.n}</span><b>${ut[e.k] ? faN(ut[e.k].p, 0) : "—"}</b>${e === cheap ? "<i>ارزون‌ترین</i>" : ""}</button>`).join("")}</div>
    ${sel ? `<div class="huge">${N(sel.p, 0, "usdt-" + selE.k)}<span class="unit" style="font-size:15px">تومان · ${selE.n}</span></div>
    ${sel.buy ? `<div class="ins"><div><small>خرید از ${selE.n}</small><b>${faN(sel.buy, 0)}</b><span class="unit">تومان</span></div><div><small>فروش به ${selE.n}</small><b>${faN(sel.sell, 0)}</b><span class="unit">تومان</span></div></div>` : ""}
    <div class="mut sm" style="margin-top:10px">${Math.abs(tdiff) < .5 ? "تقریباً هم‌قیمت دلار بازار" : "فاصله با دلار بازار " + pct(tdiff, 1) + (tdiff > 0 ? " گرون‌تر" : " ارزون‌تر")} · به‌روز ${ago(sel.t)}</div>`
    : `<div class="mut sm" style="margin-top:12px">${s.loading.usdt ? "در حال گرفتن قیمت از " + selE.n + "…" : selE.n + " الان جواب نداد؛ یه صرافی دیگه رو بزن."}</div>`}</div>`;
  return `${header("به تومان" + (r._ts ? " · ساعت " + timeFa(r._ts) : ""), "بازار داخلی")}
  <div ${rv("cd hero2")}><div class="row sp"><span class="ttl"><span class="lo xs">$</span>دلار آمریکا</span>${dl(c.usd)}</div>
    <button class="huge" data-open="i:usd">${N(r.usd, 0, "irusd")}<span class="unit" style="font-size:16px">تومان</span></button>
    <div class="mut sm">${m30 != null ? `۳۰ روز گذشته ${m30 >= 0 ? "▲" : "▼"} ${pct(m30, 1)} · از ${faN(h30[0][1])} تومان` : "&nbsp;"}</div>
    <div style="margin:12px -4px 0" data-open="i:usd">${h30.length > 5 ? NB.area(h30.map(x => x[1]), 330, 64, { padX: 4, padT: 6, padB: 4, op: .12, end: true }) : '<div style="height:64px"></div>'}</div>
    ${imp ? `<div class="ins"><div><small>دلار از روی قیمت طلا</small><b>${faN(Math.round(imp / 100) * 100)}</b><span class="unit">تومان</span></div><div><small>دلار بازار نسبت به اون</small><b class="${gap > 0 ? "tx-dn" : "tx-up"}">${pct(gap, 1)}</b><span class="unit">${Math.abs(gap) < 1.5 ? "هماهنگ" : gap > 0 ? "گرون‌تر" : "ارزون‌تر"}</span></div></div>` : ""}
    <div class="srcl">${live(r._ts, age > 45 * 60000, "refresh")}${age > 45 * 60000 ? '<span class="mut xs">منبع اصلی جواب نداد؛ این آخرین قیمت موجوده.</span>' : ""}</div></div>
  ${tether}
  <div ${rv("tiles")}>${["eur", "gbp", "aed"].map(k => tile(NB.txt(IR_FX.find(x => x[0] === k)[2]), r[k], 0, UI.irName(k), c[k], `data-open="i:${k}"`)).join("")}</div>
  <div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">${I.bar}طلا</span><span class="mut xs">قیمت هر گرم</span></div>
    ${isFinite(r.gold_18k) ? kv(I.bar, "gold_18k", "طلای ۱۸ عیار", "هر گرم", r.gold_18k, c.gold_18k, 1) : ""}${gg ? kv(I.bar, "gold_24k", "طلای ۲۴ عیار", "هر گرم", gg, c.gold_24k ?? c.gold_18k, 1) : ""}${isFinite(r.gold_mesghal) ? kv(I.barO, "gold_mesghal", "مثقال آبشده", "هر مثقال", r.gold_mesghal, c.gold_mesghal, 1) : ""}</div>
  <div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">${I.coin}سکه و حباب</span><span class="mut xs">حباب = گرون‌تر از طلای خودش</span></div>${IR_COIN.map(coinRow).join("")}</div>
  <div ${rv("cd")}><div class="ttl" style="margin-bottom:12px">${I.calc}ماشین‌حساب طلا و سکه</div>
    <div class="mut sm" style="margin-bottom:14px">ارزش طلا یا سکه‌ای که داری رو با قیمت همین الان حساب کن.</div><button class="btn" data-act="goldcalc">${I.calc}باز کردن ماشین‌حساب</button></div>
  <div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">ارزها</span><span class="mut xs">تومان</span></div>${IR_FX.filter(f => f[0] !== "usd" && isFinite(r[f[0]])).map(f => kv(NB.txt(f[2]), f[0], f[1], f[3] > 1 ? "هر " + faN(f[3]) + " واحد" : "", r[f[0]], c[f[0]])).join("")}</div>
  ${isFinite(oz) || isFinite(r.oil) ? `<div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">بازار جهانی</span><span class="mut xs">دلار</span></div>
    ${isFinite(oz) ? `<button class="kv" data-open="f:XAUUSD"><div class="lo">${I.bar}</div><div><b>اونس جهانی طلا</b></div><div class="v"><b>${faN(oz, 2)}</b><span class="unit">دلار</span></div></button>` : ""}
    ${isFinite(r.oil) ? `<button class="kv" data-open="f:${r._oilWti ? "WTI" : "BRENT"}"><div class="lo">${I.drop}</div><div><b>${r._oilWti ? "نفت وست تگزاس" : "نفت برنت"}</b></div><div class="v"><b>${faN(r.oil, 2)}</b><span class="unit">دلار</span></div></button>` : ""}</div>` : ""}
  <div class="foot">قیمت‌ها تقریبی هستن. عیار ۲۴ اگه از منبع نیاد از روی ۱۸ عیار حساب میشه. روی هر قیمت بزن تا نمودارش باز بشه.</div>`;
};

/* ================= SMART MONEY ================= */
UI.smart = function () {
  const s = S(), fng = s.fng || [], v = fng[0];
  const hl = s.hl, agg = hl ? NB.hlAgg(hl, 10) : [];
  const btcA = agg.find(a => a.c === "BTC"), btcShort = btcA ? btcA.s / (btcA.l + btcA.s) * 100 : null;
  const wl = agg.reduce((t, a) => t + a.l, 0), ws = agg.reduce((t, a) => t + a.s, 0), whaleLong = wl + ws > 0 ? wl / (wl + ws) * 100 : null;
  const ls = s.ls || {}, bt = [["BTCUSDT", "بیت‌کوین"], ["ETHUSDT", "اتریوم"], ["SOLUSDT", "سولانا"]];
  const btcLs = ls.BTCUSDT, oiB = (s.oi || {}).BTCUSDT, st = s.stable || [];
  const stW = st.length > 8 ? (st[st.length - 1] - st[st.length - 8]) / st[st.length - 8] * 100 : null, stM = st.length > 8 ? (st[st.length - 1] - st[0]) / st[0] * 100 : null;
  /* summary: each signal scores -1..+1 */
  const sig = [];
  if (v != null) sig.push(["ترس و طمع", fgWord(v) + " · " + faN(v), v < 45 ? -1 : v > 55 ? 1 : 0, v < 45 ? "dn" : v > 55 ? "up" : "fl"]);
  if (whaleLong != null) sig.push(["نهنگ‌های هایپرلیکوید", (whaleLong >= 50 ? "خرید · " + faN(whaleLong, 0) : "فروش · " + faN(100 - whaleLong, 0)) + "٪", whaleLong > 60 ? 1 : whaleLong < 40 ? -1 : 0, whaleLong >= 50 ? "up" : "dn"]);
  if (btcLs) sig.push(["معامله‌گرهای برتر بایننس", (btcLs.l >= 50 ? "خرید · " + faN(btcLs.l, 1) : "فروش · " + faN(btcLs.s, 1)) + "٪", btcLs.l > 60 ? .5 : btcLs.l < 40 ? -.5 : 0, btcLs.l >= 50 ? "up" : "dn"]);
  if (oiB) sig.push(["سرمایه باز بیت‌کوین", (oiB.co >= 0 ? "افزایش · " : "کاهش · ") + pct(oiB.co, 1), Math.abs(oiB.co) < .3 ? 0 : oiB.co > 0 ? .5 : -.5, oiB.co >= 0 ? "up" : "dn"]);
  if (stM != null) sig.push(["جریان استیبل‌کوین", (stM >= 0 ? "ورود · " : "خروج · ") + pct(stM, 1), stM > .3 ? 1 : stM < -.3 ? -1 : 0, stM >= 0 ? "up" : "dn"]);
  const score = sig.length ? sig.reduce((t, x) => t + x[2], 0) / sig.length : 0;
  let head = "در حال جمع کردن نشانه‌ها…", body = "";
  if (sig.length >= 2) {
    if (whaleLong != null && btcLs && (whaleLong < 45) !== (btcLs.l < 50)) head = whaleLong < 45 ? "نهنگ‌ها فروشنده‌ان،<br>مردم خریدار" : "نهنگ‌ها خریدارن،<br>مردم فروشنده";
    else head = score <= -.45 ? "پول هوشمند<br>محتاط و فروشنده‌ست" : score >= .45 ? "پول هوشمند<br>داره وارد میشه" : "نشانه‌ها<br>دوطرفه‌ان";
    const parts = [];
    if (btcShort != null) parts.push(`ده کیف‌پول پرسود هایپرلیکوید ${btcShort >= 50 ? faN(btcShort, 0) + "٪ روی بیت‌کوین فروش (شورت)" : faN(100 - btcShort, 0) + "٪ روی بیت‌کوین خرید (لانگ)"} گرفتن`);
    if (btcLs) parts.push(`${faN(btcLs.l >= 50 ? btcLs.l : btcLs.s, 1)}٪ معامله‌گرهای برتر بایننس ${btcLs.l >= 50 ? "خریدارن" : "فروشنده‌ان"}`);
    if (stM != null && Math.abs(stM) > .3) parts.push(stM < 0 ? "پول نقد داره از بازار بیرون میره" : "پول تازه داره وارد بازار میشه");
    body = parts.join("، ") + ".";
  }
  /* the same summary, short, for the home-screen widget */
  if (sig.length >= 2) {
    const SHORT = { "ترس و طمع": "ترس و طمع", "نهنگ‌های هایپرلیکوید": "نهنگ‌ها", "معامله‌گرهای برتر بایننس": "بایننس", "سرمایه باز بیت‌کوین": "سرمایه باز", "جریان استیبل‌کوین": "استیبل‌کوین" };
    const pick = ["نهنگ‌های هایپرلیکوید", "معامله‌گرهای برتر بایننس", "جریان استیبل‌کوین", "ترس و طمع", "سرمایه باز بیت‌کوین"].map(l => sig.find(x => x[0] === l)).filter(Boolean).slice(0, 3);
    UI._sm = { head: head.replace(/<br>/g, "\n"), score, chips: pick.map(x => [SHORT[x[0]] + " · " + x[1].replace(" · ", " "), x[3]]) };
  }
  const meter = [0, 1, 2, 3, 4].map(i => { const at = Math.round((score + 1) * 2); const on = i === at; const c = i < 2 ? "var(--dn)" : i > 2 ? "var(--up)" : "var(--ink3)"; return `<i style="background:${on ? c : "var(--chip2)"};${on ? "" : ""}"></i>`; }).join("");
  const sigRows = sig.map(x => `<div class="sigr"><span>${x[0]}</span><span class="dl ${x[3]}">${x[1]}</span></div>`).join("");
  /* gauge */
  let gauge = "";
  if (v != null) {
    const R = 110, cx = 135, cy = 130, a0 = Math.PI, ang = a0 - v / 100 * Math.PI, P = a => [(cx + R * Math.cos(a)).toFixed(1), (cy - R * Math.sin(a)).toFixed(1)];
    const arc = (f, t) => { const [x1, y1] = P(f), [x2, y2] = P(t); return `M${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2}`; };
    /* one smooth arc: a continuous red → grey → green gradient; the part up to today's value is solid, the rest faint.
       Small dots outside the arc mark the zone borders (25 / 45 / 55 / 75). */
    const zc = [12, 35, 50, 65, 88].map(fgColor), gid = "fgg" + (++fgSeq), col = fgColor(v);
    const grad = `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${cx - R}" y1="0" x2="${cx + R}" y2="0"><stop offset="0" stop-color="${zc[0]}"/><stop offset=".3" stop-color="${zc[1]}"/><stop offset=".5" stop-color="${zc[2]}"/><stop offset=".7" stop-color="${zc[3]}"/><stop offset="1" stop-color="${zc[4]}"/></linearGradient>`;
    const ticks = [25, 45, 55, 75].map(t => { const a = a0 - t / 100 * Math.PI; return `<circle cx="${(cx + (R + 17) * Math.cos(a)).toFixed(1)}" cy="${(cy - (R + 17) * Math.sin(a)).toFixed(1)}" r="1.8" fill="var(--ink3)"/>`; }).join("");
    const [nx, ny] = P(ang);
    gauge = `<div class="gauge"><svg viewBox="0 0 270 150" width="270" height="150" style="overflow:visible"><defs>${grad}</defs>
      <path d="${arc(a0 - .0001, .0001)}" stroke="url(#${gid})" stroke-opacity=".2" stroke-width="14" fill="none" stroke-linecap="round"/>
      ${v > .5 ? `<path class="gdraw" d="${arc(a0 - .0001, ang)}" stroke="url(#${gid})" stroke-width="14" fill="none" stroke-linecap="round"/>` : ""}
      ${ticks}<circle cx="${nx}" cy="${ny}" r="12" fill="${col}" opacity=".18"/><circle cx="${nx}" cy="${ny}" r="8.5" fill="var(--card)" stroke="${col}" stroke-width="4"/></svg><div class="gv"><b class="n" data-v="${v}" data-d="0" style="color:${col}">${faN(v)}</b><span style="color:${col}">${fgWord(v)}</span></div></div>
      <div class="gl"><span style="color:${zc[0]}">ترس شدید</span><span>خنثی</span><span style="color:${zc[4]}">طمع شدید</span></div>
      <div class="msg" style="margin-top:14px">${I.info}<span>${v < 25 ? "بازار خیلی ترسیده؛ معمولاً فروش‌های هیجانی زیاده و گاهی فرصت خرید پیش میاد." : v < 45 ? "بازار ترسیده؛ خریدارها محتاطن و فشار فروش بیشتره." : v <= 55 ? "بازار نه ترسیده نه طمع داره." : v <= 75 ? "بازار طمع داره؛ خریدارها بیشترن." : "طمع شدید؛ بازار داغه و ریسک اصلاح قیمت بالاست."}</span></div>`;
  }
  const lsRow = (n, l, sh, extra, open) => `<${open ? `button data-open="${open}"` : "div"} class="ls"><div class="t"><b>${n}</b><span>${extra}</span></div><div class="lsb"><i style="width:${Math.max(1.5, l)}%;background:var(--up)"></i><i style="width:${Math.max(1.5, sh)}%;background:var(--dn)"></i></div><div class="m"><span>خرید <b>${faN(l, 1)}٪</b></span><span>فروش <b>${faN(sh, 1)}٪</b></span></div></${open ? "button" : "div"}>`;
  const whaleRows = agg.slice(0, 6).map(a => { const t = a.l + a.s, l = a.l / t * 100; return lsRow(a.c, l, 100 - l, usdS(t) + " · " + faN(a.n) + " کیف‌پول", "w:coin:" + a.c); }).join("");
  const wal = (hl || []).filter(w => w.pos && w.pos.length).slice(0, 5).map((w, i) => `<button class="kv wal" data-open="w:${esc(w.a)}"><div class="lo xs2">${faN(i + 1)}</div><div><b class="addr">${esc(w.n || (w.a.slice(0, 6) + "…" + w.a.slice(-4)))}</b><div class="row wrap" style="gap:5px;margin-top:6px">${w.pos.slice(0, 3).map(p => `<span class="dl ${p.L ? "up" : "dn"}">${esc(p.c)} ${p.L ? "▲" : "▼"}${p.lev ? " ×" + faN(p.lev) : ""}</span>`).join("")}</div></div><div class="v">${w.p ? `<small>سود ۳۰ روز</small><b class="${w.p >= 0 ? "tx-up" : "tx-dn"}" style="font-size:14px">${w.p >= 0 ? "+" : "−"}${usdM(Math.abs(w.p))}</b>` : `<small>ارزش حساب</small><b style="font-size:14px">${usdM(w.v)}</b>`}</div></button>`).join("");
  const oiWhy = o => Math.abs(o.co) < .3 ? "سرمایه باز تقریباً ثابته و نشانه‌ی روشنی نیست." : o.cp > 0 && o.co > 0 ? "قیمت و سرمایه باز هر دو بالا رفتن؛ پول تازه اومده و صعود جون داره." : o.cp > 0 ? "قیمت بالا رفته ولی سرمایه باز کم شده؛ رشدش بیشتر از بسته شدن فروش‌هاست و ضعیفه." : o.co > 0 ? "قیمت پایین اومده ولی سرمایه باز زیاد شده؛ فروش تازه اومده و ریزش جون داره." : "قیمت و سرمایه باز هر دو پایین اومدن؛ خریدها دارن بسته میشن و ریزش جون نداره.";
  const f24 = s.fut24 || {};
  const oi = bt.map(([y, n]) => { const o = (s.oi || {})[y]; if (!o) return ""; const cp = f24[y] ? f24[y][0] : null; const oo = Object.assign({ cp }, o); return `<div class="ls"><div class="t"><b>${n}</b><span>سرمایه باز ${usdS(o.oi)}</span></div><div class="row" style="gap:6px"><span class="chip sm">قیمت ${dl(cp)}</span><span class="chip sm">سرمایه باز ${dl(o.co)}</span></div><div class="mut sm why">${oiWhy(oo)}</div></div>`; }).join("");
  const perps = s.perps ? new Set(s.perps) : null, fut = s.fut || {};
  let fr = "";
  if (Object.keys(fut).length && Object.keys(f24).length) {
    const list = Object.keys(fut).filter(k => /USDT$/.test(k) && f24[k] && f24[k][1] > 0 && (!perps || perps.has(k))).sort((a, b) => f24[b][1] - f24[a][1]).slice(0, 60).map(k => ({ s: k.replace(/USDT$/, ""), f: fut[k] })).sort((a, b) => b.f - a.f);
    const row = (x, pos) => `<button class="kv fr" data-ext="https://www.tradingview.com/chart/?symbol=BINANCE:${x.s}USDT.P"><b class="ltr">${esc(x.s)}</b><b class="${pos ? "tx-up" : "tx-dn"} ltr">${x.f > 0 ? "+" : ""}${x.f.toFixed(4)}%</b></button>`;
    fr = `<div class="mut xs sub">خریدارهای شلوغ · ریسک ریزش</div>${list.slice(0, 5).map(x => row(x, true)).join("")}<div class="mut xs sub">فروشنده‌های شلوغ · ریسک جهش</div>${list.slice(-5).reverse().map(x => row(x, false)).join("")}`;
  }
  const tv = s.chains || [], tvMax = tv.length ? tv[0].t : 1;
  const futErr = s.err.fut && !btcLs;
  const hlAge = NB.hlWalletsAge();
  return `${header("رفتار نهنگ‌ها و جریان پول", "پول هوشمند")}
  <div ${rv("cd")}><div class="row sp"><span class="ttl">${I.whale}جمع‌بندی امروز</span>${live(s.t.smart, false, "refresh")}</div>
    <div class="big" style="font-size:27px">${head}</div>
    ${body ? `<div class="mut sm lh">${body}</div>` : ""}
    ${sig.length ? `<div class="meter"><div>${meter}</div><div class="row sp xs mut"><span>خرید قوی</span><span>خنثی</span><span>فروش قوی</span></div></div>${sigRows}` : ""}
    <div class="mut xs" style="margin-top:12px">این یه خلاصه‌ی خودکاره، توصیه‌ی خرید و فروش نیست.</div></div>
  ${futErr ? `<div ${rv()}>${vpnMsg("بایننس")}</div>` : ""}
  ${v != null ? `<div ${rv("cd")}><div class="row sp"><span class="ttl">${I.gauge}ترس و طمع</span><span class="mut xs">${fng[1] != null ? "دیروز " + faN(fng[1]) : ""}</span></div>${gauge}</div>` : ""}
  <div ${rv("cd")} style="padding-bottom:10px"><div class="row sp"><span class="ttl">${I.whale}نهنگ‌های هایپرلیکوید</span><span class="mut xs">${hl ? ago(s.t.hl) : ""}</span></div>
    ${hl ? `<div class="mut sm" style="margin:6px 0 4px">جمع موقعیت‌های باز ده کیف‌پول پرسود روی هر ارز:</div>${whaleRows || '<div class="mut sm" style="padding:10px 0">الان موقعیت بازی ندارن.</div>'}` : s.err.hl ? vpnMsg("هایپرلیکوید") : '<i class="skl" style="height:120px;margin-top:10px"></i>'}</div>
  ${wal ? `<div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">برترین کیف‌پول‌ها</span><span class="mut xs">${hlAge ? "فهرست " + ago(hlAge) : "فهرست پیش‌فرض"}</span></div>${wal}
    <button class="btn ghost" data-act="hlall">نمایش همه و به‌روزرسانی فهرست</button></div>` : ""}
  <div ${rv("cd")}><div class="row sp"><span class="ttl">معامله‌گرهای برتر بایننس</span><span class="mut xs">فیوچرز · ۱ ساعت</span></div>
    ${bt.map(([y, n]) => ls[y] ? lsRow(n, ls[y].l, ls[y].s, fut[y] != null ? "تأمین مالی " + (fut[y] > 0 ? "+" : "") + faN(fut[y], 4) + "٪" : "", "c:" + ({ BTCUSDT: "bitcoin", ETHUSDT: "ethereum", SOLUSDT: "solana" }[y])) : "").join("") || (s.err.fut ? vpnMsg("بایننس") : '<i class="skl" style="height:90px;margin-top:10px"></i>')}</div>
  ${oi ? `<div ${rv("cd")}><div class="row sp"><span class="ttl">سرمایه باز و قیمت</span><span class="mut xs">۲۴ ساعت</span></div>${oi}</div>` : ""}
  ${st.length ? `<div ${rv("cd")}><div class="row sp"><span class="ttl">جریان استیبل‌کوین</span><span class="mut xs">۳۰ روز</span></div>
    <div class="huge" style="margin:8px 0 2px">${N(st[st.length - 1] / 1e9, 1)}<span class="unit" style="font-size:15px">میلیارد $</span></div>
    <div class="row" style="gap:6px"><span class="chip sm">۷ روز ${dl(stW, 1)}</span><span class="chip sm">۳۰ روز ${dl(stM, 1)}</span></div>
    <div style="margin:12px -4px 0">${NB.area(st, 330, 70, { padX: 4, padT: 6, padB: 4, op: .12, end: true })}</div>
    ${msg(stW > .3 ? "پول نقد تازه داره وارد بازار کریپتو میشه؛ معمولاً برای قیمت‌ها مثبته." : stW < -.3 ? "پول نقد داره از بازار کریپتو بیرون میره؛ معمولاً برای قیمت‌ها منفیه." : "جریان پول نقد این هفته تقریباً ثابته.")}</div>` : ""}
  ${fr ? `<div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">نرخ تأمین مالی</span><span class="mut xs">فقط ارزهای دیجیتال</span></div>${fr}<div class="mut xs" style="padding:10px 0 4px;line-height:1.8">نرخ خیلی مثبت یعنی خریدارهای زیادی با اهرم وارد شدن و ریسک ریزش بالاست؛ خیلی منفی یعنی ریسک جهش ناگهانی.</div></div>` : ""}
  ${tv.length ? `<div ${rv("cd")}><div class="row sp" style="margin-bottom:4px"><span class="ttl">بیشترین سرمایه‌ی قفل‌شده</span><span class="mut xs">دیفای لاما</span></div>${tv.slice(0, 6).map(c => `<div class="tvl"><div class="row sp sm"><b>${esc(c.n)}</b><span class="mut">${usdS(c.t)}</span></div><div class="bub"><i style="width:${(c.t / tvMax * 100).toFixed(1)}%"></i></div></div>`).join("")}</div>` : ""}
  <div ${rv("cd")}><div class="ttl" style="margin-bottom:10px">سایت‌های مرجع</div><div class="links">${[["لیدربورد هایپرلیکوید", "https://app.hyperliquid.xyz/leaderboard"], ["کوین‌گلس", "https://www.coinglass.com"], ["ویل آلرت", "https://whale-alert.io"], ["آرکهام", "https://intel.arkm.com"], ["نانسن", "https://www.nansen.ai"], ["لوکان‌چین", "https://www.lookonchain.com"], ["دیفی لاما", "https://defillama.com"], ["فیوچرز بایننس", "https://www.binance.com/en/futures/BTCUSDT"]].map(l => `<button class="lk" data-ext="${l[1]}">${l[0]}${I.ext}</button>`).join("")}</div></div>
  <div class="foot">پول هوشمند هم اشتباه می‌کنه. این داده‌ها فقط برای اطلاع هستن.</div>`;
};

/* ================= NEWS (economic calendar) ================= */
const CURS = ["USD", "EUR", "GBP", "CHF", "CAD", "NZD", "CNY"], HIDE = { AUD: 1, JPY: 1 };
UI.news = function () {
  const s = S(), items = s.cal || [], now = Date.now(), today = dayKey(now);
  const alive = items.filter(i => dayKey(i.ts) >= today);
  const pass = i => (s.calImp === "all" || i.impact === "High") && (s.calCur === "all" || i.cur === s.calCur);
  /* two week strips (this week + next week, Saturday first); a tap shows exactly that day's news */
  const d0 = new Date(), wd = (d0.getDay() + 1) % 7, sat = new Date(d0.getTime() - wd * 864e5);
  const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(sat.getTime() + i * 864e5)));
  if (!s.calDay || !days.includes(s.calDay)) s.calDay = today;
  const sel = s.calDay, isToday = sel === today;
  const vis = items.filter(i => dayKey(i.ts) === sel && pass(i));
  const evDays = {}; items.filter(pass).forEach(i => { const k = dayKey(i.ts); evDays[k] = (evDays[k] || 0) + 1; });
  const lastLive = items.filter(i => !i.alt).reduce((m, i) => Math.max(m, i.ts), 0);
  const dayBtn = i => { const k = days[i]; return `<button class="wd${k < today ? " past" : ""}${k === sel ? " on" : ""}${k === today ? " today" : ""}" data-day="${k}"><small>${["ش", "ی", "د", "س", "چ", "پ", "ج"][i % 7]}</small><b>${dateFa(new Date(sat.getTime() + i * 864e5), { day: "numeric" })}</b>${evDays[k] ? "<i></i>" : ""}</button>`; };
  const wk = `<div class="wkl">این هفته</div><div class="week">${[0, 1, 2, 3, 4, 5, 6].map(dayBtn).join("")}</div><div class="wkl">هفته‌ی بعد · ${dateFa(new Date(sat.getTime() + 7 * 864e5), { day: "numeric", month: "long" })} تا ${dateFa(new Date(sat.getTime() + 13 * 864e5), { day: "numeric", month: "long" })}</div><div class="week">${[7, 8, 9, 10, 11, 12, 13].map(dayBtn).join("")}</div>`;
  const notYet = new Date(sel + "T00:00:00+03:30").getTime() > lastLive;
  const up = alive.filter(i => ["USD", "EUR", "GBP"].includes(i.cur) && i.ts > now);
  const nx = up.find(i => i.impact === "High") || up[0];
  let next = "";
  if (nx) {
    const m = Math.max(0, Math.round((nx.ts - now) / 60000)), dd = Math.floor(m / 1440), hh = Math.floor(m % 1440 / 60), mm = m % 60;
    const tr = NB.calTrend(nx), lb = NB.calLabels(nx.c);
    next = `<div ${rv("cd tapc")} data-open="e:${esc(nx.id)}"><div class="row sp"><span class="ttl">${I.cal}خبر بعدی</span>${live(s.t.cal, s.stale.cal, "")}</div>
      <div class="big evt"><span class="cc">${esc(nx.cur)}</span>${esc(nx.c.fa || nx.title)}</div>
      <div class="mut sm">${esc(nx.title)} · ${dayFa(nx.ts)} · ساعت ${timeFa(nx.ts)}</div>
      <div class="cdn">${dd ? `<div><b>${faN(dd)}</b><small>روز</small></div>` : ""}<div><b>${faN(hh)}</b><small>ساعت</small></div><div><b>${faN(mm)}</b><small>دقیقه</small></div><div><b>${faD(nx.fc || "—")}</b><small>پیش‌بینی</small></div><div><b>${faD(nx.pv || "—")}</b><small>قبلی</small></div></div>
      <div class="row wrap" style="gap:6px"><span class="mut xs">${lb[0]}:</span>${NB.calFx(nx, true).slice(0, 3).map(a => `<span class="dl ${a.cls}">${a.fa} ${a.cls === "up" ? "▲" : "▼"}</span>`).join("")}</div></div>`;
  }
  /* the chosen day */
  const MV = { XAUUSD: "طلا", EURUSD: "یورو/دلار", WTI: "نفت", BTC: "بیت‌کوین" };
  const selTs = vis.length ? vis[0].ts : new Date(sel + "T12:00:00+03:30").getTime();
  let list = `<div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">${dayFa(selTs)}${isToday ? ' <span class="tag">امروز</span>' : sel < today ? ' <span class="tag">گذشته</span>' : ""}</span><span class="mut xs">${vis.length ? faN(vis.length) + " خبر" : ""}</span></div>`;
  vis.forEach(it => {
    const past = it.ts < now, av = NB.calActual(it), mv = past && s.moves ? s.moves[it.ts] : null;
    const mvh = mv && mv.items ? Object.keys(MV).filter(k => mv.items[k] && isFinite(mv.items[k].m60)).map(k => `<span class="dl ${dir(mv.items[k].m60)}">${MV[k]} ${mv.items[k].m60 > 0 ? "▲" : "▼"} ${pct(mv.items[k].m60, 2)}</span>`).join("") : "";
    list += `<button class="ev${past ? " done" : ""}" data-open="e:${esc(it.id)}"><div class="tm">${timeFa(it.ts)}<small class="ltr">${esc(it.cur)}</small></div><div><b>${esc(it.c.fa || it.title)}<span class="imp ${it.impact === "High" ? "h" : "m"}"><i></i><i></i><i${it.impact === "High" ? "" : ' class="o"'}></i></span>${it.alt ? ' <span class="tag">تاریخ رسمی</span>' : ""}</b>
      <div class="meta">${it.ac ? `<span>واقعی <b>${faD(it.ac)}</b>${av && av.d ? (av.better > 0 ? ' <b class="tx-up">بهتر</b>' : ' <b class="tx-dn">بدتر</b>') : ""}</span>` : past ? '<span class="tag">منتشر شد</span>' : ""}<span>پیش‌بینی <b>${faD(it.fc || "—")}</b></span><span>قبلی <b>${faD(it.pv || "—")}</b></span></div>
      ${past ? (mvh ? `<div class="mvrow"><span class="mut xs">حرکت بازار تا ۱ ساعت بعد:</span>${mvh}</div>` : mv === undefined && now - it.ts < 4 * 864e5 ? '<div class="mvrow mut xs">در حال گرفتن حرکت بازار…</div>' : "") : ""}</div></button>`;
  });
  if (!vis.length) list += `<div class="mut sm lh" style="padding:16px 4px 18px;text-align:center">${!items.length ? "" : notYet ? "تقویم کامل این روز هنوز منتشر نشده. Forex Factory معمولاً آخر هفته تقویم هفته‌ی بعد رو منتشر می‌کنه و اپ خودش به‌روزش می‌کنه." : s.calImp === "High" ? "این روز خبر مهمی نداره. «مهم و متوسط» رو بزن تا خبرهای متوسط هم بیاد." : "این روز خبری نداره."}</div>`;
  else if (notYet) list += `<div class="mut xs lh" style="padding:4px 4px 12px">تقویم کامل این روز هنوز منتشر نشده؛ این‌ها تاریخ‌های رسمی خبرهای مهم آمریکان.</div>`;
  list += "</div>";
  const present = {}; alive.forEach(i => { present[i.cur] = 1; });
  const curChips = [["all", "همه‌ی ارزها"]].concat(CURS.filter(c => present[c]).map(c => [c, c]));
  const news = (s.calNews || []).map(n => ({ t: new Date(n.ts).getTime(), n })).filter(o => o.t && now - o.t < 48 * 3600e3 && o.t <= now + 3600e3).sort((a, b) => b.t - a.t).slice(0, 5);
  return `${header("خبرهای مهم اقتصادی و اثرشون · به وقت تهران", "واکنش بازار")}
  <div ${rv()}>${wk}</div>
  <div ${rv("seg")}><button data-imp="High" class="${s.calImp === "High" ? "on" : ""}">فقط خبرهای مهم</button><button data-imp="all" class="${s.calImp === "all" ? "on" : ""}">مهم و متوسط</button></div>
  <div ${rv("seg")}>${curChips.map(c => `<button data-cur="${c[0]}" class="${s.calCur === c[0] ? "on" : ""}">${c[1]}</button>`).join("")}</div>
  ${!items.length ? `<div ${rv("cd")}>${s.err.cal ? msg("تقویم دریافت نشد. اینترنت رو چک کن و دوباره بزن.") : '<i class="skl" style="height:140px"></i>'}</div>` : ""}
  ${isToday ? next : ""}
  ${items.length ? list : ""}
  ${isToday && news.length ? `<div ${rv("cd tight")}><div class="row sp cardh"><span class="ttl">اطلاعیه‌های مهم دلار</span><span class="mut xs">۴۸ ساعت اخیر</span></div>${news.map(o => `<button class="ev" ${o.n.link && /^https:\/\//.test(o.n.link) ? `data-ext="${esc(o.n.link)}"` : ""}><div class="tm">${timeFa(o.t)}<small>${dateFa(o.t, { day: "numeric", month: "short" })}</small></div><div><b class="ltr" style="text-align:left;font-weight:600;font-size:13.5px">${esc(o.n.title)}</b><div class="meta"><span>${esc(o.n.src || "")}</span></div></div></button>`).join("")}</div>` : ""}
  ${!isToday && next ? `<button ${rv("btn ghost")} data-day="${today}">برگشت به امروز و خبر بعدی</button>` : ""}
  <div class="foot">جهت‌ها از رابطه‌ی معمول هر ارز با دارایی‌ها برآورد شدن و پیش‌بینی قطعی یا توصیه‌ی معامله نیستن.</div>`;
};

/* ================= RSI ================= */
/* same lists as the original scanner: RSI under the threshold, MACD bullish cross under zero, both, smart money (in/out), all */
const isLow = (a, thr) => a && a.r != null && a.r < thr, hasX = a => a && a.x != null && a.x >= 0, isNew = (a, thr) => isLow(a, thr) && a.rp != null && a.rp >= thr;
UI.rsiLists = function () {
  const s = S(), d = s.rsiData, k = s.rsiMode, thr = s.rsiThr, coins = d ? d.coins : [];
  const withR = coins.filter(c => c[k] && c[k].r != null), rsiL = withR.filter(c => isLow(c[k], thr)), macdL = coins.filter(c => hasX(c[k])), bothL = rsiL.filter(c => hasX(c[k]));
  const found = coins.filter(c => isLow(c[k], thr) || hasX(c[k]));
  const flowIn = found.filter(c => { const f = NB.SC.sf(c, k); return f != null && f >= 25; }), flowOut = found.filter(c => { const f = NB.SC.sf(c, k); return f != null && f <= -25; });
  return { withR, rsiL, macdL, bothL, flowIn, flowOut, nNew: rsiL.filter(c => isNew(c[k], thr)).length };
};
UI.rsiRows = function () {
  const s = S(), k = s.rsiMode, t = s.rsiTab, L = UI.rsiLists();
  const base = t === "rsi" ? L.rsiL : t === "macd" ? L.macdL : t === "both" ? L.bothL : t === "flow" ? (s.rsiFlow === "in" ? L.flowIn : L.flowOut) : L.withR;
  const q = (s.rsiQ || "").trim().toLowerCase();
  return base.filter(c => !q || c.sym.toLowerCase().includes(q) || (c.name || "").toLowerCase().includes(q) || (c.en || "").toLowerCase().includes(q)).sort((a, b) => {
    const va = a[k], vb = b[k];
    if (t === "macd") { const dd = va.x - vb.x; if (dd) return dd; }
    if (t === "flow") { const df = s.rsiFlow === "in" ? NB.SC.sf(b, k) - NB.SC.sf(a, k) : NB.SC.sf(a, k) - NB.SC.sf(b, k); if (df) return df; }
    return (va.r == null ? 101 : va.r) - (vb.r == null ? 101 : vb.r);
  });
};
UI.rsi = function () {
  const s = S(), d = s.rsiData, k = s.rsiMode, T = NB.TFS[s.rsiTf];
  const coins = d ? d.coins : [], L = UI.rsiLists();
  const cnt = t => (t === "rsi" ? L.rsiL : t === "macd" ? L.macdL : L.bothL).length;
  const W = s.wh || {};
  const top40 = coins.slice().sort((a, b) => (a.rank || 9999) - (b.rank || 9999)).slice(0, 40);
  const heat = top40.map(c => { const v = c[k] && c[k].r; return `<i class="${v == null ? "" : v < 30 ? "a" : v < 35 ? "b" : v < 45 ? "c" : v > 70 ? "e" : ""}"></i>`; }).join("");
  const rows = UI.rsiRows();
  const ring = v => { const c = v / 100; return `<div class="ring"><svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="19" fill="none" stroke="var(--chip2)" stroke-width="4"/><circle cx="23" cy="23" r="19" fill="none" stroke="${v < 30 ? "var(--ink)" : v > 70 ? "var(--blue)" : "var(--ink2)"}" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="${c.toFixed(3)} 1"/></svg><b>${faN(v, 1)}</b></div>`; };
  const rowH = c => { const a = c[k], tags = [], sfv = NB.SC.sf(c, k), wz = NB.SC.whaleOf(c.sym);
    if (isNew(a, s.rsiThr)) tags.push(["جدید", "new"]);
    if (hasX(a)) tags.push(["MACD ↑ زیر صفر · " + (a.x === 0 ? "کندل جاری" : faN(a.x) + " کندل پیش"), "mx"]);
    if (sfv != null && sfv >= 25) tags.push(["ورود پول" + (a.vs >= 1.8 ? " · حجم بالا" : ""), "in"]); else if (sfv != null && sfv <= -25) tags.push(["خروج پول", "out"]);
    if (wz) tags.push(["نهنگ HL: " + (wz.p >= 50 ? faN(wz.p) + "٪ لانگ" : faN(100 - wz.p) + "٪ شورت"), "wh"]);
    return `<button class="rr" data-open="r:${esc(c.sym)}"><span class="rk">${faN(c.rank || 0)}</span><div class="lo">${NB.logo(c.sym)}</div><div class="nm"><b>${esc(c.name)}</b><small><span class="ltr">${esc(c.sym)}</span> · ${esc(c.ex)} · <span class="ltr">$${c.price >= 1 ? faN(c.price, c.price >= 1000 ? 0 : 2) : faN(c.price, 6)}</span></small>${tags.length ? `<div class="row wrap" style="gap:4px;margin-top:5px">${tags.map(t => `<span class="tag t-${t[1]}">${t[0]}</span>`).join("")}</div>` : ""}<span class="more">تحلیل بنیادی ‹</span></div>${dl(c.ch)}${ring(a.r)}</button>`; };
  const lim = s.rsiShow || 40;
  return `${header((d ? faN(coins.length) + " ارز برتر · " : "") + T.label, "اسکنر RSI")}
  <div ${rv("segc")}>${Object.keys(NB.TFS).map(tf => `<button data-tf="${tf}" class="${s.rsiTf === tf ? "on" : ""}">${NB.TFS[tf].label}</button>`).join("")}</div>
  <div ${rv("cd")}><div class="row sp"><span class="ttl">${I.gauge}اشباع فروش</span>${s.rsiBusy ? `<span class="mut xs">${esc(s.rsiMsg || "")}</span>` : `<button class="live${d ? "" : " off"}" data-act="rscan"><i></i>${d ? ago(d.ts) + " · اسکن دوباره" : "اسکن کن"}</button>`}</div>
    ${s.rsiBusy ? `<div class="prog"><i style="width:${Math.round((s.rsiProg || 0) * 100)}%"></i></div>` : ""}
    <div class="huge">${d ? N(cnt("rsi"), 0, "rsicnt") : "—"}<span class="unit" style="font-size:16px">ارز زیر RSI ${faN(s.rsiThr)}</span></div>
    <div class="mut sm lh">یعنی قیمتشون توی مدت کوتاه زیاد ریخته. احتمال برگشت بیشتره، ولی تضمینی نیست.</div>
    ${top40.length ? `<div class="rheat">${heat}</div><div class="lg3"><span><i class="u"></i>زیر ۳۰</span><span><i class="b2"></i>۳۰ تا ۳۵</span><span><i class="c2"></i>۳۵ تا ۴۵</span><span><i></i>بالای ۴۵</span></div>` : ""}
    ${s.rsiErr ? msg(esc(s.rsiErr), I.shield) : ""}</div>
  <div ${rv("cd")} style="padding:14px 18px"><div class="row sp"><span class="ttl">آستانه‌ی RSI</span><b class="num" style="font-size:18px" id="thrv">${faN(s.rsiThr)}</b></div>
    <input type="range" class="sld" min="15" max="40" step="1" value="${s.rsiThr}" id="thr" style="--p:${((s.rsiThr - 15) / 25 * 100).toFixed(1)}%">
    <div class="row sp" style="margin-top:8px"><span class="mut xs">کندل</span><div class="segc mini"><button data-mode="L" class="${k === "L" ? "on" : ""}">جاری (زنده)</button><button data-mode="C" class="${k === "C" ? "on" : ""}">آخرین بسته‌شده</button></div></div></div>
  <div ${rv("seg")}><button data-rtab="rsi" class="${s.rsiTab === "rsi" ? "on" : ""}">RSI زیر ${faN(s.rsiThr)} (${faN(cnt("rsi"))})${L.nNew ? " · " + faN(L.nNew) + " جدید" : ""}</button><button data-rtab="macd" class="${s.rsiTab === "macd" ? "on" : ""}">MACD ↑ زیر صفر (${faN(cnt("macd"))})</button><button data-rtab="both" class="${s.rsiTab === "both" ? "on" : ""}">هر دو (${faN(cnt("both"))})</button><button data-rtab="flow" class="${s.rsiTab === "flow" ? "on" : ""}">پول هوشمند (${faN((s.rsiFlow === "in" ? L.flowIn : L.flowOut).length)})</button><button data-rtab="all" class="${s.rsiTab === "all" ? "on" : ""}">همه (${faN(L.withR.length)})</button></div>
  ${s.rsiTab === "flow" ? `<div ${rv("seg")}><button data-flow="in" class="${s.rsiFlow === "in" ? "on" : ""}">ورود پول (${faN(L.flowIn.length)})</button><button data-flow="out" class="${s.rsiFlow === "out" ? "on" : ""}">خروج پول (${faN(L.flowOut.length)})</button></div>
    <div ${rv("cd")} style="padding:12px 16px"><div class="row sp"><span class="sm" style="font-weight:600;line-height:1.7">${I.whale.replace("<svg", '<svg width="16" height="16" style="display:inline;vertical-align:-3px;margin-inline-end:4px"')}${W.loading ? "در حال خوندن موقعیت کیف‌پول‌های برتر هایپرلیکوید…" : W.n ? "موقعیت " + faN(W.n) + " کیف‌پول برتر هایپرلیکوید · " + ago(s.t.hl) : s.err.hl ? "هایپرلیکوید جواب نداد" + (NB.NET.vpn ? "؛ کمی بعد دوباره بزن." : "؛ بدون فیلترشکن باز نمیشه.") : "داده‌ی نهنگ‌ها هنوز گرفته نشده."}</span><button class="live" data-act="whrefresh"><i></i>به‌روزرسانی</button></div>
      <div class="mut xs lh" style="margin-top:6px">از بین ارزهایی که RSI پایین یا تقاطع MACD دارن، اون‌هایی که ${s.rsiFlow === "in" ? "ورود" : "خروج"} پول دارن. امتیاز = ۵۵٪ جریان کندلی + ۴۵٪ خالص لانگ و شورت نهنگ‌ها.</div></div>` : ""}
  <div ${rv()}><input class="search" id="rq" type="search" placeholder="جستجوی نام یا نماد ارز" value="${esc(s.rsiQ || "")}" autocomplete="off"></div>
  <div ${rv("cd list")} style="padding:4px 16px">${rows.length ? rows.slice(0, lim).map(rowH).join("") : `<div class="mut sm" style="padding:18px 0;text-align:center">${d ? "ارزی با این فیلتر پیدا نشد." : s.rsiBusy ? "در حال بررسی ارزها…" : "هنوز اسکن نشده."}</div>`}</div>
  ${rows.length > lim ? `<button ${rv("btn ghost")} data-act="rmore">نمایش ${faN(Math.min(40, rows.length - lim))} ارز دیگه</button>` : ""}
  ${d && !s.rsiBusy ? `<div class="foot">تایم‌فریم ${T.label} · آخرین به‌روزرسانی ${ago(d.ts)} · ${faN(L.withR.length)} ارز بررسی شد${coins.length - L.withR.length > 0 ? " · " + faN(coins.length - L.withR.length) + " ارز سابقه‌ی کافی نداشت" : ""}</div>` : ""}
  ${d && d.missing && d.missing.length ? `<details ${rv("cd det")}><summary>${faN(d.missing.length)} ارز از ۵۰۰ ارز برتر بررسی نشد (جفت‌ارز USDT نداشتن)</summary><p class="mut xs lh ltr" style="text-align:right;margin-top:8px">${esc(d.missing.join("، "))}</p></details>` : ""}
  <details ${rv("cd det")}><summary>راهنما و توضیح معیارها</summary><div class="sm lh mut guide">${NB.SC.GUIDE}</div></details>`;
};
})();
