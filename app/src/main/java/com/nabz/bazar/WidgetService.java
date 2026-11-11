package com.nabz.bazar;

import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import static com.nabz.bazar.WidgetData.*;

/** Builds one card per page for the stack widget. */
public class WidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) { return new Factory(getApplicationContext(), "flip".equals(intent.getStringExtra("mode"))); }

    static final String[] ALL = { "usdt", "usd", "smart", "crypto", "news", "rsi" };
    static final String[][] EX = { { "nobitex", "نوبیتکس" }, { "wallex", "والکس" }, { "tabdeal", "تبدیل" } };

    static class Factory implements RemoteViewsFactory {
        final Context c;
        final boolean flip;
        JSONObject w = new JSONObject();
        final List<String> pages = new ArrayList<>();
        Factory(Context c, boolean flip) { this.c = c; this.flip = flip; }

        @Override public void onCreate() { }
        @Override public void onDestroy() { }
        @Override public int getCount() { return pages.size(); }
        @Override public RemoteViews getLoadingView() { return null; }
        @Override public int getViewTypeCount() { return 6; }
        @Override public long getItemId(int i) { return i; }
        @Override public boolean hasStableIds() { return true; }

        @Override
        public void onDataSetChanged() {
            w = load(c);
            pages.clear();
            JSONArray want = w.optJSONArray("pages");
            List<String> order = new ArrayList<>();
            if (want != null && want.length() > 0) for (int i = 0; i < want.length(); i++) order.add(want.optString(i)); else for (String s : ALL) order.add(s);
            for (String p : order) if (has(p)) pages.add(p);
        }

        boolean has(String p) {
            switch (p) {
                case "usdt": { JSONObject u = w.optJSONObject("usdt"); return u != null && u.optJSONObject("ex") != null && u.optJSONObject("ex").length() > 0; }
                case "usd": { JSONObject r = w.optJSONObject("ir"); return r != null && r.has("usd"); }
                case "smart": return w.optJSONObject("sm") != null;
                case "crypto": { JSONObject r = w.optJSONObject("cr"); return r != null && r.has("btc"); }
                case "news": return nextEvent() != null;
                case "rsi": return w.optJSONObject("rsi") != null;
            }
            return false;
        }

        JSONObject nextEvent() {
            JSONObject nw = w.optJSONObject("nw"); if (nw == null) return null;
            JSONArray l = nw.optJSONArray("list"); if (l == null) return null;
            long now = System.currentTimeMillis();
            for (int i = 0; i < l.length(); i++) { JSONObject e = l.optJSONObject(i); if (e != null && e.optLong("ts") > now) return e; }
            return null;
        }

        int col(int id) { return c.getColor(id); }
        void pill(RemoteViews v, int id, String text, String kind) {
            if (text == null || text.isEmpty()) { v.setViewVisibility(id, View.GONE); return; }
            v.setViewVisibility(id, View.VISIBLE);
            v.setTextViewText(id, text);
            v.setTextColor(id, col("up".equals(kind) ? R.color.w_up : "dn".equals(kind) ? R.color.w_dn : R.color.w_ink2));
            v.setInt(id, "setBackgroundResource", "up".equals(kind) ? R.drawable.w_pill_up : "dn".equals(kind) ? R.drawable.w_pill_dn : R.drawable.w_pill_fl);
        }
        static String dir(double ch) { return ch > 0.005 ? "up" : ch < -0.005 ? "dn" : "fl"; }
        int px(float dp) { return Math.round(dp * c.getResources().getDisplayMetrics().density); }

        @Override
        public RemoteViews getViewAt(int pos) {
            if (pos >= pages.size()) return null;
            String p = pages.get(pos);
            RemoteViews v;
            String tab;
            try {
                switch (p) {
                    case "usdt": v = usdt(); tab = "iran"; break;
                    case "usd": v = usd(); tab = "iran"; break;
                    case "smart": v = smart(); tab = "smart"; break;
                    case "crypto": v = crypto(); tab = "home"; break;
                    case "news": v = news(); tab = "news"; break;
                    default: v = rsi(); tab = "rsi"; break;
                }
            } catch (Exception e) {
                v = new RemoteViews(c.getPackageName(), R.layout.w_usdt); tab = "home";
            }
            v.setOnClickFillInIntent(R.id.w_page, new Intent().putExtra("tab", tab));
            /* the single-card widget has ⟳ ▲ ▼ in the top-left corner, so the header leaves room for them */
            if (flip) v.setViewPadding(R.id.hdr, px(100), 0, 0, 0);
            return v;
        }

        RemoteViews usdt() {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_usdt);
            JSONObject u = w.optJSONObject("usdt"), ex = u.optJSONObject("ex");
            String sel = u.optString("sel", "nobitex"); if (!ex.has(sel)) sel = ex.keys().next();
            String cheap = null; double best = Double.MAX_VALUE;
            for (String[] e : EX) { JSONObject x = ex.optJSONObject(e[0]); if (x == null) continue; double b = x.optDouble("buy", x.optDouble("p")); if (b < best) { best = b; cheap = e[0]; } }
            JSONObject s = ex.optJSONObject(sel); String selName = sel;
            for (String[] e : EX) if (e[0].equals(sel)) selName = e[1];
            v.setTextViewText(R.id.ht, "تتر · USDT");
            v.setTextViewText(R.id.ht_t, time(s.optLong("t", u.optLong("t"))));
            v.setTextViewText(R.id.big, n(s.optDouble("p"), 0));
            v.setTextViewText(R.id.unit, "تومان · " + selName);
            String sub = s.has("buy") ? "خرید " + n(s.optDouble("buy"), 0) + " · فروش " + n(s.optDouble("sell"), 0) : "";
            if (s.has("ch") && !Double.isNaN(s.optDouble("ch"))) sub += " · " + pct(s.optDouble("ch"));
            v.setTextViewText(R.id.sub, sub);
            int[] box = { R.id.ex1, R.id.ex2, R.id.ex3 }, nm = { R.id.exn1, R.id.exn2, R.id.exn3 }, pr = { R.id.exp1, R.id.exp2, R.id.exp3 }, bs = { R.id.exb1, R.id.exb2, R.id.exb3 };
            for (int i = 0; i < 3; i++) {
                JSONObject x = ex.optJSONObject(EX[i][0]); boolean on = EX[i][0].equals(sel);
                v.setTextViewText(nm[i], EX[i][1]);
                v.setTextViewText(pr[i], x == null ? "—" : n(x.optDouble("p"), 0));
                v.setInt(box[i], "setBackgroundResource", on ? R.drawable.w_chip_on : R.drawable.w_chip);
                v.setTextColor(nm[i], col(on ? R.color.w_btnink : R.color.w_ink2));
                v.setTextColor(pr[i], col(on ? R.color.w_btnink : R.color.w_ink));
                boolean ch = EX[i][0].equals(cheap) && ex.length() > 1;
                v.setViewVisibility(bs[i], ch ? View.VISIBLE : View.GONE);
                v.setTextViewText(bs[i], "ارزون‌ترین");
                v.setTextColor(bs[i], col(on ? R.color.w_btnink : R.color.w_up));
            }
            return v;
        }

        RemoteViews usd() {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_usd);
            JSONObject r = w.optJSONObject("ir");
            v.setTextViewText(R.id.ht, "دلار و طلا");
            v.setTextViewText(R.id.ht_t, time(r.optLong("t")));
            v.setTextViewText(R.id.big, n(r.optDouble("usd"), 0));
            v.setTextViewText(R.id.unit, "تومان");
            v.setTextViewText(R.id.sub, "دلار آمریکا");
            pill(v, R.id.chg, r.has("ch") ? pct(r.optDouble("ch")) : "", dir(r.optDouble("ch", 0)));
            v.setTextViewText(R.id.k1, "۱۸ عیار"); v.setTextViewText(R.id.v1, mil(r.optDouble("g18")));
            v.setTextViewText(R.id.k2, "سکه امامی"); v.setTextViewText(R.id.v2, mil(r.optDouble("emami")));
            JSONObject u = w.optJSONObject("usdt"); double tp = Double.NaN;
            if (u != null && u.optJSONObject("ex") != null) { JSONObject x = u.optJSONObject("ex").optJSONObject(u.optString("sel", "nobitex")); if (x != null) tp = x.optDouble("p"); }
            v.setTextViewText(R.id.k3, "تتر"); v.setTextViewText(R.id.v3, n(tp, 0));
            JSONArray h = r.optJSONArray("hist");
            if (h != null && h.length() > 2) {
                double[] pts = new double[h.length() + 1]; for (int i = 0; i < h.length(); i++) pts[i] = h.optDouble(i); pts[h.length()] = r.optDouble("usd");
                v.setImageViewBitmap(R.id.spark, spark(pts, px(300), px(44), col(R.color.w_ink)));
            }
            return v;
        }

        RemoteViews smart() {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_smart);
            JSONObject s = w.optJSONObject("sm");
            v.setTextViewText(R.id.ht, "پول هوشمند");
            v.setTextViewText(R.id.ht_t, time(s.optLong("t")));
            v.setTextViewText(R.id.head, s.optString("head", "—"));
            v.setImageViewBitmap(R.id.meter, meter(s.optDouble("score", 0), px(300), px(8), col(R.color.w_chip)));
            JSONArray ch = s.optJSONArray("chips"); int[] ids = { R.id.p1, R.id.p2, R.id.p3 };
            for (int i = 0; i < 3; i++) { JSONArray x = ch != null ? ch.optJSONArray(i) : null; pill(v, ids[i], x == null ? "" : x.optString(0), x == null ? "fl" : x.optString(1)); }
            return v;
        }

        RemoteViews crypto() {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_crypto);
            JSONObject r = w.optJSONObject("cr"), b = r.optJSONObject("btc");
            v.setTextViewText(R.id.ht, "کریپتو");
            v.setTextViewText(R.id.ht_t, time(r.optLong("t")));
            v.setTextViewText(R.id.big, n(b.optDouble("p"), 0));
            v.setTextViewText(R.id.unit, "دلار");
            v.setTextViewText(R.id.sub, "بیت‌کوین");
            pill(v, R.id.chg, pct(b.optDouble("ch")), dir(b.optDouble("ch", 0)));
            String[][] rows = { { "eth", "اتریوم" }, { "sol", "سولانا" } }; int[] k = { R.id.k1, R.id.k2 }, val = { R.id.v1, R.id.v2 };
            for (int i = 0; i < 2; i++) { JSONObject x = r.optJSONObject(rows[i][0]); v.setTextViewText(k[i], rows[i][1]);
                v.setTextViewText(val[i], x == null ? "—" : n(x.optDouble("p"), x.optDouble("p") >= 100 ? 0 : 2) + "  " + pct(x.optDouble("ch")));
                if (x != null) v.setTextColor(val[i], col("up".equals(dir(x.optDouble("ch"))) ? R.color.w_up : "dn".equals(dir(x.optDouble("ch"))) ? R.color.w_dn : R.color.w_ink)); }
            if (r.has("fng")) {
                int f = r.optInt("fng");
                v.setImageViewBitmap(R.id.gauge, gauge(f, px(112), px(64), col(R.color.w_bg) | 0xFF000000));
                v.setTextViewText(R.id.glab, "ترس و طمع · " + fgWord(f));
                v.setTextColor(R.id.glab, fgColor(f));
            } else { v.setViewVisibility(R.id.gauge, View.GONE); v.setTextViewText(R.id.glab, ""); }
            return v;
        }

        RemoteViews news() {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_news);
            JSONObject e = nextEvent();
            v.setTextViewText(R.id.ht, "خبر بعدی");
            v.setTextViewText(R.id.ht_t, "به وقت تهران");
            v.setTextViewText(R.id.title, e.optString("cur") + " · " + e.optString("title"));
            v.setTextViewText(R.id.sub, e.optString("when") + (e.optBoolean("high") ? " · ●●● پرتأثیر" : ""));
            long m = Math.max(0, (e.optLong("ts") - System.currentTimeMillis()) / 60000);
            String[][] box = { { n(m / 1440, 0), "روز" }, { n(m % 1440 / 60, 0), "ساعت" }, { n(m % 60, 0), "دقیقه" }, { digits(e.optString("fc", "—")), "پیش‌بینی" }, { digits(e.optString("pv", "—")), "قبلی" } };
            int[] cv = { R.id.cv1, R.id.cv2, R.id.cv3, R.id.cv4, R.id.cv5 }, cl = { R.id.cl1, R.id.cl2, R.id.cl3, R.id.cl4, R.id.cl5 };
            for (int i = 0; i < 5; i++) { v.setTextViewText(cv[i], box[i][0].isEmpty() ? "—" : box[i][0]); v.setTextViewText(cl[i], box[i][1]); }
            if (m < 1440) v.setViewVisibility(R.id.cb1, View.GONE);
            return v;
        }

        RemoteViews rsi() {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.w_rsi);
            JSONObject r = w.optJSONObject("rsi");
            v.setTextViewText(R.id.ht, "اسکنر RSI · " + r.optString("tf"));
            v.setTextViewText(R.id.ht_t, time(r.optLong("t")));
            v.setTextViewText(R.id.big, n(r.optInt("n"), 0));
            v.setTextViewText(R.id.unit, "ارز زیر RSI " + n(r.optInt("thr", 30), 0));
            v.setTextViewText(R.id.sub, r.optInt("new") > 0 ? n(r.optInt("new"), 0) + " تا تازه وارد اشباع فروش شدن" : "یعنی قیمتشون زیاد ریخته");
            JSONArray top = r.optJSONArray("top"); int[] k = { R.id.k1, R.id.k2, R.id.k3 }, val = { R.id.v1, R.id.v2, R.id.v3 };
            for (int i = 0; i < 3; i++) { JSONArray x = top != null ? top.optJSONArray(i) : null; v.setTextViewText(k[i], x == null ? "" : x.optString(0)); v.setTextViewText(val[i], x == null ? "" : n(x.optDouble(1), 1)); }
            pill(v, R.id.p1, "ورود پول · " + n(r.optInt("in"), 0) + " ارز", "up");
            pill(v, R.id.p2, "خروج پول · " + n(r.optInt("out"), 0) + " ارز", "dn");
            return v;
        }

    }
}
