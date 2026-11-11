/* Nabz Bazar — app controller: state, tabs, sheets, theme, refresh scheduling, gestures */
"use strict";
(function () {
const { faN, I } = NB;
const $ = (s, r) => (r || document).querySelector(s);
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
const S = NB.S = {
  tab: "home", dark: false, filter: "all", stars: [], t: {}, stale: {}, err: {}, loading: {},
  mk: null, gl: null, fx: {}, fng: null, btc30: null, ir: null, irh: {}, usdt: {}, fut: null, fut24: null, perps: null, ls: {}, oi: {}, stable: null, chains: null, hl: null,
  cal: null, calNews: [], calImp: "High", calCur: "all", calDay: null, moves: {}, usdtEx: "nobitex",
  rsiTf: "1d", rsiThr: 30, rsiMode: "L", rsiTab: "rsi", rsiFlow: "in", rsiQ: "", rsiData: null, rsiBusy: false, rsiShow: 40
};
try { S.stars = JSON.parse(ls("stars") || "[]") || []; } catch (e) { S.stars = []; }
["rsiTf", "rsiMode", "rsiTab", "calImp", "filter", "usdtEx"].forEach(k => { const v = ls("p:" + k); if (v) S[k] = v; });
if (!["nobitex", "wallex", "tabdeal"].includes(S.usdtEx)) S.usdtEx = "nobitex";
{ const t = +ls("p:rsiThr"); if (t >= 15 && t <= 40) S.rsiThr = t; }
const save = k => ls("p:" + k, String(S[k]));
const App = NB.App = {};
const TABS = ["home", "iran", "smart", "news", "rsi"];
const entered = {};

/* ---------------- helpers ---------------- */
App.latin = s => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫,]/g, ".").replace(/٬/g, "");
App.tap = (k = 0) => { if (NB.native) try { NBN.haptic(k); } catch (e) { } };
let toastT;
App.toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2200); };

/* ---------------- theme ---------------- */
const mq = window.matchMedia("(prefers-color-scheme: dark)");
const wantDark = () => { const m = ls("set:theme") || "auto"; return m === "dark" || (m === "auto" && mq.matches); };
function setDark(d) {
  S.dark = d; document.documentElement.classList.toggle("dark", d); document.documentElement.classList.toggle("light", !d);
  if (NB.native) try { NBN.bars(d); } catch (e) { }
}
App.applyTheme = function (animate, fromEl) {
  const d = wantDark(); if (d === S.dark) return;
  const swap = () => { setDark(d); renderAll(); };
  if (!animate || !document.startViewTransition) { swap(); return; }
  const r = fromEl ? fromEl.getBoundingClientRect() : { left: 40, top: 80, width: 0, height: 0 };
  const x = r.left + r.width / 2, y = r.top + r.height / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(swap);
  vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 650, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" })).catch(() => { });
};
mq.addEventListener && mq.addEventListener("change", () => App.applyTheme(false));

/* ---------------- rendering ---------------- */
const lastV = {};
function rollNumbers(root, first) {
  root.querySelectorAll(".n[data-v]").forEach(el => {
    const v = +el.dataset.v, d = +el.dataset.d || 0, k = el.dataset.k;
    let from = null;
    if (k && lastV[k] != null && lastV[k] !== v) from = lastV[k];
    else if (first) from = v * (v > 200 ? .985 : 0);
    if (k) lastV[k] = v;
    if (from == null || !isFinite(from)) return;
    if (k && lastV[k] != null && from !== v && !first) el.classList.add(v > from ? "fup" : "fdn");
    const t0 = performance.now(), dur = first ? 900 : 650;
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = faN(from + (v - from) * e, d); if (p < 1) requestAnimationFrame(step); else { el.textContent = faN(v, d); setTimeout(() => el.classList.remove("fup", "fdn"), 600); } };
    requestAnimationFrame(step);
  });
}
function render(tab) {
  const scr = $(`.scr[data-s="${tab}"]`); if (!scr) return;
  const inner = scr.querySelector(".inner");
  NB.UI.reset();
  const first = !entered[tab] && tab === S.tab;
  inner.innerHTML = NB.UI[tab]();
  if (first) { entered[tab] = 1; scr.classList.add("enter"); setTimeout(() => scr.classList.remove("enter"), 1400); }
  rollNumbers(inner, first);
}
function renderAll() { TABS.forEach(t => { if (t === S.tab || entered[t]) render(t); }); }
App.render = render;
let rq = {};
function soon(tab) { if (rq[tab]) return; rq[tab] = requestAnimationFrame(() => { rq[tab] = 0; if (tab === S.tab || entered[tab]) render(tab); }); pushWidgetSoon(); }

