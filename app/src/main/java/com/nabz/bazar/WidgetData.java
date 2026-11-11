package com.nabz.bazar;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

/** Widget data: the app writes a full snapshot (w.json); in the background only the light prices are refreshed here. */
public final class WidgetData {
    private WidgetData() { }
    static final Object LOCK = new Object();
    static final Locale FA = new Locale("fa", "IR");

    /* ---------------- storage ---------------- */
    static File file(Context c) { return new File(c.getFilesDir(), "w.json"); }

    static JSONObject load(Context c) {
        synchronized (LOCK) {
            try (FileInputStream in = new FileInputStream(file(c))) { return new JSONObject(read(in)); } catch (Exception e) { return new JSONObject(); }
        }
    }

    static void save(Context c, String json) {
        synchronized (LOCK) {
            try (FileOutputStream fo = new FileOutputStream(file(c))) { fo.write(json.getBytes(StandardCharsets.UTF_8)); } catch (Exception ignored) { }
        }
    }

    /* ---------------- background refresh: tether, tgju, three coins, fear & greed (a few KB in all) ---------------- */
    static void fetch(Context c) {
        JSONObject w = load(c);
        long now = System.currentTimeMillis();
        try {
            JSONObject u = w.optJSONObject("usdt"); if (u == null) { u = new JSONObject(); w.put("usdt", u); }
            JSONObject ex = u.optJSONObject("ex"); if (ex == null) { ex = new JSONObject(); u.put("ex", ex); }
            try {
                JSONObject s = new JSONObject(get("https://apiv2.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls")).getJSONObject("stats").getJSONObject("usdt-rls");
                ex.put("nobitex", new JSONObject().put("p", s.getDouble("latest") / 10).put("buy", s.getDouble("bestSell") / 10).put("sell", s.getDouble("bestBuy") / 10).put("ch", s.optDouble("dayChange")).put("t", now));
            } catch (Exception ignored) { }
            try {
                JSONObject r = new JSONObject(get("https://api.wallex.ir/v1/depth?symbol=USDTTMN")).getJSONObject("result");
                double a = r.getJSONArray("ask").getJSONObject(0).getDouble("price"), b = r.getJSONArray("bid").getJSONObject(0).getDouble("price");
                ex.put("wallex", new JSONObject().put("p", (a + b) / 2).put("buy", a).put("sell", b).put("t", now));
            } catch (Exception ignored) { }
            try {
                JSONObject r = new JSONObject(get("https://api1.tabdeal.org/r/api/v1/depth?symbol=USDTIRT&limit=5"));
                double a = r.getJSONArray("asks").getJSONArray(0).getDouble(0), b = r.getJSONArray("bids").getJSONArray(0).getDouble(0);
                ex.put("tabdeal", new JSONObject().put("p", (a + b) / 2).put("buy", a).put("sell", b).put("t", now));
            } catch (Exception ignored) { }
            u.put("t", now);
        } catch (Exception ignored) { }
        try {
            JSONObject cur = new JSONObject(get("https://call1.tgju.org/ajax.json")).getJSONObject("current");
            JSONObject ir = w.optJSONObject("ir"); if (ir == null) { ir = new JSONObject(); w.put("ir", ir); }
            JSONObject d = cur.getJSONObject("price_dollar_rl");
            ir.put("usd", num(d.getString("p")) / 10).put("ch", ("low".equals(d.optString("dt")) ? -1 : 1) * d.optDouble("dp", 0));
            if (cur.has("geram18")) ir.put("g18", num(cur.getJSONObject("geram18").getString("p")) / 10);
            if (cur.has("sekee")) ir.put("emami", num(cur.getJSONObject("sekee").getString("p")) / 10);
            ir.put("t", System.currentTimeMillis());
        } catch (Exception ignored) { }
        try {
            JSONArray a = new JSONArray(get("https://data-api.binance.vision/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D"));
            JSONObject cr = w.optJSONObject("cr"); if (cr == null) { cr = new JSONObject(); w.put("cr", cr); }
            for (int i = 0; i < a.length(); i++) {
                JSONObject t = a.getJSONObject(i);
                String k = t.getString("symbol").replace("USDT", "").toLowerCase(Locale.US);
                cr.put(k, new JSONObject().put("p", t.getDouble("lastPrice")).put("ch", t.getDouble("priceChangePercent")));
            }
            cr.put("t", System.currentTimeMillis());
        } catch (Exception ignored) { }
        try {
            JSONObject f = new JSONObject(get("https://api.alternative.me/fng/?limit=1")).getJSONArray("data").getJSONObject(0);
            JSONObject cr = w.optJSONObject("cr"); if (cr == null) { cr = new JSONObject(); w.put("cr", cr); }
            cr.put("fng", f.getInt("value"));
        } catch (Exception ignored) { }
        save(c, w.toString());
    }

