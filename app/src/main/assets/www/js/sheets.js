/* Nabz Bazar — bottom sheets: asset detail, converter, gold calculator, search, settings, calendar event, RSI coin, whales */
"use strict";
(function () {
const { faN, pct, dir, esc, dl, cdec, usdS, usdM, ago, timeFa, dayFa, dateFa, I } = NB;
const SH = NB.SH = {};
const S = () => NB.S;
const huge = (v, d, unit) => `<div class="huge"><b class="n" data-v="${v}" data-d="${d}" data-k="sheet">${faN(v, d)}</b><span class="unit" style="font-size:16px">${unit}</span></div>`;
const starBtn = id => `<button class="ib sm star${S().stars.includes(id) ? " on" : ""}" data-star="${esc(id)}" aria-label="ستاره‌دار">${S().stars.includes(id) ? I.starF : I.star}</button>`;
const tvBtn = sym => sym ? `<div class="row" style="gap:10px;margin-top:14px"><button class="btn" style="flex:1" data-ext="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym)}">${I.chart}نمودار کامل در TradingView</button></div>` : "";
const segR = (cur, list) => `<div class="segc" data-ranges>${list.map(r => `<button data-r="${r[0]}" class="${cur === r[0] ? "on" : ""}">${r[1]}</button>`).join("")}</div>`;
const chartBox = (inner, title, right) => `<div class="cd chartc"><div class="row sp" style="margin-bottom:8px"><span class="ttl">${I.chart}${title}</span><span class="mut xs">${right || ""}</span></div><div class="chartw">${inner}</div></div>`;
function chartHTML(pts, labels) {
  if (!pts || pts.length < 2) return chartBox(`<div class="nochart" style="height:150px">داده‌ی نمودار در دسترس نیست</div>`, "نمودار");
  const vals = pts.map(p => p[1]), mx = Math.max(...vals), mn = Math.min(...vals);
  const ch = (vals[vals.length - 1] - vals[0]) / vals[0] * 100;
  const dec = mx >= 1000 ? 0 : mx >= 10 ? 2 : 4;
  const lab = labels || [pts[0][0], pts[Math.floor(pts.length / 2)][0], pts[pts.length - 1][0]].map(t => dateFa(t, { day: "numeric", month: "short" }));
  return chartBox(NB.area(vals, 320, 150, { padX: 4, padT: 10, padB: 8, op: .12, end: true }) + `<div class="row sp mut xs ltr" style="margin-top:8px">${lab.map(l => `<span>${l}</span>`).join("")}</div>`,
    `<span class="${ch >= 0 ? "tx-up" : "tx-dn"}">${ch >= 0 ? "▲" : "▼"} ${pct(ch, 1)}</span>`, `بیشترین ${faN(mx, dec)} · کمترین ${faN(mn, dec)}`);
}
SH.chartHTML = chartHTML;

/* ---------------- crypto ---------------- */
SH.crypto = function (id) {
  const s = S(), c = (s.mk || []).find(x => x.id === id) || (s.univ || []).find(x => x.id === id);
  if (!c) return { html: `<div class="mut">این ارز پیدا نشد.</div>` };
  const p = c.p ?? c.price, usd = s.ir && s.ir.usd, rng = s.range || "30";
  const sym = c.s || c.sym, perp = sym + "USDT";
  const fut = (s.fut || {})[perp], ls = (s.ls || {})[perp];
  const agg = s.hl ? NB.hlAgg(s.hl, 10).find(a => a.c === sym) : null;
  const rsiC = s.rsiAll && s.rsiAll[sym];
  const html = `<div class="row sp"><span class="cap">${esc((c.en || c.n || "").toUpperCase())} · ${esc(sym)}</span>${starBtn("c:" + id)}</div>
    ${huge(p, cdec(p), "دلار")}
    <div class="row">${dl(c.ch)}<span class="mut sm">در ۲۴ ساعت گذشته${c.r ? " · رتبه‌ی " + faN(c.r) : ""}</span></div>
    ${usd ? `<p class="expl mut">هر ${esc(c.n)} الان حدود <b class="ink">${p * usd >= 1e9 ? faN(p * usd / 1e9, 2) + " میلیارد" : p * usd >= 1e6 ? faN(p * usd / 1e6, 2) + " میلیون" : faN(p * usd, 0)} تومانه</b>، با دلار ${faN(usd)} تومان.${c.mc ? " ارزش کل بازارش " + usdS(c.mc) + "." : ""}</p>` : '<div style="height:12px"></div>'}
    ${segR(rng, [["1", "۱ روز"], ["7", "۷ روز"], ["30", "۳۰ روز"], ["90", "۹۰ روز"], ["365", "یک سال"]])}
    <div data-chart>${chartBox('<i class="skl" style="height:150px"></i>', "نمودار")}</div>
    <div class="mini3"><div><small>RSI روزانه</small><b data-rsi>${rsiC ? faN(rsiC, 1) : "…"}</b><i class="mut" data-rsiw>${rsiC ? rsiWord(rsiC) : ""}</i></div>
      <div data-lsbox>${lsBox(ls, fut, false)}</div>
      <div data-hlbox>${hlBox(agg, !s.hl)}</div></div>
    ${tvBtn("BINANCE:" + sym + "USDT")}`;
  return { html, mount: el => {
    if (!ls) NB.loadLS(perp).then(r => { s.ls[perp] = r.v; const b = el.querySelector("[data-lsbox]"); if (b) b.innerHTML = lsBox(r.v, (s.fut || {})[perp]); }, () => { const b = el.querySelector("[data-lsbox]"); if (b) b.innerHTML = lsBox(null, (s.fut || {})[perp], true); });
    if (!s.hl) NB.loadHlPositions().then(r => { s.hl = r.v; s.t.hl = r.t; const a = NB.hlAgg(r.v, 10).find(x => x.c === sym); const b = el.querySelector("[data-hlbox]"); if (b) b.innerHTML = hlBox(a, false); }, () => { const b = el.querySelector("[data-hlbox]"); if (b) b.innerHTML = hlBox(null, false); });
    const load = r => {
      s.range = r; el.querySelectorAll("[data-ranges] button").forEach(b => b.classList.toggle("on", b.dataset.r === r));
      NB.loadKlines(sym, r, id).then(res => { const box = el.querySelector("[data-chart]"); if (box) box.innerHTML = chartHTML(res.v); }).catch(() => { const box = el.querySelector("[data-chart]"); if (box) box.innerHTML = chartHTML(null); });
    };
    el.querySelector("[data-ranges]").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { NB.App.tap(); load(b.dataset.r); } });
    load(rng);
    if (!rsiC) NB.loadKlines(sym, "90", id).then(res => { const v = NB.rsi(res.v.map(x => x[1])); const b = el.querySelector("[data-rsi]"); if (b && v != null) { b.textContent = faN(v, 1); el.querySelector("[data-rsiw]").textContent = rsiWord(v); } }).catch(() => { });
  } };
};
const lsBox = (ls, fut, failed) => `<small>خریدارهای بایننس</small><b>${ls ? faN(ls.l, 1) + "٪" : failed === false ? "…" : "—"}</b><i class="${ls ? (ls.l >= 50 ? "tx-up" : "tx-dn") : "mut"}">${ls ? (ls.l >= 50 ? "بیشتر خریدارن" : "بیشتر فروشنده‌ان") : failed === false ? "" : fut != null ? "تأمین مالی " + faN(fut, 4) + "٪" : "فیوچرز نداره"}</i>`;
const hlBox = (agg, loading) => `<small>نهنگ‌ها</small><b>${agg ? faN(Math.max(agg.l, agg.s) / (agg.l + agg.s) * 100, 0) + "٪" : loading ? "…" : "—"}</b><i class="${agg ? (agg.l >= agg.s ? "tx-up" : "tx-dn") : "mut"}">${agg ? (agg.l >= agg.s ? "خریدارن" : "فروشنده‌ان") : loading ? "" : "موقعیتی ندارن"}</i>`;
const rsiWord = v => v < 30 ? "اشباع فروش" : v < 40 ? "نزدیک اشباع فروش" : v > 70 ? "اشباع خرید" : v > 60 ? "نزدیک اشباع خرید" : "خنثی";