/* ---------------- home-screen widget: a small snapshot of what the app knows ---------------- */
App.WPAGES = [["usdt", "تتر"], ["usd", "دلار و طلا"], ["smart", "پول هوشمند"], ["crypto", "کریپتو و ترس و طمع"], ["news", "خبر بعدی"], ["rsi", "اسکنر RSI"]];
App.wpages = () => { let p = null; try { p = JSON.parse(ls("set:wpages") || "null"); } catch (e) { } return Array.isArray(p) && p.length ? p : App.WPAGES.map(x => x[0]); };
let wT = 0;
function pushWidgetSoon() { if (!NB.native) return; clearTimeout(wT); wT = setTimeout(pushWidget, 3000); }
function pushWidget() {
  try {
    const now = Date.now(), w = { pages: App.wpages(), v: 1 };
    if (S.usdt && Object.keys(S.usdt).length) { const ex = {}; Object.keys(S.usdt).forEach(k => { const x = S.usdt[k]; ex[k] = { p: x.p, buy: x.buy, sell: x.sell, ch: x.ch, t: x.t }; }); w.usdt = { sel: S.usdtEx, ex, t: now }; }
    if (S.ir) w.ir = { usd: S.ir.usd, ch: (S.ir.chg || {}).usd, g18: S.ir.gold_18k, emami: S.ir.coin_emami, hist: ((S.irh && S.irh.usd) || []).slice(-30).map(x => x[1]), t: S.ir._ts || S.t.ir || now };
    const mk = S.mk || [], f = s => { const c = mk.find(x => x.s === s); return c ? { p: c.p, ch: c.ch } : undefined; };
    if (mk.length) w.cr = { btc: f("BTC"), eth: f("ETH"), sol: f("SOL"), fng: S.fng ? S.fng[0] : undefined, t: S.t.mk || now };
    const sm = NB.UI.smartSummary && NB.UI.smartSummary(); if (sm) w.sm = Object.assign(sm, { t: S.t.smart || now });
    if (S.cal) { const up = S.cal.filter(i => i.ts > now && ["USD", "EUR", "GBP"].includes(i.cur)).sort((a, b) => (b.impact === "High") - (a.impact === "High") || a.ts - b.ts);
      const hi = up.filter(i => i.impact === "High").sort((a, b) => a.ts - b.ts), list = (hi.length ? hi : up).slice(0, 6);
      w.nw = { list: list.map(i => ({ title: i.c.fa || i.title, cur: i.cur, ts: i.ts, when: NB.dayFa(i.ts) + " · ساعت " + NB.timeFa(i.ts), fc: i.fc, pv: i.pv, high: i.impact === "High" })) }; }
    if (S.rsiData && !S.rsiData.partial) { const L = NB.UI.rsiLists(), k = S.rsiMode;
      w.rsi = { tf: NB.TFS[S.rsiTf].label, thr: S.rsiThr, n: L.rsiL.length, new: L.nNew, top: L.rsiL.slice().sort((a, b) => a[k].r - b[k].r).slice(0, 3).map(c => [c.name, Math.round(c[k].r * 10) / 10]), in: L.flowIn.length, out: L.flowOut.length, t: S.rsiData.ts }; }
    NBN.widget(JSON.stringify(w));
  } catch (e) { console.error(e); }
}
App.pushWidget = pushWidget;

