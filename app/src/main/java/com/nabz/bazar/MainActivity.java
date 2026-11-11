package com.nabz.bazar;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    WebView web;
    Bridge bridge;
    volatile int insetTop = 28, insetBottom = 16;
    private ConnectivityManager.NetworkCallback netCb;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 29) { w.setNavigationBarContrastEnforced(false); w.setStatusBarContrastEnforced(false); }
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false);
        } else {
            w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        if (Build.VERSION.SDK_INT >= 28) {
            w.getAttributes().layoutInDisplayCutoutMode = android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        web = new WebView(this);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        web.setBackgroundColor(night ? Color.BLACK : Color.rgb(243, 243, 245));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setSupportZoom(false);
        web.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);

        bridge = new Bridge(this);
        web.addJavascriptInterface(bridge, "NBN");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String sc = u.getScheme();
                if ("http".equals(sc) || "https".equals(sc)) { openExternal(u.toString()); return true; }
                return false;
            }
        });
        /* The app draws edge to edge, so Android does not shrink it for the keyboard by itself.
           The root view is padded by the keyboard's height instead, which shrinks the WebView to the part above it. */
        android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        root.setOnApplyWindowInsetsListener((v, ins) -> {
            float d = getResources().getDisplayMetrics().density;
            int top, bot, kb;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = ins.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                top = i.top; bot = i.bottom;
                kb = ins.isVisible(WindowInsets.Type.ime()) ? ins.getInsets(WindowInsets.Type.ime()).bottom : 0;
            } else {
                top = ins.getSystemWindowInsetTop(); bot = ins.getSystemWindowInsetBottom();
                kb = bot > 120 * d ? bot : 0;           /* below Android 11 the keyboard is part of this inset */
                if (kb > 0) bot = 0;
            }
            v.setPadding(0, 0, 0, kb);
            insetTop = Math.round(top / d); insetBottom = kb > 0 ? 0 : Math.round(bot / d);
            js("window.NBinsets&&NBinsets(" + insetTop + "," + insetBottom + ");window.NBkb&&NBkb(" + Math.round(kb / d) + ")");
            return ins;
        });
        setContentView(root);
        pendingTab = tabOf(getIntent());
        web.loadUrl("file:///android_asset/www/index.html");
        watchNetwork();
        WidgetJob.schedule(this);
    }

    /* a tap on a widget page opens the app on that tab */
    volatile String pendingTab = null;
    static String tabOf(Intent i) { return i == null ? null : i.getStringExtra("tab"); }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String t = tabOf(intent);
        if (t != null && t.matches("[a-z]+")) js("window.NB&&NB.App&&NB.App.show('" + t + "')");
    }

    void js(String code) {
        if (web == null) return;
        web.post(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    void openExternal(String url) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { }
    }

    void setBars(boolean dark) {
        runOnUiThread(() -> {
            Window w = getWindow();
            if (Build.VERSION.SDK_INT >= 30) {
                WindowInsetsController c = w.getInsetsController();
                if (c != null) {
                    int f = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                    c.setSystemBarsAppearance(dark ? 0 : f, f);
                }
            } else {
                View dv = w.getDecorView();
                int v = dv.getSystemUiVisibility();
                int f = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                dv.setSystemUiVisibility(dark ? (v & ~f) : (v | f));
            }
            web.setBackgroundColor(dark ? Color.BLACK : Color.rgb(243, 243, 245));
        });
    }

    String netState() {
        try {
            ConnectivityManager cm = getSystemService(ConnectivityManager.class);
            Network n = cm.getActiveNetwork();
            NetworkCapabilities c = n == null ? null : cm.getNetworkCapabilities(n);
            if (c == null) return "{\"online\":false,\"vpn\":false,\"metered\":true}";
            boolean vpn = c.hasTransport(NetworkCapabilities.TRANSPORT_VPN);
            boolean metered = !c.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED);
            boolean wifi = c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
            return "{\"online\":true,\"vpn\":" + vpn + ",\"metered\":" + metered + ",\"wifi\":" + wifi + "}";
        } catch (Exception e) {
            return "{\"online\":true,\"vpn\":false,\"metered\":true}";
        }
    }

    private void watchNetwork() {
        try {
            ConnectivityManager cm = getSystemService(ConnectivityManager.class);
            netCb = new ConnectivityManager.NetworkCallback() {
                @Override public void onCapabilitiesChanged(Network n, NetworkCapabilities c) { js("window.NBnet&&NBnet(" + netState() + ")"); }
                @Override public void onLost(Network n) { js("window.NBnet&&NBnet(" + netState() + ")"); }
            };
            cm.registerDefaultNetworkCallback(netCb);
        } catch (Exception ignored) { }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.NBback?NBback():false", v -> {
            if (!"true".equals(v)) moveTaskToBack(true);
        });
    }

    @Override protected void onPause() { super.onPause(); if (web != null) { web.onPause(); js("window.NBvis&&NBvis(false)"); } }
    @Override protected void onResume() { super.onResume(); if (web != null) { web.onResume(); js("window.NBvis&&NBvis(true)"); } }

    @Override
    protected void onDestroy() {
        try { if (netCb != null) getSystemService(ConnectivityManager.class).unregisterNetworkCallback(netCb); } catch (Exception ignored) { }
        if (bridge != null) bridge.shutdown();
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