/* ---------------- forex / metals / oil ---------------- */
const TVS = { EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", USDCHF: "FX:USDCHF", USDCAD: "FX:USDCAD", NZDUSD: "FX:NZDUSD", XAUUSD: "OANDA:XAUUSD", XAGUSD: "OANDA:XAGUSD", WTI: "TVC:USOIL", BRENT: "TVC:UKOIL", DXY: "TVC:DXY" };
const FXEXPL = { XAUUSD: "قیمت جهانی هر اونس طلا (۳۱٫۱ گرم).", XAGUSD: "قیمت جهانی هر اونس نقره.", WTI: "نفت خام آمریکا، هر بشکه.", BRENT: "نفت دریای شمال، معیار قیمت نفت جهان، هر بشکه.", EURUSD: "هر یورو چند دلاره.", GBPUSD: "هر پوند چند دلاره.", USDCHF: "هر دلار چند فرانک سوئیسه.", USDCAD: "هر دلار چند دلار کاناداست.", NZDUSD: "هر دلار نیوزیلند چند دلار آمریکاست." };
SH.fx = function (k) {
  const s = S(), d = (s.fx || {})[k], f = NB.UI.FXL.find(x => x[0] === k) || [k, k, k, 2];
  if (!d) return { html: `<div class="cap">${f[2]}</div><div class="big">${f[1]}</div>${NB.UI_msg ? "" : ""}<p class="expl mut">قیمت این مورد الان در دسترس نیست. سرور قیمت فارکس جواب نداده.</p>${tvBtn(TVS[k])}` };
  let toman = "";
  if (s.ir && s.ir.usd && (k === "XAUUSD" || k === "XAGUSD")) toman = `<p class="expl mut">هر گرم ${k === "XAUUSD" ? "طلای خالص" : "نقره‌ی خالص"} با دلار ${faN(s.ir.usd)} تومان حدود <b class="ink">${faN(d.p / 31.1035 * s.ir.usd, 0)} تومان</b> میشه. ${FXEXPL[k]}</p>`;
  const pts = (d.sp || []).map((v, i, a) => [Date.now() - (a.length - 1 - i) * 3600e3, v]);
  return { html: `<div class="row sp"><span class="cap">${f[2]}</span>${starBtn("f:" + k)}</div>
    <div class="big" style="margin:6px 0 0;font-size:22px">${f[1]}</div>
    ${huge(d.p, f[3], k.startsWith("XA") || k === "WTI" || k === "BRENT" ? "دلار" : "")}
    <div class="row">${dl(d.ch)}<span class="mut sm">در ۲۴ ساعت گذشته${d.approx ? " · تقریبی (از توکن طلا)" : ""}</span></div>
    ${toman || `<p class="expl mut">${FXEXPL[k] || ""}</p>`}
    ${chartHTML(pts, ["چند روز پیش", "", "الان"])}
    ${tvBtn(TVS[k])}` };
};

/* ---------------- Iranian prices with history ---------------- */
SH.iran = function (k) {
  const s = S(), r = s.ir || {}, name = NB.UI.irName(k);
  let v = r[k], ch = (r.chg || {})[k];
  if (k === "gold_24k" && !isFinite(v)) v = NB.UI.g24(r);
  if (k === "usdt") { const u = s.usdt || {}; const m = u.nobitex || Object.values(u)[0]; v = m && m.p; ch = m && m.ch; }
  const base = /^gold_\d+k$/.test(k) && k !== "gold_18k" ? "gold_18k" : k, fac = k === "gold_24k" && !isFinite(r.gold_24k) ? 24 / 18 : 1;
  const rng = s.irRange || "90";
  return { html: `<div class="row sp"><span class="cap">بازار داخلی · تومان</span>${starBtn("i:" + k)}</div>
    <div class="big" style="margin:6px 0 0;font-size:22px">${esc(name)}</div>
    ${isFinite(v) ? huge(v, 0, "تومان") : ""}
    <div class="row">${dl(ch)}<span class="mut sm">نسبت به روز قبل</span></div>
    ${s.ir && s.ir.usd && k !== "usd" && isFinite(v) ? `<p class="expl mut">معادل حدود <b class="ink">${faN(v / s.ir.usd, v / s.ir.usd >= 100 ? 0 : 2)} دلار</b> با دلار بازار آزاد.</p>` : '<div style="height:12px"></div>'}
    ${segR(rng, [["7", "۷ روز"], ["30", "۳۰ روز"], ["90", "۹۰ روز"], ["365", "یک سال"], ["0", "همه"]])}
    <div data-chart>${chartBox('<i class="skl" style="height:150px"></i>', "نمودار")}</div>`, mount: el => {
    let all = null;
    const draw = rr => {
      s.irRange = rr; el.querySelectorAll("[data-ranges] button").forEach(b => b.classList.toggle("on", b.dataset.r === rr));
      const box = el.querySelector("[data-chart]"); if (!box) return;
      if (!all) return;
      const n = +rr, pts = n ? all.slice(-n) : all;
      box.innerHTML = chartHTML(pts.map(p => [p[0], p[1] * fac]));
    };
    el.querySelector("[data-ranges]").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { NB.App.tap(); draw(b.dataset.r); } });
    NB.loadIrHist(base).then(res => { all = res.v; draw(rng); }).catch(() => { const box = el.querySelector("[data-chart]"); if (box) box.innerHTML = chartHTML(null); });
  } };
};