/* ---------------- tabs ---------------- */
function tabBar() {
  $(".tab").innerHTML = [["home", "نبض", I.pulse], ["iran", "داخلی", I.coins], ["smart", "پول هوشمند", I.whale], ["news", "واکنش بازار", I.cal], ["rsi", "اسکنر", I.gauge]]
    .map(t => `<button class="tb${S.tab === t[0] ? " on" : ""}" data-tab="${t[0]}" aria-label="${t[1]}">${t[2]}<span>${t[1]}</span></button>`).join("");
}
App.show = function (tab, keepScroll) {
  if (!TABS.includes(tab)) return;
  const same = tab === S.tab;
  if (same) { const c = $(`.scr[data-s="${tab}"] .cnt`); if (c && !keepScroll) c.scrollTo({ top: 0, behavior: "smooth" }); return; }
  S.tab = tab; ls("p:tab", tab);
  document.querySelectorAll(".scr").forEach(s => s.classList.toggle("on", s.dataset.s === tab));
  document.querySelectorAll(".tb").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  if (!entered[tab]) render(tab);
  load(tab);
};

/* ---------------- sheets ---------------- */
const stack = [];
App.sheet = function (spec) {
  if (!spec) return;
  const host = $("#sheets");
  const dim = document.createElement("div"); dim.className = "dim";
  const el = document.createElement("div"); el.className = "sheet" + (spec.full ? " full" : "");
  el.innerHTML = `<div class="grab"></div><div class="sbody">${spec.html}</div>`;
  host.appendChild(dim); host.appendChild(el);
  rollNumbers(el, true);
  requestAnimationFrame(() => requestAnimationFrame(() => { dim.classList.add("on"); el.classList.add("on"); }));
  dim.addEventListener("click", () => App.closeSheet());
  stack.push({ el, dim, spec });
  dragToClose(el);
  if (spec.mount) try { spec.mount(el); } catch (e) { console.error(e); }
  App.tap(1);
  return el;
};
/* app-styled picker (replaces Android's native select dialog): a sheet with a list, a tick and, for long lists, a search field */
App.picker = function (o) {
  const opts = o.options || [], many = opts.length > 10;
  const row = x => `<button class="prow${x.v === o.value ? " on" : ""}" data-pv="${NB.esc(x.v)}"><div class="lo xs2">${x.icon || NB.txt(String(x.label).slice(0, 1))}</div><div class="nm"><b>${NB.esc(x.label)}</b>${x.sub ? `<small>${NB.esc(x.sub)}</small>` : ""}</div><span class="tick">${x.v === o.value ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ""}</span></button>`;
  const group = list => { let h = "", g = null; list.forEach(x => { if (x.group && x.group !== g) { g = x.group; h += `<div class="pgrp">${NB.esc(g)}</div>`; } h += row(x); }); return h; };
  return App.sheet({ html: `<div class="cap">${NB.esc(o.cap || "انتخاب کن")}</div><div class="big" style="font-size:24px;margin:6px 0 12px">${NB.esc(o.title || "")}</div>
      ${many ? '<input class="search big" id="pq" type="search" placeholder="جستجو…" autocomplete="off">' : ""}<div class="plist">${group(opts)}</div>`,
    mount: el => {
      const list = el.querySelector(".plist"), q = el.querySelector("#pq");
      if (q) q.addEventListener("input", () => { const v = App.latin(q.value.trim().toLowerCase()); list.innerHTML = group(v ? opts.filter(x => (x.label + " " + (x.sub || "") + " " + x.v).toLowerCase().includes(v)) : opts) || '<div class="mut sm" style="padding:20px;text-align:center">پیدا نشد</div>'; });
      list.addEventListener("click", e => { const b = e.target.closest("[data-pv]"); if (!b) return; App.tap(1); const v = b.dataset.pv; App.closeSheet(); setTimeout(() => o.onPick && o.onPick(v, opts.find(x => x.v === v)), 120); });
    } });
};
App.closeSheet = function (instant) {
  const top = stack.pop(); if (!top) return false;
  top.el.classList.remove("on"); top.el.style.transform = ""; top.dim.classList.remove("on");
  const rm = () => { top.el.remove(); top.dim.remove(); };
  if (instant) rm(); else setTimeout(rm, 420);
  return true;
};
function dragToClose(el) {
  const body = el.querySelector(".sbody");
  let y0 = null, dy = 0, t0 = 0, active = false;
  el.addEventListener("touchstart", e => {
    if (e.target.closest("input,select,textarea,.segc,.chartw")) return;
    const onGrab = e.target.closest(".grab");
    if (!onGrab && body.scrollTop > 0) return;
    y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); active = false;
  }, { passive: true });
  el.addEventListener("touchmove", e => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 6) { active = true; el.classList.add("drag"); el.style.transform = `translateY(${dy}px)`; e.preventDefault(); }
    else if (dy < -6 && !active) y0 = null;
  }, { passive: false });
  el.addEventListener("touchend", () => {
    if (y0 == null) return;
    el.classList.remove("drag");
    const v = dy / Math.max(1, Date.now() - t0);
    if (active && (dy > 120 || v > .6)) App.closeSheet(); else el.style.transform = "";
    y0 = null; active = false;
  });
}
App.open = function (key) {
  const [k, ...rest] = key.split(":"), id = rest.join(":");
  const SH = NB.SH;
  const spec = k === "c" ? SH.crypto(id) : k === "f" ? SH.fx(id) : k === "i" ? SH.iran(id) : k === "e" ? SH.event(id) : k === "r" ? SH.rsiCoin(id)
    : k === "w" ? (id.startsWith("coin:") ? SH.whaleCoin(id.slice(5)) : SH.wallet(id)) : null;
  if (k === "i" && !(S.irh && S.irh.usd)) { }
  App.sheet(spec);
};
App.go = function (k) {
  if (k.startsWith("tab:")) { App.show(k.slice(4)); return; }
  if (k.startsWith("act:")) { act(k.slice(4)); return; }
  App.open(k);
};
window.NBback = function () { if (stack.length) { App.closeSheet(); return true; } if (S.tab !== "home") { App.show("home"); return true; } return false; };

