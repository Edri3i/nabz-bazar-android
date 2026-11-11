package com.nabz.bazar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

/** "Single card" widget: one full-size card at a time, ▲ ▼ flip the pages (every card is the same size). */
public class FlipWidget extends AppWidgetProvider {
    static final String PREV = "com.nabz.bazar.FLIP_PREV", NEXT = "com.nabz.bazar.FLIP_NEXT", REFRESH = "com.nabz.bazar.FLIP_REFRESH";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx, id));
        WidgetJob.schedule(ctx);
    }

    static PendingIntent action(Context ctx, String a, int id, int req) {
        Intent i = new Intent(ctx, FlipWidget.class).setAction(a).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        return PendingIntent.getBroadcast(ctx, req * 100000 + id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static RemoteViews build(Context ctx, int id) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_flip);
        Intent svc = new Intent(ctx, WidgetService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        svc.putExtra("mode", "flip");
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        rv.setRemoteAdapter(R.id.w_flip, svc);
        rv.setEmptyView(R.id.w_flip, R.id.w_empty);
        int mut = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setPendingIntentTemplate(R.id.w_flip, PendingIntent.getActivity(ctx, 11, open, PendingIntent.FLAG_UPDATE_CURRENT | mut));
        rv.setOnClickPendingIntent(R.id.w_empty, PendingIntent.getActivity(ctx, 12, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        rv.setOnClickPendingIntent(R.id.w_prev, action(ctx, PREV, id, 1));
        rv.setOnClickPendingIntent(R.id.w_next, action(ctx, NEXT, id, 2));
        rv.setOnClickPendingIntent(R.id.w_refresh, action(ctx, REFRESH, id, 3));
        return rv;
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if ((PREV.equals(a) || NEXT.equals(a)) && id != AppWidgetManager.INVALID_APPWIDGET_ID) {
            RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_flip);
            if (NEXT.equals(a)) rv.showNext(R.id.w_flip); else rv.showPrevious(R.id.w_flip);
            AppWidgetManager.getInstance(ctx).partiallyUpdateAppWidget(id, rv);
        } else if (REFRESH.equals(a)) {
            final PendingResult pr = goAsync();
            new Thread(() -> {
                try { WidgetData.fetch(ctx); } catch (Exception ignored) { }
                StackWidget.notifyChanged(ctx);
                pr.finish();
            }).start();
        }
    }

    @Override public void onEnabled(Context ctx) { WidgetJob.schedule(ctx); }
    @Override public void onDisabled(Context ctx) { if (StackWidget.allIds(ctx).length == 0) WidgetJob.cancel(ctx); }
}