/* ---------------- converter ---------------- */
const CV_FX = [["IRT", "تومان"], ["USD", "دلار آمریکا"], ["USDT", "تتر"], ["EUR", "یورو"], ["GBP", "پوند"], ["AED", "درهم"], ["TRY", "لیر"], ["CHF", "فرانک"], ["CAD", "دلار کانادا"], ["XAU", "طلا (اونس)"], ["G18", "طلای ۱۸ عیار (گرم)"], ["EMAMI", "سکه امامی"]];
function usdOf(code) {
  const s = S(), fx = s.fx || {}, ir = s.ir || {}, g = k => fx[k] && fx[k].p, u = ir.usd;
  switch (code) {
    case "USD": return 1; case "EUR": return g("EURUSD") || (u && ir.eur / u); case "GBP": return g("GBPUSD") || (u && ir.gbp / u);
    case "CHF": return g("USDCHF") ? 1 / g("USDCHF") : (u && ir.chf / u); case "CAD": return g("USDCAD") ? 1 / g("USDCAD") : (u && ir.cad / u);
    case "AED": return u && ir.aed / u; case "TRY": return u && ir.try / u; case "IRT": return u ? 1 / u : null;
    case "USDT": { const t = s.usdt && (s.usdt.nobitex || Object.values(s.usdt)[0]); return t && u ? t.p / u : 1; }
    case "XAU": return g("XAUUSD") || ir.gold_ounce; case "G18": return u && ir.gold_18k / u; case "EMAMI": return u && ir.coin_emami / u;
  }
  const c = (s.mk || []).find(x => x.s === code); return c ? c.p : null;
}
const CV_ICON = { IRT: NB.txt("ت"), USD: NB.txt("$"), USDT: I.usdt, EUR: NB.txt("€"), GBP: NB.txt("£"), AED: NB.txt("د"), TRY: NB.txt("₺"), CHF: NB.txt("Fr"), CAD: NB.txt("C$"), XAU: I.bar, G18: I.bar, EMAMI: I.coin };
/* an app-styled field that opens the picker */
const pickBtn = (id, opt) => `<button class="pickb" id="${id}" data-v="${esc(opt.v)}"><div class="lo xs2">${opt.icon || NB.txt(opt.label.slice(0, 1))}</div><div class="nm"><b>${esc(opt.label)}</b>${opt.sub ? `<small>${esc(opt.sub)}</small>` : ""}</div><span class="chevd">${I.chev}</span></button>`;
/* digits typed in any keyboard → shown in Persian with separators */
function numField(A, onChange) {
  const fmt = () => { const raw = NB.App.latin(A.value).replace(/[^\d.]/g, ""); if (!raw) return; const [i, f] = raw.split("."); const s = Number(i || 0).toLocaleString("fa-IR") + (f !== undefined ? "٫" + f.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]) : ""); if (A.value !== s) A.value = s; };
  A.addEventListener("input", () => { fmt(); onChange(); });
  A.addEventListener("focus", () => setTimeout(() => { try { A.setSelectionRange(A.value.length, A.value.length); } catch (e) { } }, 30));
}
SH.convert = function () {
  const s = S();
  const opts = CV_FX.map(x => ({ v: x[0], label: x[1], icon: CV_ICON[x[0]], group: "ارز و طلا" }))
    .concat((s.mk || []).filter(c => !c.st).slice(0, 40).map(c => ({ v: c.s, label: c.n, sub: c.s, icon: NB.logo(c.s), group: "ارز دیجیتال" })));
  let from = "USD", to = "IRT"; try { from = localStorage.getItem("cv:f") || from; to = localStorage.getItem("cv:t") || to; } catch (e) { }
  const get = v => opts.find(x => x.v === v) || opts[0];
  return { html: `<div class="cap">ماشین‌حساب تبدیل</div><div class="big" style="font-size:24px;margin-top:6px">تبدیل ارز، طلا و کریپتو</div>
    <div class="conv"><input id="cvA" type="text" inputmode="decimal" value="" placeholder="مقدار رو بنویس" class="cvin" aria-label="مقدار">
      <div class="cvr"><div id="cvFw">${pickBtn("cvF", get(from))}</div><button class="ib" id="cvS" aria-label="جابه‌جا">${I.swap}</button><div id="cvTw">${pickBtn("cvT", get(to))}</div></div>
      <div class="cvout" id="cvO">—</div></div>
    <div class="mut xs" style="margin-top:10px;line-height:1.8">نرخ تومان از بازار آزاد و نرخ‌های جهانی از بازار بین‌المللی گرفته میشه.</div>`,
    mount: el => {
      const A = el.querySelector("#cvA"), O = el.querySelector("#cvO");
      const cur = { F: get(from).v, T: get(to).v };
      const draw = () => { el.querySelector("#cvFw").innerHTML = pickBtn("cvF", get(cur.F)); el.querySelector("#cvTw").innerHTML = pickBtn("cvT", get(cur.T)); };
      const calc = () => {
        const amt = parseFloat(NB.App.latin(A.value).replace(/[^\d.]/g, ""));
        const uf = usdOf(cur.F), ut = usdOf(cur.T);
        try { localStorage.setItem("cv:f", cur.F); localStorage.setItem("cv:t", cur.T); } catch (e) { }
        if (!isFinite(amt) || !uf || !ut) { O.innerHTML = "—<small>قیمت این مورد هنوز دریافت نشده</small>"; return; }
        const r = amt * uf / ut, d = r >= 1000 ? 0 : r >= 1 ? 2 : r >= .01 ? 4 : 8, one = uf / ut;
        O.innerHTML = `${faN(r, d)} <span class="unit">${esc(get(cur.T).label)}</span><small>هر ۱ ${esc(get(cur.F).label)} = ${faN(one, one >= 1000 ? 0 : one >= 1 ? 2 : 6)} ${esc(get(cur.T).label)}</small>`;
      };
      numField(A, calc);
      el.querySelector(".cvr").addEventListener("click", e => {
        const b = e.target.closest(".pickb"); if (!b) return; NB.App.tap();
        const side = b.id === "cvF" ? "F" : "T";
        NB.App.picker({ cap: "ماشین‌حساب تبدیل", title: side === "F" ? "تبدیل از…" : "تبدیل به…", options: opts, value: cur[side], onPick: v => { cur[side] = v; draw(); calc(); } });
      });
      el.querySelector("#cvS").addEventListener("click", () => { NB.App.tap(); const x = cur.F; cur.F = cur.T; cur.T = x; draw(); calc(); });
      calc();
      setTimeout(() => A.focus(), 420);
    } };
};