/* ---------------- actions ---------------- */
function act(a, el) {
  App.tap();
  switch (a) {
    case "theme": { const d = !S.dark; ls("set:theme", d ? "dark" : "light"); App.applyTheme(true, el); break; }
    case "search": App.sheet(NB.SH.search()); break;
    case "settings": App.sheet(NB.SH.settings()); break;
    case "convert": App.sheet(NB.SH.convert()); break;
    case "goldcalc": App.sheet(NB.SH.goldcalc()); break;
    case "refresh": App.refresh(true); App.toast("در حال به‌روزرسانی…"); break;
    case "rscan": rsiScan(false); break;
    case "rmore": S.rsiShow += 40; render("rsi"); break;
    case "hlall": App.sheet(NB.SH.hlAll()); break;
    case "hlrefresh": refreshWhales(true); break;
    case "whrefresh": loadWhales(true); render("rsi"); break;
    case "clearcache": try { const keep = {}; Object.keys(localStorage).forEach(k => { if (/^(set:|p:|stars|cv:)/.test(k)) keep[k] = localStorage.getItem(k); }); localStorage.clear(); Object.keys(keep).forEach(k => localStorage.setItem(k, keep[k])); } catch (e) { } App.toast("حافظه پاک شد"); App.closeSheet(); App.refresh(true); break;
  }
}
document.addEventListener("click", e => {
  const t = e.target;
  const ext = t.closest("[data-ext]"); if (ext) { e.preventDefault(); App.tap(); if (NB.native) NBN.open(ext.dataset.ext); else window.open(ext.dataset.ext, "_blank"); return; }
  const st = t.closest("[data-star]");
  if (st) { const id = st.dataset.star, i = S.stars.indexOf(id); if (i >= 0) S.stars.splice(i, 1); else S.stars.push(id); ls("stars", JSON.stringify(S.stars)); st.classList.toggle("on", i < 0); st.innerHTML = i < 0 ? I.starF : I.star; App.tap(1); App.toast(i < 0 ? "به ستاره‌دارها اضافه شد" : "از ستاره‌دارها برداشته شد"); renderAll(); return; }
  const go = t.closest("[data-go]"); if (go && go.closest(".sheet") && !go.closest("#sr")) { App.closeSheet(true); App.go(go.dataset.go); return; }
  const op = t.closest("[data-open]"); if (op) { App.tap(); App.open(op.dataset.open); return; }
  const tb = t.closest("[data-tab]"); if (tb) { App.tap(2); App.show(tb.dataset.tab); return; }
  const a = t.closest("[data-act]"); if (a) { act(a.dataset.act, a); return; }
  const f = t.closest("[data-filter]"); if (f) { App.tap(2); S.filter = f.dataset.filter; save("filter"); render("home"); return; }
  const day = t.closest("[data-day]"); if (day) { App.tap(2); S.calDay = day.dataset.day; render("news"); loadMoves(); return; }
  const ex = t.closest("[data-ex]"); if (ex) { App.tap(2); S.usdtEx = ex.dataset.ex; save("usdtEx"); render("iran"); NB.loadUsdt(v => { S.usdt = v; soon("iran"); }, S.usdtEx).then(v => { S.usdt = v; S.lastUsdt = Date.now(); soon("iran"); }); return; }
  const imp = t.closest("[data-imp]"); if (imp) { App.tap(2); S.calImp = imp.dataset.imp; save("calImp"); render("news"); loadMoves(); return; }
  const cur = t.closest("[data-cur]"); if (cur) { App.tap(2); S.calCur = cur.dataset.cur; render("news"); return; }
  const tf = t.closest("[data-tf]"); if (tf) { App.tap(2); S.rsiTf = tf.dataset.tf; save("rsiTf"); S.rsiShow = 40; loadRsiCache(); render("rsi"); rsiScan(false); return; }
  const md = t.closest("[data-mode]"); if (md) { App.tap(2); S.rsiMode = md.dataset.mode; save("rsiMode"); render("rsi"); return; }
  const rt = t.closest("[data-rtab]"); if (rt) { App.tap(2); S.rsiTab = rt.dataset.rtab; save("rsiTab"); S.rsiShow = 40; render("rsi"); return; }
  const fw = t.closest("[data-flow]"); if (fw) { App.tap(2); S.rsiFlow = fw.dataset.flow; render("rsi"); return; }
});
document.addEventListener("input", e => {
  if (e.target.id === "thr") { S.rsiThr = +e.target.value; e.target.style.setProperty("--p", ((S.rsiThr - 15) / 25 * 100).toFixed(1) + "%"); const v = $("#thrv"); if (v) v.textContent = faN(S.rsiThr); clearTimeout(App._thr); App._thr = setTimeout(() => { save("rsiThr"); render("rsi"); }, 220); App.tap(2); }
  if (e.target.id === "rq") { S.rsiQ = App.latin(e.target.value); clearTimeout(App._rq); App._rq = setTimeout(() => { const pos = e.target.selectionStart; render("rsi"); const q = $("#rq"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (er) { } } }, 280); }
});

