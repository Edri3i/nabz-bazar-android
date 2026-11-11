package com.nabz.bazar;

import android.util.JsonReader;
import android.util.JsonToken;
import android.view.HapticFeedbackConstants;
import android.webkit.JavascriptInterface;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Native side of the web UI: plain HTTP without CORS, a small file cache, haptics and system info. */
public class Bridge {
    private final MainActivity act;
    private final ExecutorService pool = Executors.newFixedThreadPool(24);
    private final ConcurrentHashMap<String, String> results = new ConcurrentHashMap<>();
    private final File cacheDir;

    Bridge(MainActivity a) {
        act = a;
        cacheDir = new File(a.getFilesDir(), "c");
        cacheDir.mkdirs();
    }

    void shutdown() { pool.shutdownNow(); }

    /* ---------------- http ---------------- */
    @JavascriptInterface
    public void req(final String id, final String url, final String method, final String body, final int timeoutMs) {
        reqH(id, url, method, body, timeoutMs, "");
    }

    /** same as req, with extra request headers given as a flat JSON object (e.g. a GitHub token) */
    @JavascriptInterface
    public void reqH(final String id, final String url, final String method, final String body, final int timeoutMs, final String headersJson) {
        pool.execute(() -> {
            int status = 0;
            String text = "";
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(url).openConnection();
                int t = timeoutMs > 0 ? timeoutMs : 12000;
                c.setConnectTimeout(Math.min(t, 8000));
                c.setReadTimeout(t);
                c.setInstanceFollowRedirects(true);
                c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) NabzBazar/1.0");
                c.setRequestProperty("Accept", "application/json, text/plain, */*");
                if (headersJson != null && !headersJson.isEmpty()) {
                    org.json.JSONObject h = new org.json.JSONObject(headersJson);
                    java.util.Iterator<String> it = h.keys();
                    while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, h.optString(k)); }
                }
                if (body != null && !body.isEmpty() && !"GET".equals(method)) {
                    c.setRequestMethod(method == null ? "POST" : method);
                    c.setDoOutput(true);
                    c.setRequestProperty("Content-Type", "application/json");
                    byte[] bb = body.getBytes(StandardCharsets.UTF_8);
                    c.setFixedLengthStreamingMode(bb.length);
                    try (OutputStream os = c.getOutputStream()) { os.write(bb); }
                }
                status = c.getResponseCode();
                InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                text = in == null ? "" : readAll(in);
            } catch (Exception e) {
                status = 0;
                text = String.valueOf(e.getClass().getSimpleName());
            } finally {
                if (c != null) c.disconnect();
            }
            results.put(id, text);
            act.js("NBdone('" + id + "'," + status + ")");
        });
    }

    @JavascriptInterface
    public String take(String id) {
        String s = results.remove(id);
        return s == null ? "" : s;
    }

    private static String readAll(InputStream in) throws Exception {
        try (InputStream is = new BufferedInputStream(in)) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream(16384);
            byte[] buf = new byte[16384];
            int n;
            while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
            return bo.toString("UTF-8");
        }
    }

    /* ---------------- Hyperliquid leaderboard digest ----------------
       The public leaderboard is ~39 MB of JSON. It is streamed here and only the top wallets by
       30-day PnL are kept, so the web side never holds the whole file. */
    @JavascriptInterface
    public void hlTop(final String id, final int n) {
        pool.execute(() -> {
            int status = 0;
            String out = "";
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL("https://stats-data.hyperliquid.xyz/Mainnet/leaderboard").openConnection();
                c.setConnectTimeout(10000);
                c.setReadTimeout(60000);
                c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) NabzBazar/1.0");
                status = c.getResponseCode();
                if (status == 200) {
                    List<double[]> pnl = new ArrayList<>();
                    List<String[]> who = new ArrayList<>();
                    try (JsonReader r = new JsonReader(new InputStreamReader(new BufferedInputStream(c.getInputStream(), 65536), StandardCharsets.UTF_8))) {
                        r.beginObject();
                        while (r.hasNext()) {
                            if (!"leaderboardRows".equals(r.nextName())) { r.skipValue(); continue; }
                            r.beginArray();
                            while (r.hasNext()) {
                                String addr = null, name = null; double acc = 0, month = Double.NaN, roi = 0, all = 0;
                                r.beginObject();
                                while (r.hasNext()) {
                                    String k = r.nextName();
                                    if ("ethAddress".equals(k)) addr = r.nextString();
                                    else if ("displayName".equals(k)) { if (r.peek() == JsonToken.NULL) { r.nextNull(); } else name = r.nextString(); }
                                    else if ("accountValue".equals(k)) acc = parseD(r.nextString());
                                    else if ("windowPerformances".equals(k)) {
                                        r.beginArray();
                                        while (r.hasNext()) {
                                            r.beginArray();
                                            String win = r.nextString();
                                            if ("month".equals(win) || "allTime".equals(win)) {
                                                r.beginObject();
                                                while (r.hasNext()) {
                                                    String f = r.nextName();
                                                    if ("pnl".equals(f)) { double p = parseD(r.nextString()); if ("month".equals(win)) month = p; else all = p; }
                                                    else if ("roi".equals(f) && "month".equals(win)) roi = parseD(r.nextString());
                                                    else r.skipValue();
                                                }
                                                r.endObject();
                                            } else r.skipValue();
                                            while (r.hasNext()) r.skipValue();
                                            r.endArray();
                                        }
                                        r.endArray();
                                    } else r.skipValue();
                                }
                                r.endObject();
                                /* same filter as the original scanner: real accounts (≥ $300k) that are profitable this month and overall */
                                if (addr != null && !Double.isNaN(month) && acc >= 300000 && month > 0 && roi > 0 && all > 0) {
                                    insertTop(pnl, who, new double[]{month, acc}, new String[]{addr, name}, Math.max(1, n));
                                }
                            }
                            r.endArray();
                        }
                        r.endObject();
                    }
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < pnl.size(); i++) {
                        if (i > 0) sb.append(',');
                        sb.append("{\"a\":\"").append(who.get(i)[0]).append("\",\"n\":")
                          .append(who.get(i)[1] == null ? "null" : "\"" + who.get(i)[1].replace("\\", "").replace("\"", "") + "\"")
                          .append(",\"p\":").append(Math.round(pnl.get(i)[0])).append(",\"v\":").append(Math.round(pnl.get(i)[1])).append('}');
                    }
                    out = sb.append(']').toString();
                }
            } catch (Exception e) {
                status = 0;
                out = e.getClass().getSimpleName();
            } finally {
                if (c != null) c.disconnect();
            }
            results.put(id, out);
            act.js("NBdone('" + id + "'," + status + ")");
        });
    }

    private static double parseD(String s) { try { return Double.parseDouble(s); } catch (Exception e) { return 0; } }

    private static void insertTop(List<double[]> v, List<String[]> w, double[] x, String[] y, int n) {
        int i = 0;
        while (i < v.size() && v.get(i)[0] >= x[0]) i++;
        if (i >= n) return;
        v.add(i, x); w.add(i, y);
        if (v.size() > n) { v.remove(v.size() - 1); w.remove(w.size() - 1); }
    }

    /* ---------------- file cache (for data too big for localStorage) ---------------- */
    @JavascriptInterface
    public void save(String key, String value) {
        File f = new File(cacheDir, safe(key));
        try (FileOutputStream fo = new FileOutputStream(f)) { fo.write(value.getBytes(StandardCharsets.UTF_8)); } catch (Exception ignored) { }
    }

    @JavascriptInterface
    public String load(String key) {
        File f = new File(cacheDir, safe(key));
        if (!f.exists()) return "";
        try (FileInputStream fi = new FileInputStream(f)) { return readAll(fi); } catch (Exception e) { return ""; }
    }

    private static String safe(String k) { return k.replaceAll("[^A-Za-z0-9_.-]", "_"); }

    /* ---------------- home-screen widget ---------------- */
    /** the app hands its latest snapshot to the widget, which redraws at once */
    @JavascriptInterface
    public void widget(String json) {
        WidgetData.save(act, json);
        StackWidget.notifyChanged(act);
    }

    /** the tab a widget tap asked for (read once at start-up) */
    @JavascriptInterface
    public String startTab() { String t = act.pendingTab; act.pendingTab = null; return t == null ? "" : t; }

    @JavascriptInterface
    public boolean hasWidget() { return StackWidget.allIds(act).length > 0; }

    /* ---------------- system ---------------- */
    @JavascriptInterface public String net() { return act.netState(); }
    @JavascriptInterface public String insets() { return act.insetTop + "," + act.insetBottom; }
    @JavascriptInterface public void bars(boolean dark) { act.setBars(dark); }
    @JavascriptInterface public void open(String url) { act.runOnUiThread(() -> act.openExternal(url)); }
    @JavascriptInterface public String version() { return "1.5"; }

    @JavascriptInterface
    public void haptic(int kind) {
        act.runOnUiThread(() -> {
            if (act.web == null) return;
            int k = kind == 1 ? HapticFeedbackConstants.CONTEXT_CLICK : kind == 2 ? HapticFeedbackConstants.CLOCK_TICK : HapticFeedbackConstants.KEYBOARD_TAP;
            act.web.performHapticFeedback(k);
        });
    }

    static List<String> unused() { return Collections.emptyList(); }
}