/* ---------------- gold & coin calculator ---------------- */
SH.goldcalc = function () {
  const types = [["gold", "طلا (گرم)"], ["coin_emami", "سکه امامی"], ["coin_bahar", "بهار آزادی"], ["coin_half", "نیم‌سکه"], ["coin_quarter", "ربع‌سکه"], ["coin_gram", "سکه گرمی"]];
  return { html: `<div class="cap">ماشین‌حساب طلا و سکه</div><div class="big" style="font-size:24px;margin-top:6px">ارزش طلا یا سکه‌ات چقدره؟</div>
    <div class="chipg" id="gT">${types.map((t, i) => `<button data-v="${t[0]}" class="${i ? "" : "on"}">${i ? I.coin : I.bar}<span>${t[1]}</span></button>`).join("")}</div>
    <div id="gKw"><div class="mut sm" style="margin:14px 4px 8px">عیار</div><div class="segc" id="gK">${[24, 22, 21, 20, 18, 14].map(k => `<button data-v="${k}" class="${k === 18 ? "on" : ""}">${faN(k)}</button>`).join("")}</div></div>
    <div class="mut sm" id="gU" style="margin:14px 4px 8px">وزن به گرم</div><input id="gQ" type="text" inputmode="decimal" value="" placeholder="بنویس" class="cvin">
    <div class="cvout" id="gO">—</div>
    <div class="mut xs" style="margin-top:10px;line-height:1.8">عیارهای غیر از ۱۸ از روی قیمت ۱۸ عیار حساب میشن. اجرت و مالیات ساخت حساب نشده.</div>`,
    mount: el => {
      const Q = el.querySelector("#gQ"), O = el.querySelector("#gO"), U = el.querySelector("#gU"), KW = el.querySelector("#gKw");
      const st = { t: "gold", k: 18 };
      const calc = () => {
        const r = S().ir || {}, q = parseFloat(NB.App.latin(Q.value).replace(/[^\d.]/g, "")), g = st.t === "gold";
        KW.style.display = g ? "" : "none"; U.textContent = g ? "وزن به گرم" : "تعداد";
        const unit = g ? r.gold_18k * st.k / 18 : r[st.t];
        if (!isFinite(q) || !isFinite(unit)) { O.innerHTML = "—"; return; }
        const v = q * unit;
        O.innerHTML = `${faN(v, 0)} <span class="unit">تومان</span><small>${v >= 1e6 ? faN(v / 1e6, 2) + " میلیون تومان · " : ""}${r.usd ? "حدود " + faN(v / r.usd, 0) + " دلار" : ""}</small>`;
      };
      const seg = (id, key, num) => el.querySelector(id).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; NB.App.tap(2); el.querySelectorAll(id + " button").forEach(x => x.classList.toggle("on", x === b)); st[key] = num ? +b.dataset.v : b.dataset.v; calc(); });
      seg("#gT", "t"); seg("#gK", "k", 1);
      numField(Q, calc); calc();
      setTimeout(() => Q.focus(), 420);
    } };
};