/* ---------------- data loading per tab ---------------- */
const mark = (k, r) => { if (!r) return; S.t[k] = r.t; S.stale[k] = !!r.stale; S.err[k] = false; };
const fail = (k, tab) => () => { S.err[k] = true; soon(tab); };
function peekAll() {
  const p = (k, big) => { const c = NB.peek(k, big); return c; };
  let c;
  if ((c = p("mk"))) { S.mk = c.v; S.t.mk = c.t; }
  if ((c = p("gl"))) S.gl = c.v;
  if ((c = p("fx"))) { S.fx = c.v; S.t.fx = c.t; }
  if ((c = p("fng"))) S.fng = c.v;
  if ((c = p("btc30"))) S.btc30 = c.v;
  if ((c = p("ir"))) { S.ir = c.v; S.t.ir = c.t; }
  if ((c = p("usdt"))) S.usdt = c.v;
  if ((c = p("irh_usd", true))) S.irh.usd = c.v;
  if ((c = p("fut"))) S.fut = c.v;
  if ((c = p("fut24"))) S.fut24 = c.v;
  if ((c = p("perps"))) S.perps = c.v;
  ["BTCUSDT", "ETHUSDT", "SOLUSDT"].forEach(y => { const a = p("ls_" + y), b = p("oi_" + y); if (a) S.ls[y] = a.v; if (b) S.oi[y] = b.v; });
  if ((c = p("stable"))) S.stable = c.v;
  if ((c = p("chains"))) S.chains = c.v;
  if ((c = p("hlpos"))) setHl({ v: c.v, t: c.t });
  if ((c = p("cal"))) { S.cal = NB.calMerge(NB.calNormalize(c.v.rows)); S.calNews = c.v.news || []; S.t.cal = c.t; }
  loadRsiCache();
}
function loadRsiCache() { const c = NB.rsiCached(S.rsiTf); S.rsiData = c ? c.v : null; buildRsiIndex(); }
function buildRsiIndex() { const d = NB.rsiCached("1d"); S.rsiAll = {}; if (d) d.v.coins.forEach(c => { if (c.L && c.L.r != null) S.rsiAll[c.sym] = c.L.r; }); }