    static String get(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(8000); c.setReadTimeout(10000);
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) NabzBazar/1.4");
        c.setRequestProperty("Accept", "application/json");
        try { if (c.getResponseCode() != 200) throw new Exception("http " + c.getResponseCode()); return read(c.getInputStream()); } finally { c.disconnect(); }
    }

    static String read(InputStream in) throws Exception {
        ByteArrayOutputStream bo = new ByteArrayOutputStream(16384); byte[] b = new byte[16384]; int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n);
        return bo.toString("UTF-8");
    }

    static double num(String s) { try { return Double.parseDouble(s.replace(",", "")); } catch (Exception e) { return Double.NaN; } }

    /* ---------------- Persian formatting ---------------- */
    static String n(double v, int dec) {
        if (Double.isNaN(v) || Double.isInfinite(v)) return "—";
        NumberFormat f = NumberFormat.getNumberInstance(FA);
        f.setMinimumFractionDigits(dec); f.setMaximumFractionDigits(dec);
        return f.format(v);
    }
    static String digits(String s) {
        StringBuilder b = new StringBuilder();
        for (char ch : s.toCharArray()) b.append(ch >= '0' && ch <= '9' ? (char) ('۰' + (ch - '0')) : ch == '.' ? '٫' : ch == '%' ? '٪' : ch);
        return b.toString();
    }
    static String pct(double v) { return Double.isNaN(v) ? "" : (v > 0.005 ? "▲ " : v < -0.005 ? "▼ " : "") + n(Math.abs(v), 2) + "٪"; }
    static String mil(double v) { return Double.isNaN(v) ? "—" : n(v / 1e6, 2) + " م"; }
    static String time(long t) {
        if (t <= 0) return "";
        java.time.ZonedDateTime z = java.time.Instant.ofEpochMilli(t).atZone(java.time.ZoneId.of("Asia/Tehran"));
        return digits(String.format(Locale.US, "%02d:%02d", z.getHour(), z.getMinute()));
    }
    static int fgColor(int v) { return v < 25 ? 0xFFD93A3F : v < 45 ? 0xFFF08A4B : v <= 55 ? 0xFFA6A6AE : v <= 75 ? 0xFF7CC46B : 0xFF15A34A; }
    static String fgWord(int v) { return v < 25 ? "ترس شدید" : v < 45 ? "ترس" : v <= 55 ? "خنثی" : v <= 75 ? "طمع" : "طمع شدید"; }

    /* ---------------- small charts drawn as bitmaps ---------------- */
    static Bitmap spark(double[] pts, int w, int h, int color) {
        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        if (pts == null || pts.length < 2) return bm;
        Canvas cv = new Canvas(bm);
        double mn = Double.MAX_VALUE, mx = -Double.MAX_VALUE; for (double p : pts) { mn = Math.min(mn, p); mx = Math.max(mx, p); }
        double r = mx - mn == 0 ? 1 : mx - mn; float pad = h * .12f;
        Path line = new Path();
        float px = 0, py = 0;
        for (int i = 0; i < pts.length; i++) {
            float x = (float) i * w / (pts.length - 1), y = pad + (float) ((1 - (pts[i] - mn) / r) * (h - 2 * pad));
            if (i == 0) line.moveTo(x, y); else { float cx = (px + x) / 2; line.cubicTo(cx, py, cx, y, x, y); }
            px = x; py = y;
        }
        Path fill = new Path(line); fill.lineTo(w, h); fill.lineTo(0, h); fill.close();
        Paint pf = new Paint(Paint.ANTI_ALIAS_FLAG);
        pf.setShader(new LinearGradient(0, 0, 0, h, (color & 0x00FFFFFF) | 0x2E000000, color & 0x00FFFFFF, Shader.TileMode.CLAMP));
        cv.drawPath(fill, pf);
        Paint pl = new Paint(Paint.ANTI_ALIAS_FLAG); pl.setStyle(Paint.Style.STROKE); pl.setStrokeWidth(h * .045f + 1.5f); pl.setColor(color); pl.setStrokeCap(Paint.Cap.ROUND);
        cv.drawPath(line, pl);
        Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG); dot.setColor(color); cv.drawCircle(px - 3, py, h * .07f + 2, dot);
        return bm;
    }

    /** five bars, left = strong sell … right = strong buy; the active one is coloured */
    static Bitmap meter(double score, int w, int h, int off) {
        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888); Canvas cv = new Canvas(bm);
        int at = (int) Math.round((score + 1) * 2); float gap = h * .6f, bw = (w - gap * 4) / 5f;
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (int i = 0; i < 5; i++) {
            p.setColor(i == at ? (i < 2 ? 0xFFE5484D : i > 2 ? 0xFF15A34A : 0xFFA6A6AE) : off);
            float x = i * (bw + gap); cv.drawRoundRect(new RectF(x, 0, x + bw, h), h / 2f, h / 2f, p);
        }
        return bm;
    }

    /** fear & greed: one smooth gradient arc, solid up to the value, with a knob and the number */
    static Bitmap gauge(int v, int w, int h, int card) {
        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888); Canvas cv = new Canvas(bm);
        float sw = h * .14f, R = Math.min(w / 2f, h) - sw, cx = w / 2f, cy = h - sw / 2f - 1;
        RectF oval = new RectF(cx - R, cy - R, cx + R, cy + R);
        int[] cols = { 0xFFD93A3F, 0xFFF08A4B, 0xFFA6A6AE, 0xFF7CC46B, 0xFF15A34A };
        Shader sh = new LinearGradient(cx - R, 0, cx + R, 0, cols, new float[]{0, .3f, .5f, .7f, 1}, Shader.TileMode.CLAMP);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG); p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(sw); p.setStrokeCap(Paint.Cap.ROUND); p.setShader(sh);
        p.setAlpha(56); cv.drawArc(oval, 180, 180, false, p);
        p.setAlpha(255); if (v > 0) cv.drawArc(oval, 180, 180f * v / 100f, false, p);
        double a = Math.PI - v / 100.0 * Math.PI; float kx = cx + (float) (R * Math.cos(a)), ky = cy - (float) (R * Math.sin(a));
        Paint k = new Paint(Paint.ANTI_ALIAS_FLAG); k.setColor(card); cv.drawCircle(kx, ky, sw * .8f, k);
        k.setStyle(Paint.Style.STROKE); k.setStrokeWidth(sw * .38f); k.setColor(fgColor(v)); cv.drawCircle(kx, ky, sw * .8f, k);
        Paint t = new Paint(Paint.ANTI_ALIAS_FLAG); t.setColor(fgColor(v)); t.setTextSize(h * .36f); t.setFakeBoldText(true); t.setTextAlign(Paint.Align.CENTER);
        cv.drawText(n(v, 0), cx, cy - sw * .2f, t);
        return bm;
    }
}