/* ---------------- search ---------------- */
SH.search = function () {
  return { html: `<input class="search big" id="sq" type="search" placeholder="جستجوی ارز، طلا، سکه، فارکس…" autocomplete="off"><div id="sr" class="sres"></div>`, full: true,
    mount: el => {
      const q = el.querySelector("#sq"), out = el.querySelector("#sr");
      const items = () => {
        const s = S(), a = [];
        (s.mk || []).filter(c => !c.st).forEach(c => a.push({ k: "c:" + c.id, t: c.n, sub: c.s + " · " + c.en, ic: NB.logo(c.s), p: faN(c.p, cdec(c.p)) + " $", ch: c.ch }));
        NB.UI.FXL.forEach(f => { const d = (s.fx || {})[f[0]]; a.push({ k: "f:" + f[0], t: f[1], sub: f[2], ic: NB.logo(f[0], "fx"), p: d ? faN(d.p, f[3]) : "—", ch: d && d.ch }); });
        const r = s.ir || {};
        NB.UI.IR_FX.forEach(f => { if (isFinite(r[f[0]])) a.push({ k: "i:" + f[0], t: f[1], sub: "بازار داخلی", ic: NB.txt(f[2]), p: faN(r[f[0]]) + " تومان", ch: (r.chg || {})[f[0]] }); });
        [["gold_18k", "طلای ۱۸ عیار"], ["gold_24k", "طلای ۲۴ عیار"], ["gold_mesghal", "مثقال طلا"]].concat(NB.UI.IR_COIN.map(c => [c[0], c[1]])).forEach(([k, n]) => { if (isFinite(r[k])) a.push({ k: "i:" + k, t: n, sub: "طلا و سکه", ic: I.coin, p: faN(r[k]) + " تومان", ch: (r.chg || {})[k] }); });
        [["tab:smart", "پول هوشمند", "نهنگ‌ها، ترس و طمع، تأمین مالی"], ["tab:news", "واکنش بازار", "تقویم اقتصادی"], ["tab:rsi", "اسکنر RSI", "اشباع فروش"], ["act:convert", "ماشین‌حساب تبدیل", "ارز و طلا"], ["act:goldcalc", "ماشین‌حساب طلا و سکه", ""]].forEach(x => a.push({ k: x[0], t: x[1], sub: x[2], ic: I.chev, p: "", ch: null }));
        return a;
      };
      const all = items();
      const render = () => {
        const v = NB.App.latin(q.value.trim().toLowerCase());
        const r = (v ? all.filter(x => (x.t + " " + x.sub).toLowerCase().includes(v)) : all.slice(0, 12)).slice(0, 40);
        out.innerHTML = r.length ? r.map(x => `<button class="ar srow" data-go="${esc(x.k)}"><div class="lo">${x.ic}</div><div class="nm"><b>${esc(x.t)}</b><small>${esc(x.sub)}</small></div><span></span><div class="pr"><b>${x.p}</b>${x.ch != null ? dl(x.ch) : ""}</div></button>`).join("") : '<div class="mut sm" style="padding:24px;text-align:center">چیزی پیدا نشد.</div>';
      };
      q.addEventListener("input", render); render();
      out.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (!b) return; const k = b.dataset.go; NB.App.closeSheet(true); setTimeout(() => NB.App.go(k), 60); });
      setTimeout(() => q.focus(), 350);
    } };
};