function loadHome(force) {
  NB.loadMarkets(force).then(r => { S.mk = r.v; mark("mk", r); soon("home"); }, fail("mk", "home"));
  NB.loadFx(force).then(r => { S.fx = r.v; mark("fx", r); soon("home"); }, fail("fx", "home"));
  NB.loadGlobal().then(r => { S.gl = r.v; soon("home"); }, () => { });
  NB.loadFng().then(r => { S.fng = r.v; soon("home"); soon("smart"); }, () => { });
  NB.loadBtc30().then(r => { S.btc30 = r.v; soon("home"); }, () => { });
  NB.loadIran(force, irLate).then(r => { S.ir = r.v; mark("ir", r); soon("home"); soon("iran"); }, () => { });
}
/* real market move after each past event of the chosen day (from the worker's /move) */
function loadMoves() {
  if (!S.cal) return;
  const now = Date.now(), day = S.calDay || NB.dayKey(now);
  S.cal.filter(i => NB.dayKey(i.ts) === day && i.ts < now - 15 * 60000 && i.ts > now - 4 * 864e5 && (S.calImp === "all" || i.impact === "High"))
    .forEach(i => { S.movesP = S.movesP || {}; if (S.moves[i.ts] !== undefined || S.movesP[i.ts]) return; S.movesP[i.ts] = 1; NB.loadMove(i.ts).then(r => { S.moves[i.ts] = r.v; soon("news"); }, () => { S.moves[i.ts] = null; soon("news"); }); });
}
const irLate = r => { S.ir = r.v; S.t.ir = r.t; S.stale.ir = false; soon("iran"); soon("home"); };
function loadIran(force) {
  S.loading.usdt = true;
  NB.loadIran(force, irLate).then(r => { S.ir = r.v; mark("ir", r); soon("iran"); soon("home"); }, fail("ir", "iran"));
  S.lastUsdt = Date.now();
  NB.loadUsdt(v => { S.usdt = v; soon("iran"); }).then(v => { S.usdt = v; S.loading.usdt = false; soon("iran"); });
  NB.loadIrHist("usd").then(r => { S.irh.usd = r.v; soon("iran"); }, () => { });
  if (!S.fx || !Object.keys(S.fx).length) NB.loadFx().then(r => { S.fx = r.v; }, () => { });
}
function loadSmart(force) {
  NB.loadFng().then(r => { S.fng = r.v; soon("smart"); }, () => { });
  const ok = () => { S.t.smart = Date.now(); S.err.fut = false; soon("smart"); };
  NB.loadFut(force).then(r => { S.fut = r.v; ok(); }, fail("fut", "smart"));
  NB.loadFut24(force).then(r => { S.fut24 = r.v; ok(); }, () => { });
  NB.loadCoinPerps().then(r => { S.perps = r.v; soon("smart"); }, () => { });
  ["BTCUSDT", "ETHUSDT", "SOLUSDT"].forEach(y => {
    NB.loadLS(y, force).then(r => { S.ls[y] = r.v; ok(); }, fail("fut", "smart"));
    NB.loadOI(y, force).then(r => { S.oi[y] = r.v; ok(); }, () => { });
  });
  NB.loadStable().then(r => { S.stable = r.v; soon("smart"); }, () => { });
  NB.loadChains().then(r => { S.chains = r.v; soon("smart"); }, () => { });
  loadWhales(force);
}
/* whale positions feed both the smart-money tab (top 10) and the scanner (all 40 + your own wallets) */
function setHl(r) { S.hl = r.v; S.t.hl = r.t; S.wh = Object.assign(NB.SC.aggregate(r.v), { loading: false }); }
App.setHl = setHl;
function loadWhales(force) {
  S.wh = Object.assign(S.wh || { agg: {}, n: 0 }, { loading: true });
  NB.loadHlPositions(force).then(r => { setHl(r); S.err.hl = false; soon("smart"); soon("rsi"); }, e => { S.wh.loading = false; fail("hl", "smart")(e); soon("rsi"); });
  /* the wallet list itself: once a day, on Wi-Fi by default */
  const mode = ls("set:hl") || "wifi", age = Date.now() - NB.hlWalletsAge();
  if (age > 24 * 3600e3 && (mode === "always" || (mode === "wifi" && NB.readNet().wifi))) refreshWhales(false);
}
let hlBusy = false;
function refreshWhales(manual) {
  if (hlBusy) return; hlBusy = true;
  if (manual) App.toast("در حال گرفتن فهرست نهنگ‌ها (حدود ۳۹ مگابایت)…");
  NB.refreshHlWallets().then(() => NB.loadHlPositions(true)).then(r => { setHl(r); soon("smart"); soon("rsi"); if (manual) App.toast("فهرست نهنگ‌ها به‌روز شد"); })
    .catch(() => { if (manual) App.toast("فهرست دریافت نشد؛ " + (NB.NET.vpn ? "اینترنت رو چک کن" : "هایپرلیکوید بدون فیلترشکن باز نمیشه")); })
    .finally(() => { hlBusy = false; });
}
/* this week + next week: Forex Factory (this/next), the friend's GitHub snapshot (it also carries next week), then official release dates */
function loadNews(force) {
  let base = null, next = [];
  const build = () => { if (!base) return; const rows = base.some(x => x.wk === "next") ? base : base.concat(next); S.cal = NB.calMerge(NB.calNormalize(rows)); soon("news"); loadMoves(); };
  NB.loadCalendar(force).then(r => {
    base = r.v.rows; S.calNews = r.v.news || S.calNews; mark("cal", r); build();
    NB.loadCalNext().then(n => { if (n.v && n.v.length) { next = n.v; build(); } }, () => { });
  }, fail("cal", "news"));
  NB.loadCalNews().then(r => { S.calNews = r.v.news.length ? r.v.news : S.calNews; if (!next.length && r.v.next.length) { next = r.v.next; build(); } else soon("news"); }, () => { });
}
function loadRsi(force) {
  loadRsiCache();
  const T = NB.TFS[S.rsiTf], d = S.rsiData;
  if (force || !d || Date.now() - d.ts > T.ttl) rsiScan(force);
  loadWhales(force);
}
function rsiScan(force) {
  if (S.rsiBusy) return;
  S.rsiBusy = true; S.rsiErr = ""; S.rsiProg = 0.02; S.rsiMsg = "شروع…"; soon("rsi");
  const tf = S.rsiTf;
  let lastR = 0;
  NB.rsiScan(tf, (p, m, part) => { S.rsiProg = p; S.rsiMsg = m; const now = Date.now();
    if (part && (!S.rsiData || S.rsiData.partial) && S.rsiTf === tf) { S.rsiData = part; soon("rsi"); return; } if (now - lastR > 500) { lastR = now; const pr = $(".scr[data-s=rsi] .prog i"); const ms = $(".scr[data-s=rsi] .ttl + .mut"); if (pr) pr.style.width = Math.round(p * 100) + "%"; if (ms) ms.textContent = m; } }, force)
    .then(out => { if (S.rsiTf === tf) S.rsiData = out; buildRsiIndex(); })
    .catch(e => { S.rsiErr = e && e.message === "NOEX" ? "به هیچ‌کدوم از صرافی‌ها وصل نشدم. اینترنت رو چک کن." : "اسکن کامل نشد؛ چند دقیقه بعد دوباره بزن."; })
    .finally(() => { S.rsiBusy = false; soon("rsi"); });
}
const LOADERS = { home: loadHome, iran: loadIran, smart: loadSmart, news: loadNews, rsi: loadRsi };
function load(tab, force) { try { LOADERS[tab](force); } catch (e) { console.error(e); } }
App.refresh = force => load(S.tab, force);

