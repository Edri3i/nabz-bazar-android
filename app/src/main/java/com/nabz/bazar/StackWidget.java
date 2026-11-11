package com.nabz.bazar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

/** The swipeable stack widget (Smart Stack style). Pages come from WidgetService; data from WidgetData. */
public class StackWidget extends AppWidgetProvider {
    static final String ACTION_REFRESH = "com.nabz.bazar.WIDGET_REFRESH";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx, id));
        WidgetJob.schedule(ctx);
    }

    static RemoteViews build(Context ctx, int id) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_stack);
        Intent svc = new Intent(ctx, WidgetService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        rv.setRemoteAdapter(R.id.w_stack, svc);
        rv.setEmptyView(R.id.w_stack, R.id.w_empty);

        /* a tap on a page opens that tab of the app */
        int mut = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setPendingIntentTemplate(R.id.w_stack, PendingIntent.getActivity(ctx, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | mut));
        rv.setOnClickPendingIntent(R.id.w_empty, PendingIntent.getActivity(ctx, 2, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        Intent ref = new Intent(ctx, StackWidget.class).setAction(ACTION_REFRESH);
        rv.setOnClickPendingIntent(R.id.w_refresh, PendingIntent.getBroadcast(ctx, 3, ref, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return rv;
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            final PendingResult pr = goAsync();
            new Thread(() -> {
                try { WidgetData.fetch(ctx); } catch (Exception ignored) { }
                notifyChanged(ctx);
                pr.finish();
            }).start();
        }
    }

    @Override public void onEnabled(Context ctx) { WidgetJob.schedule(ctx); }
    @Override public void onDisabled(Context ctx) { if (allIds(ctx).length == 0) WidgetJob.cancel(ctx); }

    static int[] ids(Context ctx) {
        return AppWidgetManager.getInstance(ctx).getAppWidgetIds(new ComponentName(ctx, StackWidget.class));
    }
    static int[] flipIds(Context ctx) {
        return AppWidgetManager.getInstance(ctx).getAppWidgetIds(new ComponentName(ctx, FlipWidget.class));
    }
    static int[] allIds(Context ctx) {
        int[] a = ids(ctx), b = flipIds(ctx), r = new int[a.length + b.length];
        System.arraycopy(a, 0, r, 0, a.length); System.arraycopy(b, 0, r, a.length, b.length);
        return r;
    }

    /** redraw every page of every placed widget (both kinds) */
    static void notifyChanged(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] a = ids(ctx), b = flipIds(ctx);
        if (a.length > 0) m.notifyAppWidgetViewDataChanged(a, R.id.w_stack);
        if (b.length > 0) m.notifyAppWidgetViewDataChanged(b, R.id.w_flip);
    }
}