/* ---------------- settings ---------------- */
const DEF_WORKER = "https://market-reaction-bot.ali-alasmia77.workers.dev/";
SH.settings = function () {
  const s = S(), n = NB.readNet();
  let th = "auto", hl = "wifi", wk = "", gh = "", hw = "";
  try { th = localStorage.getItem("set:theme") || "auto"; hl = localStorage.getItem("set:hl") || "wifi"; wk = localStorage.getItem("set:worker") || ""; gh = localStorage.getItem("set:ghtok") || ""; hw = localStorage.getItem("set:hlw") || ""; } catch (e) { }
  const seg = (name, cur, list) => `<div class="segc" data-set="${name}">${list.map(x => `<button data-v="${x[0]}" class="${cur === x[0] ? "on" : ""}">${x[1]}</button>`).join("")}</div>`;
  const hlAge = NB.hlWalletsAge();
  return { html: `<div class="cap">تنظیمات</div><div class="big" style="font-size:26px;margin-top:6px">تنظیمات</div>
    <div class="cd setc"><div class="ttl">ظاهر</div>${seg("theme", th, [["auto", "مثل گوشی"], ["light", "روز"], ["dark", "شب"]])}</div>
    <div class="cd setc"><div class="ttl">${I.shield}وضعیت اینترنت</div>
      <div class="sigr"><span>فیلترشکن</span><span class="dl ${n.vpn ? "up" : "fl"}">${n.vpn ? "روشن" : "خاموش"}</span></div>
      <div class="sigr"><span>نوع اتصال</span><span class="dl fl">${n.wifi ? "وای‌فای" : n.online ? "اینترنت گوشی" : "قطع"}</span></div>
      <div class="mut xs lh" style="margin-top:8px">لازم نیست فیلترشکن رو روشن و خاموش کنی. اپ برای هر منبع چند مسیر داره و یادش می‌مونه با فیلترشکن و بدون فیلترشکن کدوم مسیر جواب میده. فقط بایننس و هایپرلیکوید ایران رو تحریم کردن و برای اون دو تا فیلترشکن لازمه.</div></div>
    <div class="cd setc"><div class="ttl">${I.whale}فهرست نهنگ‌ها</div>
      <div class="mut xs lh">فهرست ۴۰ کیف‌پول پرسود از جدول هایپرلیکوید میاد که حدود ۳۹ مگابایته. موقعیت‌هاشون هر چند دقیقه با حجم خیلی کم به‌روز میشه، ولی خود فهرست روزی یک بار کافیه.</div>
      ${seg("hl", hl, [["wifi", "فقط با وای‌فای"], ["always", "همیشه"], ["manual", "فقط دستی"]])}
      <button class="btn ghost" data-act="hlrefresh" style="margin-top:12px">${I.refresh}به‌روزرسانی فهرست الان${hlAge ? " · آخرین بار " + ago(hlAge) : ""}</button></div>
    <div class="cd setc"><div class="ttl">سرور قیمت فارکس و داخلی</div><div class="mut xs lh">آدرس Cloudflare Worker. فارکس و نفت اول مستقیم از یاهو فایننس گرفته میشن و این سرور پشتیبانه.</div>
      <input class="search ltr" id="wkU" type="url" placeholder="${DEF_WORKER}" value="${esc(wk ? wk + "/" : DEF_WORKER)}" style="margin-top:10px">
      <button class="btn ghost" id="wkR" style="margin-top:0;height:40px;font-size:13px">برگردوندن آدرس پیش‌فرض</button></div>
    <div class="cd setc"><div class="ttl">اسکنر RSI · تنظیمات پیشرفته</div>
      <div class="mut xs lh">توکن GitHub (اختیاری): بدون توکن، GitHub فقط حدود ۶۰ درخواست در ساعت میده و بعدش امتیاز «توسعه» نشون داده نمیشه. توکن فقط روی همین گوشی می‌مونه و فقط به api.github.com فرستاده میشه.</div>
      <input class="search ltr" id="ghT" type="password" autocomplete="off" placeholder="github_pat_…" value="${esc(gh)}" style="margin-top:10px">
      <div class="mut xs lh">کیف‌پول‌های دلخواه هایپرلیکوید (هر آدرس توی یه خط): آدرس‌هایی که توی Nansen، Arkham یا هر جای دیگه پیدا کردی، کنار ۴۰ کیف‌پول برتر بررسی میشن.</div>
      <textarea class="search ltr" id="hlW" rows="3" placeholder="0x…" style="margin-top:10px">${esc(hw)}</textarea></div>
    <div class="cd setc"><div class="ttl">${I.layers}ویجت صفحه‌ی گوشی</div>
      <div class="mut xs lh">دو جور ویجت داری (انگشتت رو روی صفحه‌ی گوشی نگه دار ← ویجت‌ها ← نبض بازار): «ورق با کشیدن» که مثل دسته‌ی کارت با کشیدن بالا و پایین ورق می‌خوره، و «تک‌کارت» که همیشه یه کارت تمام‌اندازه نشون میده و با دکمه‌های ▲▼ ورق می‌خوره. هر ورقی که نمی‌خوای رو خاموش کن:</div>
      <div class="chipg wpg" id="wPg">${NB.App.WPAGES.map(p => `<button data-v="${p[0]}" class="${NB.App.wpages().includes(p[0]) ? "on" : ""}"><span>${p[1]}</span></button>`).join("")}</div></div>
    <div class="cd setc"><div class="ttl">حافظه</div><div class="mut xs lh">آخرین قیمت‌ها روی گوشی نگه داشته میشن که اپ همون لحظه باز بشه.</div><button class="btn ghost" data-act="clearcache" style="margin-top:12px">پاک کردن حافظه‌ی اپ</button></div>
    <button class="btn" id="saveBtn" style="margin-top:4px">ذخیره‌ی تنظیمات</button>
    <div class="credit"><b>Nabz Bazar</b><span>Idea — Ali Edrisi</span><span>Design — Mohammad Khaledi</span><span style="margin-top:8px;opacity:.7">v${NB.native ? NBN.version() : "web"}</span></div>`,
    mount: el => {
      el.querySelectorAll("[data-set]").forEach(g => g.addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return; NB.App.tap();
        g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
        try { localStorage.setItem("set:" + g.dataset.set, b.dataset.v); } catch (er) { }
        if (g.dataset.set === "theme") NB.App.applyTheme(true, b);
        NB.App.toast("ذخیره شد ✓");
      }));
      el.querySelector("#wPg").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return; NB.App.tap();
        const on = [...el.querySelectorAll("#wPg button.on")].map(x => x.dataset.v);
        if (b.classList.contains("on") && on.length === 1) { NB.App.toast("حداقل یه ورق باید روشن بمونه"); return; }
        b.classList.toggle("on");
        const pages = NB.App.WPAGES.map(p => p[0]).filter(k => el.querySelector(`#wPg button[data-v="${k}"]`).classList.contains("on"));
        try { localStorage.setItem("set:wpages", JSON.stringify(pages)); } catch (er) { }
        NB.App.pushWidget(); NB.App.toast("ذخیره شد ✓");
      });
      const w = el.querySelector("#wkU"), save = el.querySelector("#saveBtn");
      el.querySelector("#wkR").addEventListener("click", () => { NB.App.tap(); w.value = DEF_WORKER; save.textContent = "ذخیره‌ی تنظیمات"; });
      el.querySelectorAll("input,textarea").forEach(x => x.addEventListener("input", () => { save.textContent = "ذخیره‌ی تنظیمات"; save.classList.remove("done"); }));
      save.addEventListener("click", () => {
        const v = w.value.trim();
        if (v && !/^https:\/\/\S+$/i.test(v)) { NB.App.toast("آدرس سرور باید با https شروع بشه"); w.focus(); return; }
        const wallets = el.querySelector("#hlW").value.split(/[\s,;]+/).filter(Boolean), bad = wallets.filter(x => !/^0x[0-9a-fA-F]{40}$/.test(x));
        if (bad.length) { NB.App.toast("این آدرس کیف‌پول درست نیست: " + bad[0].slice(0, 12) + "…"); return; }
        try {
          const clean = v.replace(/\/+$/, "");
          localStorage.setItem("set:worker", clean === DEF_WORKER.replace(/\/+$/, "") ? "" : clean);
          localStorage.setItem("set:ghtok", el.querySelector("#ghT").value.trim());
          localStorage.setItem("set:hlw", wallets.join("\n"));
        } catch (e) { }
        NB.App.tap(1); save.textContent = "ذخیره شد ✓"; save.classList.add("done"); NB.App.toast("همه‌ی تنظیمات ذخیره شد ✓");
        NB.App.refresh(true);
      });
    } };
};