/* auto refresh: only the visible tab, only while the app is in front */
let visible = true;
const EVERY = { home: 40000, iran: 50000, smart: 120000, news: 10 * 60000, rsi: 0 };
setInterval(() => {
  if (!visible || stack.length > 1) return;
  const e = EVERY[S.tab]; if (e && Date.now() - (S.lastLoad || 0) > e) { S.lastLoad = Date.now(); load(S.tab); }
  /* tether moves fast: refresh the three exchanges every 15 s while the domestic tab is open */
  if (S.tab === "iran" && Date.now() - (S.lastUsdt || 0) > 15000) { S.lastUsdt = Date.now(); NB.loadUsdt().then(v => { S.usdt = v; soon("iran"); }); }
}, 5000);
/* keep the focused field above the keyboard */
document.addEventListener("focusin", e => { const el = e.target; if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return; setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (er) { } }, 350); });
window.NBkb = h => { document.documentElement.style.setProperty("--kb", h + "px"); document.documentElement.classList.toggle("kb", h > 0); const a = document.activeElement; if (h > 0 && a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) setTimeout(() => { try { a.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (er) { } }, 120); };
setInterval(() => { if (visible) TABS.forEach(t => { if (t === S.tab) { const el = document.querySelectorAll(`.scr[data-s="${t}"] .live`); el.forEach(x => { }); } }); }, 30000);
window.NBvis = v => { visible = v; if (v) { NB.readNet(); load(S.tab); } };
document.addEventListener("visibilitychange", () => { window.NBvis(document.visibilityState === "visible"); if (document.visibilityState !== "visible" && NB.native) pushWidget(); });
window.NBnet = n => { const was = NB.NET.vpn; Object.assign(NB.NET, n); if (n.online && was !== n.vpn) { App.toast(n.vpn ? "فیلترشکن روشن شد" : "فیلترشکن خاموش شد"); setTimeout(() => load(S.tab, true), 800); } };
window.NBinsets = (t, b) => { document.documentElement.style.setProperty("--sat", t + "px"); document.documentElement.style.setProperty("--sab", b + "px"); };

/* pull to refresh */
function pullToRefresh(cnt) {
  let y0 = null, dy = 0; const ind = cnt.parentNode.querySelector(".ptr");
  cnt.addEventListener("touchstart", e => { y0 = cnt.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
  cnt.addEventListener("touchmove", e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { const p = Math.min(1, dy / 90); ind.style.opacity = p; ind.style.transform = `translateY(${Math.min(70, dy * .5)}px) rotate(${dy * 3}deg)`; } }, { passive: true });
  cnt.addEventListener("touchend", () => { if (y0 == null) return; if (dy > 90) { App.tap(1); ind.classList.add("spin"); load(S.tab, true); setTimeout(() => { ind.classList.remove("spin"); ind.style.opacity = 0; ind.style.transform = ""; }, 900); } else { ind.style.opacity = 0; ind.style.transform = ""; } y0 = null; });
}

/* ---------------- boot ---------------- */
function boot() {
  NB.readNet();
  if (NB.native) { try { const [t, b] = NBN.insets().split(",").map(Number); window.NBinsets(t, b); } catch (e) { } }
  setDark(wantDark());
  const ui = $("#app");
  ui.innerHTML = TABS.map(t => `<section class="scr${t === S.tab ? " on" : ""}" data-s="${t}"><div class="ptr">${I.refresh}</div><div class="cnt"><div class="inner"></div></div></section>`).join("") +
    `<div class="sbar"></div><div class="fade"></div><nav class="tab"></nav><div id="sheets"></div><div id="toast"></div>`;
  tabBar();
  document.querySelectorAll(".cnt").forEach(pullToRefresh);
  peekAll();
  let start = ls("p:tab"); if (NB.native) { try { const wt = NBN.startTab(); if (wt) start = wt; } catch (e) { } }
  if (start && TABS.includes(start)) { S.tab = start; document.querySelectorAll(".scr").forEach(s => s.classList.toggle("on", s.dataset.s === S.tab)); tabBar(); }
  render(S.tab);
  S.lastLoad = Date.now();
  load(S.tab);
  /* warm the other tabs' caches a moment later, lightly */
  setTimeout(() => { if (S.tab !== "home") loadHome(); if (S.tab !== "iran") NB.loadIran().then(r => { S.ir = r.v; }, () => { }); }, 2500);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