/* ---------------- calendar event ---------------- */
SH.event = function (id) {
  const s = S(), it = (s.cal || []).find(x => x.id === id);
  if (!it) return { html: '<div class="mut">این خبر دیگه در فهرست نیست.</div>' };
  const c = it.c, tr = NB.calTrend(it), av = NB.calActual(it), lb = NB.calLabels(c), cn = c.oil ? "قیمت نفت" : NB.CUR_FA[it.cur] || it.cur;
  const rows = strong => NB.calFx(it, strong).map(a => `<div class="asr"><b>${esc(a.fa)}</b><span class="dl ${a.cls}">${a.cls === "up" ? "▲ صعودی" : "▼ نزولی"}</span><span class="bars ${a.cls}">${[0, 1, 2, 3].map(i => `<i class="${i < a.lvl ? "f" : ""}"></i>`).join("")}</span>${a.id && a.id !== "CUR" ? `<span class="mut xs">${a.unit === "درصد" ? "" : "حدود "}${faN(a.lo, a.dec)} تا ${faN(a.hi, a.dec)} ${a.unit}</span>` : '<span class="mut xs">ارز خودِ خبر</span>'}</div>`).join("");
  const past = it.ts < Date.now();
  return { html: `<div class="row sp"><span class="cap ltr">${esc(it.cur)} · ${esc(it.title)}</span><span class="tag ${it.impact === "High" ? "red" : ""}">${it.impact === "High" ? "پرتأثیر" : "متوسط"}</span></div>
    <div class="big" style="font-size:24px">${esc(c.fa || it.title)}</div>
    <div class="mut sm">${dayFa(it.ts)} · ساعت ${timeFa(it.ts)} به وقت تهران</div>
    <div class="cdn"><div><b class="ltr">${esc(it.fc || "—")}</b><small>پیش‌بینی</small></div><div><b class="ltr">${esc(it.pv || "—")}</b><small>قبلی</small></div>${it.ac ? `<div><b class="ltr">${esc(it.ac)}</b><small>واقعی</small></div>` : ""}</div>
    ${av && it.ac ? `<div class="msg">${I.info}<span>عدد واقعی ${av.d === 0 ? "مطابق انتظار" : av.better > 0 ? "<b class='tx-up'>بهتر از انتظار</b>" : "<b class='tx-dn'>بدتر از انتظار</b>"} بود.</span></div>` : ""}
    <p class="expl mut">${esc(c.d)}</p>
    ${tr && tr.better !== 0 ? `<div class="cd setc"><div class="ttl">اول: پیش‌بینی نسبت به عدد قبلی</div><div class="sm lh" style="margin-top:6px">پیش‌بینی ${tr.d > 0 ? "بالاتر" : "پایین‌تر"} از عدد قبلیه؛ یعنی بازار ${tr.better > 0 ? "تقویت" : "ضعف"} ${esc(cn)} رو انتظار داره. بخشی از این معمولاً قبل از خبر توی قیمت میاد.</div></div>` : ""}
    ${past && it.ts > Date.now() - 4 * 864e5 ? `<div class="cd setc" data-move><div class="ttl">حرکت واقعی بازار بعد از خبر</div><div class="mut sm" style="margin-top:6px">در حال محاسبه…</div></div>` : ""}
    <div class="segc" data-sc><button data-v="1" class="on">${lb[0]}</button><button data-v="0">${lb[1]}</button></div>
    <div class="cd setc" data-fx>${rows(true)}</div>
    <div class="cd setc"><div class="ttl">سابقه‌ی واکنش بازار</div><div class="sm lh mut" style="margin-top:6px">${esc(c.h)}</div></div>
    <div class="mut xs lh">جهت‌ها از رابطه‌ی معمول هر ارز با دارایی‌ها و اندازه‌ها از رفتار معمول ساعت اول بعد از خبر برآورد شدن؛ پیش‌بینی قطعی نیستن.</div>`,
    mount: el => {
      el.querySelector("[data-sc]").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; NB.App.tap(); el.querySelectorAll("[data-sc] button").forEach(x => x.classList.toggle("on", x === b)); el.querySelector("[data-fx]").innerHTML = rows(b.dataset.v === "1"); });
      const mv = el.querySelector("[data-move]");
      if (mv) NB.loadMove(it.ts).then(r => {
        const m = r.v, names = { XAUUSD: "طلا", EURUSD: "یورو/دلار", WTI: "نفت", BTC: "بیت‌کوین" };
        const ks = Object.keys(names).filter(k => m.items && m.items[k]);
        mv.innerHTML = `<div class="ttl">حرکت واقعی بازار بعد از خبر</div>` + (ks.length ? ks.map(k => `<div class="sigr"><span>${names[k]}</span><span class="row" style="gap:6px"><span class="mut xs">۳۰ دقیقه</span>${dl(m.items[k].m30)}<span class="mut xs">۶۰ دقیقه</span>${dl(m.items[k].m60)}</span></div>`).join("") : '<div class="mut sm">داده‌ی قیمت برای این زمان نیست.</div>');
      }).catch(() => { mv.innerHTML = '<div class="ttl">حرکت واقعی بازار بعد از خبر</div><div class="mut sm">در دسترس نیست.</div>'; });
    } };
};

/* ---------------- RSI coin ---------------- */
SH.rsiCoin = function (sym) {
  const s = S(), d = s.rsiData, c = d && d.coins.find(x => x.sym === sym);
  if (!c) return { html: '<div class="mut">این ارز در نتیجه‌ی اسکن نیست.</div>' };
  const a = c[s.rsiMode], T = NB.TFS[s.rsiTf], SC = NB.SC;
  const fl = SC.sf(c), flTxt = fl == null ? "—" : fl >= 25 ? "ورود پول" : fl <= -25 ? "خروج پول" : "خنثی";
  return { html: `<div class="row sp"><span class="cap">${esc((c.en || "").toUpperCase())} · ${esc(sym)} · ${esc(c.ex)}</span>${s.mk && s.mk.find(x => x.s === sym) ? `<button class="ib sm" data-go="c:${esc(c.id)}">${I.chart}</button>` : ""}</div>
    <div class="big" style="font-size:24px;margin:6px 0 0">${esc(c.name)}</div>
    ${huge(c.price, cdec(c.price), "دلار")}
    <div class="row">${dl(c.ch)}<span class="mut sm">رتبه‌ی ${faN(c.rank || 0)} · ${T.label} · ${s.rsiMode === "L" ? "کندل جاری" : "کندل بسته‌شده"}</span></div>
    <div class="mini3" style="margin-top:14px"><div><small>RSI</small><b>${a.r == null ? "—" : faN(a.r, 1)}</b><i class="mut">${a.rp != null ? "قبلی " + faN(a.rp, 1) : ""}</i></div>
      <div><small>MACD</small><b>${a.x == null ? "—" : a.x >= 0 ? "تقاطع ↑" : "بدون تقاطع"}</b><i class="mut">${a.x >= 0 ? (a.x ? faN(a.x) + " کندل پیش" : "کندل جاری") : "زیر صفر"}</i></div>
      <div><small>پول هوشمند</small><b class="${fl >= 25 ? "tx-up" : fl <= -25 ? "tx-dn" : ""}">${fl == null ? "—" : (fl > 0 ? "+" : "") + faN(fl)}</b><i class="mut">${flTxt}</i></div></div>
    ${chartBox(NB.area(c.sp, 320, 120, { padX: 4, padT: 8, padB: 6, op: .12, end: true }), "۳۰ کندل اخیر", T.label)}
    <div class="cd setc"><div class="ttl">${I.chart}تحلیل بنیادی</div><div data-det><p class="mut sm">در حال دریافت اطلاعات از CoinGecko و GitHub…</p></div></div>
    <div class="cd setc">${SC.flowHTML(a)}<div data-fut>${SC.futHTML(undefined)}</div><div data-hl>${SC.hlHTML(c, null)}</div></div>
    ${SC.linksHTML(c)}`,
    mount: el => {
      const put = (sel, h) => { const x = el.querySelector(sel); if (x) x.innerHTML = h; };
      SC.loadDetail(c.id).then(d => put("[data-det]", SC.detailHTML(d, c, a)))
        .catch(e => put("[data-det]", `<p class="mut sm">${/429/.test(String(e && e.message)) ? "CoinGecko موقتاً محدودیت گذاشته؛ یه دقیقه صبر کن و دوباره باز کن." : "اطلاعات دریافت نشد؛ کارت رو ببند و دوباره باز کن."}</p>`));
      SC.loadFutures(sym).then(d => put("[data-fut]", SC.futHTML(d)), () => put("[data-fut]", SC.futHTML(null)));
      SC.loadHlm().then(r => put("[data-hl]", SC.hlHTML(c, r.v && r.v[sym])), () => put("[data-hl]", SC.hlHTML(c, null)));
    } };
};

/* ---------------- whales ---------------- */
SH.wallet = function (addr) {
  const s = S(), w = (s.hl || []).find(x => x.a === addr);
  if (!w) return { html: '<div class="mut">این کیف‌پول پیدا نشد.</div>' };
  const tot = w.pos.reduce((t, p) => t + p.val, 0);
  return { html: `<div class="cap ltr">${esc(w.a.slice(0, 10))}…${esc(w.a.slice(-6))}</div><div class="big ltr" style="font-size:24px;text-align:right">${esc(w.n || "کیف‌پول نهنگ")}</div>
    <div class="mini3" style="margin-top:12px"><div><small>ارزش حساب</small><b>${usdM(w.v)}</b></div><div><small>سود ۳۰ روز</small><b class="${w.p >= 0 ? "tx-up" : "tx-dn"}">${w.p ? usdM(w.p) : "—"}</b></div><div><small>حجم موقعیت‌ها</small><b>${usdM(tot)}</b></div></div>
    <div class="cd tight">${w.pos.map(p => `<div class="kv"><div class="lo xs2">${NB.logo(p.c)}</div><div><b class="ltr" style="text-align:right;display:block">${esc(p.c)}</b><small>${p.L ? "خرید (لانگ)" : "فروش (شورت)"}${p.lev ? " · اهرم ×" + faN(p.lev) : ""}</small></div><div class="v"><b>${usdM(p.val)}</b><div class="dlw"><span class="dl ${p.pnl >= 0 ? "up" : "dn"}">${p.pnl >= 0 ? "+" : "−"}${usdM(Math.abs(p.pnl))}</span></div></div></div>`).join("") || '<div class="mut sm">موقعیت بازی نداره.</div>'}</div>
    <button class="btn" data-ext="https://app.hyperliquid.xyz/explorer/address/${esc(w.a)}" style="margin-top:12px">${I.ext}دیدن در هایپرلیکوید</button>` };
};
SH.whaleCoin = function (coin) {
  const s = S(), rows = (s.hl || []).slice(0, 10).map(w => ({ w, p: (w.pos || []).find(q => q.c === coin) })).filter(x => x.p).sort((a, b) => b.p.val - a.p.val);
  const a = NB.hlAgg(s.hl, 10).find(x => x.c === coin);
  return { html: `<div class="cap">نهنگ‌های هایپرلیکوید · ${esc(coin)}</div><div class="big" style="font-size:24px">${a ? (a.l >= a.s ? "بیشتر خریدارن" : "بیشتر فروشنده‌ان") : esc(coin)}</div>
    ${a ? `<div class="mut sm">${usdS(a.l + a.s)} موقعیت باز از ${faN(a.n)} کیف‌پول</div>` : ""}
    <div class="cd tight" style="margin-top:12px">${rows.map(x => `<button class="kv" data-go="w:${esc(x.w.a)}"><div class="lo xs2 ${x.p.L ? "tx-up" : "tx-dn"}">${x.p.L ? "▲" : "▼"}</div><div><b class="addr">${esc(x.w.n || x.w.a.slice(0, 6) + "…" + x.w.a.slice(-4))}</b><small>${x.p.L ? "خرید" : "فروش"}${x.p.lev ? " · اهرم ×" + faN(x.p.lev) : ""}</small></div><div class="v"><b>${usdM(x.p.val)}</b></div></button>`).join("")}</div>` };
};
SH.hlAll = function () {
  const s = S(), age = NB.hlWalletsAge();
  return { html: `<div class="cap">هایپرلیکوید</div><div class="big" style="font-size:24px">کیف‌پول‌های پرسود</div>
    <div class="mut sm lh">${faN((s.hl || []).length)} کیف‌پول از ${age ? "فهرست " + ago(age) : "فهرست پیش‌فرض"}. موقعیت‌ها ${ago(s.t.hl)} به‌روز شدن.</div>
    <div class="cd tight" style="margin-top:12px">${(s.hl || []).map((w, i) => `<button class="kv" data-go="w:${esc(w.a)}"><div class="lo xs2">${faN(i + 1)}</div><div><b class="addr">${esc(w.n || w.a.slice(0, 6) + "…" + w.a.slice(-4))}</b><small>${w.pos.length ? w.pos.slice(0, 3).map(p => p.c + (p.L ? " ▲" : " ▼")).join(" · ") : "بدون موقعیت"}</small></div><div class="v"><b>${usdM(w.v)}</b></div></button>`).join("")}</div>
    <button class="btn ghost" data-act="hlrefresh" style="margin-top:12px">${I.refresh}به‌روزرسانی فهرست (حدود ۳۹ مگابایت)</button>` };
};
})();
